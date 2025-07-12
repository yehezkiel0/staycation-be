const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Property = require("../models/Property");
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post(
  "/",
  [
    auth,
    [
      body("property", "Property ID is required").not().isEmpty(),
      body("rating", "Rating is required and must be between 1 and 5").isInt({
        min: 1,
        max: 5,
      }),
      body("comment", "Review comment is required").isLength({ min: 10 }),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { property: propertyId, rating, comment } = req.body;

      // Check if property exists
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Check if user has a completed booking for this property
      const booking = await Booking.findOne({
        user: req.user.id,
        property: propertyId,
        status: "completed",
      });

      if (!booking) {
        return res.status(400).json({
          message: "You can only review properties you have stayed at",
        });
      }

      // Check if user has already reviewed this property
      const existingReview = await Review.findOne({
        user: req.user.id,
        property: propertyId,
      });

      if (existingReview) {
        return res.status(400).json({
          message: "You have already reviewed this property",
        });
      }

      // Create review
      const review = new Review({
        user: req.user.id,
        property: propertyId,
        booking: booking._id,
        rating,
        comment,
      });

      await review.save();

      // Update property rating
      await updatePropertyRating(propertyId);

      // Populate user details for response
      await review.populate("user", "firstName lastName avatar");

      res.status(201).json({
        message: "Review created successfully",
        review,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/reviews
// @desc    Get reviews with filtering options
// @access  Public
router.get("/", async (req, res) => {
  try {
    const {
      property,
      user,
      rating,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    let query = {};

    if (property) query.property = property;
    if (user) query.user = user;
    if (rating) query.rating = rating;

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const reviews = await Review.find(query)
      .populate("user", "firstName lastName avatar")
      .populate("property", "name city country imageUrls")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/reviews/:id
// @desc    Get review by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate("user", "firstName lastName avatar")
      .populate("property", "name city country imageUrls")
      .populate("booking", "checkIn checkOut");

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private
router.put(
  "/:id",
  [
    auth,
    [
      body("rating", "Rating must be between 1 and 5")
        .optional()
        .isInt({ min: 1, max: 5 }),
      body("comment", "Review comment must be at least 10 characters")
        .optional()
        .isLength({ min: 10 }),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const review = await Review.findById(req.params.id);

      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      // Check if user owns this review or is admin
      if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { rating, comment } = req.body;

      if (rating) review.rating = rating;
      if (comment) review.comment = comment;
      review.updatedAt = new Date();

      await review.save();

      // Update property rating if rating changed
      if (rating) {
        await updatePropertyRating(review.property);
      }

      // Populate user details for response
      await review.populate("user", "firstName lastName avatar");

      res.json({
        message: "Review updated successfully",
        review,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if user owns this review or is admin
    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const propertyId = review.property;
    await Review.findByIdAndDelete(req.params.id);

    // Update property rating
    await updatePropertyRating(propertyId);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.post("/:id/helpful", auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if user already marked this review as helpful
    if (review.helpfulVotes.includes(req.user.id)) {
      return res
        .status(400)
        .json({ message: "You have already marked this review as helpful" });
    }

    review.helpfulVotes.push(req.user.id);
    await review.save();

    res.json({
      message: "Review marked as helpful",
      helpfulCount: review.helpfulVotes.length,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/reviews/:id/helpful
// @desc    Remove helpful mark from review
// @access  Private
router.delete("/:id/helpful", auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Remove user from helpful votes
    review.helpfulVotes = review.helpfulVotes.filter(
      (userId) => userId.toString() !== req.user.id
    );
    await review.save();

    res.json({
      message: "Helpful mark removed",
      helpfulCount: review.helpfulVotes.length,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/reviews/:id/report
// @desc    Report a review
// @access  Private
router.post(
  "/:id/report",
  [auth, [body("reason", "Report reason is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const review = await Review.findById(req.params.id);

      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      const { reason } = req.body;

      // Check if user already reported this review
      const existingReport = review.reports.find(
        (report) => report.reportedBy.toString() === req.user.id
      );

      if (existingReport) {
        return res
          .status(400)
          .json({ message: "You have already reported this review" });
      }

      review.reports.push({
        reportedBy: req.user.id,
        reason,
        reportedAt: new Date(),
      });

      await review.save();

      res.json({ message: "Review reported successfully" });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Helper function to update property rating
async function updatePropertyRating(propertyId) {
  try {
    const reviews = await Review.find({ property: propertyId });

    if (reviews.length === 0) {
      await Property.findByIdAndUpdate(propertyId, {
        rating: 0,
        reviewCount: 0,
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

    await Property.findByIdAndUpdate(propertyId, {
      rating: averageRating,
      reviewCount: reviews.length,
    });
  } catch (error) {
    console.error("Error updating property rating:", error);
  }
}

module.exports = router;
