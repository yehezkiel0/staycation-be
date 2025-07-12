const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  [
    auth,
    [
      body("firstName", "First name is required").not().isEmpty(),
      body("lastName", "Last name is required").not().isEmpty(),
      body("email", "Please include a valid email").isEmail(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, phone, avatar, preferences } = req.body;

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if email is already taken by another user
      if (email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: "Email is already in use" });
        }
      }

      // Update user fields
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.email = email || user.email;
      user.phone = phone || user.phone;
      user.avatar = avatar || user.avatar;
      user.preferences = preferences || user.preferences;
      user.updatedAt = Date.now();

      await user.save();

      res.json({
        message: "Profile updated successfully",
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          preferences: user.preferences,
          role: user.role,
          verified: user.verified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/users/favorites
// @desc    Get user's favorite properties
// @access  Private
router.get("/favorites", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("favorites");
    res.json(user.favorites);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/users/favorites/:propertyId
// @desc    Add property to favorites
// @access  Private
router.post("/favorites/:propertyId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { propertyId } = req.params;

    if (user.favorites.includes(propertyId)) {
      return res.status(400).json({ message: "Property already in favorites" });
    }

    user.favorites.push(propertyId);
    await user.save();

    res.json({ message: "Property added to favorites" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/users/favorites/:propertyId
// @desc    Remove property from favorites
// @access  Private
router.delete("/favorites/:propertyId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { propertyId } = req.params;

    user.favorites = user.favorites.filter(
      (fav) => fav.toString() !== propertyId
    );
    await user.save();

    res.json({ message: "Property removed from favorites" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/users/bookings
// @desc    Get user's bookings
// @access  Private
router.get("/bookings", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user.id };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("property", "name city country imageUrls price")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/users/notifications
// @desc    Get user notifications
// @access  Private
router.get("/notifications", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.notifications);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/users/notifications/:notificationId/read
// @desc    Mark notification as read
// @access  Private
router.put("/notifications/:notificationId/read", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const notification = user.notifications.id(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.read = true;
    await user.save();

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
