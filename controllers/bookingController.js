const Booking = require("../models/Booking");
const Property = require("../models/Property");
const { validationResult } = require("express-validator");

// @route   POST /api/bookings
// @desc    Create a new booking by user
// @access  Private
exports.createBooking = async (req, res) => {
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
      proofPayment,
      bankName,
      bankHolder,
    } = req.body;

    // Check if property exists
    const propertyData = await Property.findById(propertyId);
    if (!propertyData) {
      return res.status(404).json({ message: "Property not found" });
    }

    // ... later usage ...
    // Fallback price calculation if propertyData.price.amount is used or direct propertyData.price number
    const pricePerNight = propertyData.price.amount || propertyData.price || 0;

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
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24),
    );

    const totalPrice = nights * pricePerNight;

    // Create booking
    const paymentInfoStr = bankName
      ? `\n\nPayment Info:\nBank: ${bankName}\nHolder: ${bankHolder}`
      : "";

    const booking = new Booking({
      user: req.user.id,
      property: propertyId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      nights,
      pricing: {
        basePrice: pricePerNight,
        totalPrice: totalPrice,
      },
      guestDetails: {
        firstName,
        lastName,
        email,
        phone,
        specialRequests: (specialRequests || "") + paymentInfoStr,
      },
      payment: {
        method: "bank_transfer",
        status: "pending",
        transactionId: proofPayment || "",
      },
    });

    await booking.save();

    // Populate property details for response
    await booking.populate(
      "property",
      "name city country imageUrls price type",
    );

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/bookings
// @desc    Get user's bookings or all bookings (admin)
// @access  Private
exports.getBookings = async (req, res) => {
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
};

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
exports.getBookingById = async (req, res) => {
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
    if (error.kind === "ObjectId")
      return res.status(404).json({ message: "Booking not found" });
    res.status(500).json({ message: "Server error" });
  }
};

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
exports.cancelBooking = async (req, res) => {
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
    booking.cancellation = {
      cancelledAt: new Date(),
      reason: req.body.reason || "Cancelled by user",
    };
    await booking.save();

    res.json({ message: "Booking cancelled successfully", booking });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   PUT /api/bookings/:id/confirm
// @desc    Confirm a booking (admin only)
// @access  Private (Admin)
exports.confirmBooking = async (req, res) => {
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
    booking.payment.status = "paid";
    booking.confirmationSentAt = new Date();
    await booking.save();

    res.json({ message: "Booking confirmed successfully", booking });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   PUT /api/bookings/:id/checkin
// @desc    Check-in a booking
// @access  Private (Admin)
exports.checkInBooking = async (req, res) => {
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
    // booking.checkedInAt = new Date(); // removed as it wasn't in schema, or adjust schema
    await booking.save();

    res.json({ message: "Check-in successful", booking });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   PUT /api/bookings/:id/checkout
// @desc    Check-out a booking
// @access  Private (Admin)
exports.checkOutBooking = async (req, res) => {
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
    // booking.checkedOutAt = new Date();
    await booking.save();

    res.json({ message: "Check-out successful", booking });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/bookings/:id/payment
// @desc    Update booking payment information
// @access  Private
exports.updatePayment = async (req, res) => {
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

    booking.payment = {
      ...booking.payment,
      method: "bank_transfer",
      transactionId: proofPayment, // simplified mapping
      status: "paid",
      paidAt: new Date(),
    };

    // Note: original code used paymentInfo, but schema has payment object.
    // Adjusted to match schema better or keep simple.

    await booking.save();

    res.json({
      message: "Payment information updated successfully",
      booking,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/bookings/reset
// @desc    Reset bookings (keep latest 50)
// @access  Private (Admin)
exports.resetBookings = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find the latest 50 bookings
    const latestBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select("_id");

    const latestIds = latestBookings.map((b) => b._id);

    // Delete bookings not in the latest 50
    const result = await Booking.deleteMany({ _id: { $nin: latestIds } });

    res.json({
      message: `Data cleanup successful. Deleted ${result.deletedCount} old bookings.`,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};
