const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post(
  "/",
  [
    auth,
    [
      body("property", "Property ID is required").not().isEmpty(),
      body("checkIn", "Check-in date is required").isISO8601(),
      body("checkOut", "Check-out date is required").isISO8601(),
      body("guests", "Number of guests is required").isInt({ min: 1 }),
      body("firstName", "First name is required").not().isEmpty(),
      body("lastName", "Last name is required").not().isEmpty(),
      body("email", "Valid email is required").isEmail(),
      body("phone", "Phone number is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        property: propertyId,
        checkIn,
        checkOut,
        guests,
        firstName,
        lastName,
        email,
        phone,
        specialRequests,
      } = req.body;

      // Check if property exists
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Validate dates
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkInDate < today) {
        return res
          .status(400)
          .json({ message: "Check-in date cannot be in the past" });
      }

      if (checkOutDate <= checkInDate) {
        return res
          .status(400)
          .json({ message: "Check-out date must be after check-in date" });
      }

      // Check availability
      const existingBooking = await Booking.findOne({
        property: propertyId,
        status: { $in: ["confirmed", "checked_in"] },
        $or: [
          {
            checkIn: { $lte: checkInDate },
            checkOut: { $gt: checkInDate },
          },
          {
            checkIn: { $lt: checkOutDate },
            checkOut: { $gte: checkOutDate },
          },
          {
            checkIn: { $gte: checkInDate },
            checkOut: { $lte: checkOutDate },
          },
        ],
      });

      if (existingBooking) {
        return res
          .status(400)
          .json({ message: "Property is not available for selected dates" });
      }

      // Calculate total price
      const nights = Math.ceil(
        (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
      );
      const totalPrice = nights * property.price;

      // Create booking
      const booking = new Booking({
        user: req.user.id,
        property: propertyId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        nights,
        totalPrice,
        guestInfo: {
          firstName,
          lastName,
          email,
          phone,
        },
        specialRequests,
      });

      await booking.save();

      // Populate property details for response
      await booking.populate(
        "property",
        "name city country imageUrls price type"
      );

      res.status(201).json({
        message: "Booking created successfully",
        booking,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/bookings
// @desc    Get user's bookings or all bookings (admin)
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    let query = {};

    // Regular users can only see their own bookings
    if (req.user.role !== "admin") {
      query.user = req.user.id;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.checkIn = {};
      if (startDate) query.checkIn.$gte = new Date(startDate);
      if (endDate) query.checkIn.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate("property", "name city country imageUrls price type")
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };

    // Regular users can only see their own bookings
    if (req.user.role !== "admin") {
      query.user = req.user.id;
    }

    const booking = await Booking.findOne(query)
      .populate("property", "name city country imageUrls price type features")
      .populate("user", "firstName lastName email phone");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };

    // Regular users can only cancel their own bookings
    if (req.user.role !== "admin") {
      query.user = req.user.id;
    }

    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    if (booking.status === "completed") {
      return res
        .status(400)
        .json({ message: "Cannot cancel completed booking" });
    }

    // Check if cancellation is allowed (e.g., 24 hours before check-in)
    const checkInDate = new Date(booking.checkIn);
    const now = new Date();
    const timeDiff = checkInDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);

    if (hoursDiff < 24 && req.user.role !== "admin") {
      return res.status(400).json({
        message: "Cancellation not allowed within 24 hours of check-in",
      });
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    await booking.save();

    res.json({ message: "Booking cancelled successfully", booking });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/bookings/:id/confirm
// @desc    Confirm a booking (admin only)
// @access  Private (Admin)
router.put("/:id/confirm", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending bookings can be confirmed" });
    }

    booking.status = "confirmed";
    booking.confirmedAt = new Date();
    await booking.save();

    res.json({ message: "Booking confirmed successfully", booking });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/bookings/:id/checkin
// @desc    Check-in a booking
// @access  Private (Admin)
router.put("/:id/checkin", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "confirmed") {
      return res
        .status(400)
        .json({ message: "Only confirmed bookings can be checked in" });
    }

    booking.status = "checked_in";
    booking.checkedInAt = new Date();
    await booking.save();

    res.json({ message: "Check-in successful", booking });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/bookings/:id/checkout
// @desc    Check-out a booking
// @access  Private (Admin)
router.put("/:id/checkout", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "checked_in") {
      return res
        .status(400)
        .json({ message: "Only checked-in bookings can be checked out" });
    }

    booking.status = "completed";
    booking.checkedOutAt = new Date();
    await booking.save();

    res.json({ message: "Check-out successful", booking });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/bookings/:id/payment
// @desc    Update booking payment information
// @access  Private
router.post(
  "/:id/payment",
  [
    auth,
    [
      body("bankName", "Bank name is required").not().isEmpty(),
      body("bankHolder", "Bank holder name is required").not().isEmpty(),
      body("proofPayment", "Proof of payment is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let query = { _id: req.params.id };

      // Regular users can only update their own bookings
      if (req.user.role !== "admin") {
        query.user = req.user.id;
      }

      const booking = await Booking.findOne(query);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const { bankName, bankHolder, proofPayment } = req.body;

      booking.paymentInfo = {
        bankName,
        bankHolder,
        proofPayment,
        paidAt: new Date(),
      };

      await booking.save();

      res.json({
        message: "Payment information updated successfully",
        booking,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
