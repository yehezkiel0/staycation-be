const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Property = require("../models/Property");
const Category = require("../models/Category");
const Review = require("../models/Review");
const { protect, authorize, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// @desc    Get all properties
// @route   GET /api/properties
// @access  Public
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
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const startIndex = (page - 1) * limit;

      // Build filter object
      const filter = { status: "active" };

      // Location filters
      if (req.query.city)
        filter["location.city"] = new RegExp(req.query.city, "i");
      if (req.query.state)
        filter["location.state"] = new RegExp(req.query.state, "i");
      if (req.query.country)
        filter["location.country"] = new RegExp(req.query.country, "i");

      // Category filter
      if (req.query.category) filter.category = req.query.category;
      if (req.query.type) filter.type = req.query.type;

      // Price range filter
      if (req.query.minPrice || req.query.maxPrice) {
        filter["price.amount"] = {};
        if (req.query.minPrice)
          filter["price.amount"].$gte = parseFloat(req.query.minPrice);
        if (req.query.maxPrice)
          filter["price.amount"].$lte = parseFloat(req.query.maxPrice);
      }

      // Guest capacity filter
      if (req.query.minGuests)
        filter["specifications.maxGuests"] = {
          $gte: parseInt(req.query.minGuests),
        };

      // Rating filter
      if (req.query.rating)
        filter["ratings.average"] = { $gte: parseFloat(req.query.rating) };

      // Amenities filter
      if (req.query.amenities) {
        const amenities = req.query.amenities.split(",");
        filter["amenities.name"] = { $in: amenities };
      }

      // Featured filter
      if (req.query.featured === "true") filter.featured = true;

      // Popular filter
      if (req.query.isPopular === "true") filter.isPopular = true;

      // Available dates filter
      if (req.query.checkIn && req.query.checkOut) {
        const checkIn = new Date(req.query.checkIn);
        const checkOut = new Date(req.query.checkOut);

        filter.$and = [
          {
            $or: [
              { "availability.availableFrom": { $lte: checkIn } },
              { "availability.availableFrom": null },
            ],
          },
          {
            $or: [
              { "availability.availableTo": { $gte: checkOut } },
              { "availability.availableTo": null },
            ],
          },
          { "availability.isAvailable": true },
        ];
      }

      // Build sort object
      let sort = {};
      if (req.query.sortBy) {
        const sortField = req.query.sortBy;
        const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

        switch (sortField) {
          case "price":
            sort["price.amount"] = sortOrder;
            break;
          case "rating":
            sort["ratings.average"] = sortOrder;
            break;
          case "newest":
            sort.publishedAt = -1;
            break;
          case "popular":
            sort.bookingCount = -1;
            break;
          default:
            sort[sortField] = sortOrder;
        }
      } else {
        sort.featured = -1;
        sort["ratings.average"] = -1;
      }

      // Execute query
      const properties = await Property.find(filter)
        .populate("category", "name slug")
        .populate("owner", "firstName lastName avatar")
        .populate("agent", "user profileImage")
        .sort(sort)
        .limit(limit)
        .skip(startIndex)
        .select("-__v");

      // Get total count for pagination
      const total = await Property.countDocuments(filter);

      // Pagination result
      const pagination = {};
      if (startIndex + limit < total) {
        pagination.next = {
          page: page + 1,
          limit,
        };
      }
      if (startIndex > 0) {
        pagination.prev = {
          page: page - 1,
          limit,
        };
      }

      res.status(200).json({
        success: true,
        count: properties.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        pagination,
        properties: properties,
      });
    } catch (error) {
      console.error("Error in properties endpoint:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// @desc    Get most picked properties
// @route   GET /api/properties/most-picked
// @access  Public
router.get("/most-picked", async (req, res) => {
  try {
    const properties = await Property.find({ isPopular: true })
      .populate("category", "name slug")
      .populate("agent", "name email avatar")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    res.json({
      success: true,
      count: properties.length,
      properties: properties,
    });
  } catch (error) {
    console.error("Error fetching most picked properties:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Public
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("category", "name slug description")
      .populate("owner", "firstName lastName avatar email phone")
      .populate("agent", "user profileImage bio contact")
      .populate({
        path: "reviews",
        populate: {
          path: "user",
          select: "firstName lastName avatar",
        },
        match: { status: "published" },
        options: { sort: { publishedAt: -1 }, limit: 10 },
      });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Increment view count
    property.views += 1;
    await property.save();

    // Check if user has favorited this property
    let isFavorite = false;
    if (req.user) {
      isFavorite = req.user.favoriteProperties.includes(property._id);
    }

    res.status(200).json({
      success: true,
      property: {
        ...property.toJSON(),
        isFavorite,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Create new property
// @route   POST /api/properties
// @access  Private (Agent/Admin)
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
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array(),
        });
      }

      // Verify category exists
      const category = await Category.findById(req.body.category);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Category not found",
        });
      }

      // Add owner to property data
      req.body.owner = req.user.id;

      // If user is an agent, add agent reference
      if (req.user.role === "agent") {
        const Agent = require("../models/Agent");
        const agent = await Agent.findOne({ user: req.user.id });
        if (agent) {
          req.body.agent = agent._id;
        }
      }

      const property = await Property.create(req.body);

      // Populate the created property
      await property.populate("category", "name slug");
      await property.populate("owner", "firstName lastName avatar");

      res.status(201).json({
        success: true,
        message: "Property created successfully",
        data: property,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private (Owner/Agent/Admin)
router.put("/:id", protect, async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Check ownership
    if (
      property.owner.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to update this property",
      });
    }

    property = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("category", "name slug")
      .populate("owner", "firstName lastName avatar");

    res.status(200).json({
      success: true,
      message: "Property updated successfully",
      data: property,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private (Owner/Admin)
router.delete("/:id", protect, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Check ownership
    if (
      property.owner.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this property",
      });
    }

    await property.deleteOne();

    res.status(200).json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Toggle favorite property
// @route   POST /api/properties/:id/favorite
// @access  Private
router.post("/:id/favorite", protect, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const user = req.user;
    const isFavorite = user.favoriteProperties.includes(property._id);

    if (isFavorite) {
      user.favoriteProperties.pull(property._id);
    } else {
      user.favoriteProperties.push(property._id);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: isFavorite
        ? "Property removed from favorites"
        : "Property added to favorites",
      isFavorite: !isFavorite,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// @desc    Get property availability
// @route   GET /api/properties/:id/availability
// @access  Public
router.get("/:id/availability", async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "Check-in and check-out dates are required",
      });
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Check if property is available for these dates
    const Booking = require("../models/Booking");
    const conflictingBookings = await Booking.find({
      property: property._id,
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

    const isAvailable =
      conflictingBookings.length === 0 && property.availability.isAvailable;

    res.status(200).json({
      success: true,
      data: {
        isAvailable,
        conflictingBookings: conflictingBookings.length,
        propertyRules: property.bookingRules,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;
