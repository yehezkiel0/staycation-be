const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { body } = require("express-validator");
const {
  getCategories,
  getCategory,
  getCategoryProperties,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleStatus,
  reorderCategories
} = require("../controllers/categoryController");

// Public routes
router.get("/", getCategories);
router.get("/:id", getCategory);
router.get("/:id/properties", getCategoryProperties);

// Protected routes
router.post(
  "/",
  [
    auth,
    [
      body("name", "Category name is required").not().isEmpty(),
      body("description", "Category description is required").not().isEmpty(),
      body("icon", "Category icon is required").not().isEmpty(),
    ],
  ],
  createCategory
);

router.put(
  "/:id",
  [
    auth,
    [
      body("name", "Category name is required").optional().not().isEmpty(),
      body("description", "Category description is required")
        .optional()
        .not()
        .isEmpty(),
      body("icon", "Category icon is required").optional().not().isEmpty(),
    ],
  ],
  updateCategory
);

router.delete("/:id", auth, deleteCategory);
router.put("/:id/toggle-status", auth, toggleStatus);

router.put(
  "/reorder",
  [
    auth,
    [
      body("categories", "Categories array is required").isArray({ min: 1 }),
      body("categories.*.id", "Category ID is required").not().isEmpty(),
      body("categories.*.order", "Category order is required").isInt({
        min: 1,
      }),
    ],
  ],
  reorderCategories
);

module.exports = router;
