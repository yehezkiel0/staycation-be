const express = require("express");
const { body, query } = require("express-validator");
const { protect, authorize, optionalAuth } = require("../middleware/auth");
const {
  getProperties,
  getMostPicked,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  toggleFavorite,
  checkAvailability
} = require("../controllers/propertyController");

const router = express.Router();

// Public routes
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("minPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Min price must be positive"),
    query("maxPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Max price must be positive"),
    query("minGuests")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Min guests must be positive"),
    query("rating")
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage("Rating must be between 0 and 5"),
  ],
  getProperties
);

router.get("/most-picked", getMostPicked);
router.get("/:id", optionalAuth, getProperty);
router.get("/:id/availability", checkAvailability);

// Protected routes
router.post(
  "/",
  protect,
  authorize("agent", "admin"),
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("category").isMongoId().withMessage("Valid category ID is required"),
    body("type")
      .isIn([
        "villa",
        "apartment",
        "house",
        "hotel",
        "resort",
        "cabin",
        "cottage",
      ])
      .withMessage("Invalid property type"),
    body("price.amount")
      .isFloat({ min: 0 })
      .withMessage("Price must be positive"),
    body("location.address")
      .trim()
      .notEmpty()
      .withMessage("Address is required"),
    body("location.city").trim().notEmpty().withMessage("City is required"),
    body("location.state").trim().notEmpty().withMessage("State is required"),
    body("specifications.maxGuests")
      .isInt({ min: 1 })
      .withMessage("Max guests must be positive"),
  ],
  createProperty
);

router.put("/:id", protect, updateProperty);
router.delete("/:id", protect, deleteProperty);
router.post("/:id/favorite", protect, toggleFavorite);

module.exports = router;
