const Category = require("../models/Category");
const Property = require("../models/Property");
const { validationResult } = require("express-validator");

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, active } = req.query;
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (active !== undefined) {
      query.active = active === "true";
    }

    const categories = await Category.find(query)
      .sort({ order: 1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Category.countDocuments(query);

    // Get property count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const propertyCount = await Property.countDocuments({
          category: category._id,
          status: "active",
        });
        return {
          ...category.toObject(),
          propertyCount,
        };
      })
    );

    res.json({
      categories: categoriesWithCounts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Public
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Get property count for this category
    const propertyCount = await Property.countDocuments({
      category: category._id,
      status: "active",
    });

    res.json({
      ...category.toObject(),
      propertyCount,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/categories/:id/properties
// @desc    Get properties in a category
// @access  Public
exports.getCategoryProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const properties = await Property.find({
      category: req.params.id,
      status: "active",
    })
      .populate("category", "name icon")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Property.countDocuments({
      category: req.params.id,
      status: "active",
    });

    res.json({
      category: {
        id: category._id,
        name: category.name,
        description: category.description,
        icon: category.icon,
      },
      properties,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (Admin only)
exports.createCategory = async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description, icon, order, active = true } = req.body;

      // Check if category name already exists
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
      });

      if (existingCategory) {
        return res
          .status(400)
          .json({ message: "Category name already exists" });
      }

      // Set order if not provided
      let categoryOrder = order;
      if (!categoryOrder) {
        const lastCategory = await Category.findOne().sort({ order: -1 });
        categoryOrder = lastCategory ? lastCategory.order + 1 : 1;
      }

      const category = new Category({
        name,
        description,
        icon,
        order: categoryOrder,
        active,
      });

      await category.save();

      res.status(201).json({
        message: "Category created successfully",
        category,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
};

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private (Admin only)
exports.updateCategory = async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const category = await Category.findById(req.params.id);

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const { name, description, icon, order, active } = req.body;

      // Check if new name already exists (exclude current category)
      if (name && name !== category.name) {
        const existingCategory = await Category.findOne({
          name: { $regex: new RegExp(`^${name}$`, "i") },
          _id: { $ne: req.params.id },
        });

        if (existingCategory) {
          return res
            .status(400)
            .json({ message: "Category name already exists" });
        }
      }

      // Update category fields
      if (name) category.name = name;
      if (description) category.description = description;
      if (icon) category.icon = icon;
      if (order !== undefined) category.order = order;
      if (active !== undefined) category.active = active;
      category.updatedAt = new Date();

      await category.save();

      res.json({
        message: "Category updated successfully",
        category,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
};

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private (Admin only)
exports.deleteCategory = async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if there are properties using this category
    const propertyCount = await Property.countDocuments({
      category: req.params.id,
    });

    if (propertyCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category. ${propertyCount} properties are using this category.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   PUT /api/categories/:id/toggle-status
// @desc    Toggle category active status
// @access  Private (Admin only)
exports.toggleStatus = async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.active = !category.active;
    category.updatedAt = new Date();
    await category.save();

    res.json({
      message: `Category ${
        category.active ? "activated" : "deactivated"
      } successfully`,
      category,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   PUT /api/categories/reorder
// @desc    Reorder categories
// @access  Private (Admin only)
exports.reorderCategories = async (req, res) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { categories } = req.body;

      // Update order for each category
      const updatePromises = categories.map((cat) =>
        Category.findByIdAndUpdate(cat.id, {
          order: cat.order,
          updatedAt: new Date(),
        })
      );

      await Promise.all(updatePromises);

      res.json({ message: "Categories reordered successfully" });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
};
