const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const auth = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

// @route   POST /api/payments/create-payment-intent
// @desc    Create a payment intent for booking
// @access  Private
router.post(
  "/create-payment-intent",
  [
    auth,
    [
      body("bookingId", "Booking ID is required").not().isEmpty(),
      body("amount", "Amount is required").isNumeric(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { bookingId, amount } = req.body;

      // Verify booking belongs to user
      const booking = await Booking.findOne({
        _id: bookingId,
        user: req.user.id,
      }).populate("property", "name price");

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify amount matches booking total
      if (amount !== booking.totalPrice) {
        return res
          .status(400)
          .json({ message: "Amount does not match booking total" });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          bookingId: bookingId,
          userId: req.user.id,
          propertyName: booking.property.name,
        },
        description: `Payment for booking at ${booking.property.name}`,
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error("Stripe error:", error);
      res.status(500).json({ message: "Payment intent creation failed" });
    }
  }
);

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment and update booking
// @access  Private
router.post(
  "/confirm-payment",
  [
    auth,
    [
      body("paymentIntentId", "Payment Intent ID is required").not().isEmpty(),
      body("bookingId", "Booking ID is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { paymentIntentId, bookingId } = req.body;

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ message: "Payment not successful" });
      }

      // Verify booking belongs to user
      const booking = await Booking.findOne({
        _id: bookingId,
        user: req.user.id,
      });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Update booking with payment information
      booking.status = "confirmed";
      booking.paymentInfo = {
        stripePaymentIntentId: paymentIntentId,
        amount: paymentIntent.amount / 100, // Convert back from cents
        currency: paymentIntent.currency,
        paidAt: new Date(),
        paymentMethod: "stripe",
      };
      booking.confirmedAt = new Date();

      await booking.save();

      res.json({
        message: "Payment confirmed successfully",
        booking,
      });
    } catch (error) {
      console.error("Payment confirmation error:", error);
      res.status(500).json({ message: "Payment confirmation failed" });
    }
  }
);

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhooks
// @access  Public (Stripe webhook)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log("Payment succeeded:", paymentIntent.id);

        try {
          // Update booking status
          const bookingId = paymentIntent.metadata.bookingId;
          const booking = await Booking.findById(bookingId);

          if (booking && booking.status === "pending") {
            booking.status = "confirmed";
            booking.paymentInfo = {
              stripePaymentIntentId: paymentIntent.id,
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency,
              paidAt: new Date(),
              paymentMethod: "stripe",
            };
            booking.confirmedAt = new Date();
            await booking.save();
          }
        } catch (error) {
          console.error("Error updating booking after payment:", error);
        }
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        console.log("Payment failed:", failedPayment.id);

        try {
          // Update booking status to failed
          const bookingId = failedPayment.metadata.bookingId;
          const booking = await Booking.findById(bookingId);

          if (booking) {
            booking.status = "payment_failed";
            await booking.save();
          }
        } catch (error) {
          console.error("Error updating booking after payment failure:", error);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

// @route   POST /api/payments/refund
// @desc    Process refund for a booking
// @access  Private (Admin only)
router.post(
  "/refund",
  [
    auth,
    [
      body("bookingId", "Booking ID is required").not().isEmpty(),
      body("amount", "Refund amount is required").optional().isNumeric(),
      body("reason", "Refund reason is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { bookingId, amount, reason } = req.body;

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (!booking.paymentInfo || !booking.paymentInfo.stripePaymentIntentId) {
        return res
          .status(400)
          .json({ message: "No payment found for this booking" });
      }

      // Calculate refund amount (full refund if not specified)
      const refundAmount = amount || booking.paymentInfo.amount;

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: booking.paymentInfo.stripePaymentIntentId,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: "requested_by_customer",
        metadata: {
          bookingId: bookingId,
          reason: reason,
        },
      });

      // Update booking with refund information
      booking.status = "refunded";
      booking.refundInfo = {
        stripeRefundId: refund.id,
        amount: refundAmount,
        reason: reason,
        refundedAt: new Date(),
      };

      await booking.save();

      res.json({
        message: "Refund processed successfully",
        refund: {
          id: refund.id,
          amount: refundAmount,
          status: refund.status,
        },
      });
    } catch (error) {
      console.error("Refund error:", error);
      res.status(500).json({ message: "Refund processing failed" });
    }
  }
);

// @route   GET /api/payments/booking/:bookingId
// @desc    Get payment details for a booking
// @access  Private
router.get("/booking/:bookingId", auth, async (req, res) => {
  try {
    let query = { _id: req.params.bookingId };

    // Regular users can only see their own bookings
    if (req.user.role !== "admin") {
      query.user = req.user.id;
    }

    const booking = await Booking.findOne(query).select(
      "paymentInfo refundInfo status"
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({
      bookingId: booking._id,
      status: booking.status,
      paymentInfo: booking.paymentInfo,
      refundInfo: booking.refundInfo,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/payments/stats
// @desc    Get payment statistics (Admin only)
// @access  Private (Admin)
router.get("/stats", auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Total revenue
    const totalRevenue = await Booking.aggregate([
      {
        $match: {
          status: { $in: ["confirmed", "checked_in", "completed"] },
          ...dateFilter,
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    // Total bookings
    const totalBookings = await Booking.countDocuments({
      ...dateFilter,
    });

    // Successful payments
    const successfulPayments = await Booking.countDocuments({
      status: { $in: ["confirmed", "checked_in", "completed"] },
      ...dateFilter,
    });

    // Failed payments
    const failedPayments = await Booking.countDocuments({
      status: "payment_failed",
      ...dateFilter,
    });

    // Refunds
    const refunds = await Booking.aggregate([
      {
        $match: {
          status: "refunded",
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$refundInfo.amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      totalBookings,
      successfulPayments,
      failedPayments,
      refunds: {
        count: refunds[0]?.count || 0,
        amount: refunds[0]?.total || 0,
      },
      successRate:
        totalBookings > 0
          ? ((successfulPayments / totalBookings) * 100).toFixed(2)
          : 0,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
