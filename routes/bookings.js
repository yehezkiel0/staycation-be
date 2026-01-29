const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { body } = require("express-validator");
const bookingController = require("../controllers/bookingController");

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
      body("guests.adults", "Number of guests is required").isInt({ min: 1 }),
      body("firstName", "First name is required").not().isEmpty(),
      body("lastName", "Last name is required").not().isEmpty(),
      body("email", "Valid email is required").isEmail(),
      body("phone", "Phone number is required").not().isEmpty(),
    ],
  ],
  bookingController.createBooking,
);

// @route   POST /api/bookings/reset
// @desc    Reset bookings (keep latest 50)
// @access  Private (Admin)
router.post("/reset", auth, bookingController.resetBookings);

// @route   GET /api/bookings
// @desc    Get user's bookings or all bookings (admin)
// @access  Private
router.get("/", auth, bookingController.getBookings);

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get("/:id", auth, bookingController.getBookingById);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put("/:id/cancel", auth, bookingController.cancelBooking);

// @route   PUT /api/bookings/:id/confirm
// @desc    Confirm a booking (admin only)
// @access  Private (Admin)
router.put("/:id/confirm", auth, bookingController.confirmBooking);

// @route   PUT /api/bookings/:id/checkin
// @desc    Check-in a booking
// @access  Private (Admin)
router.put("/:id/checkin", auth, bookingController.checkInBooking);

// @route   PUT /api/bookings/:id/checkout
// @desc    Check-out a booking
// @access  Private (Admin)
router.put("/:id/checkout", auth, bookingController.checkOutBooking);

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
  bookingController.updatePayment,
);

module.exports = router;
