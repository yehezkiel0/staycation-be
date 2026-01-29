const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const { protect } = require("../middleware/auth");
const authController = require("../controllers/authController");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post(
  "/register",
  [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  authController.register,
);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  authController.login,
);

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, authController.getMe);

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
router.put(
  "/me",
  protect,
  [
    body("firstName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("First name cannot be empty"),
    body("lastName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Last name cannot be empty"),
    body("phone")
      .optional({ checkFalsy: true })
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage("Invalid phone number"),
  ],
  authController.updateDetails,
);

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
router.put(
  "/password",
  protect,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  authController.updatePassword,
);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post("/logout", protect, authController.logout);

module.exports = router;
