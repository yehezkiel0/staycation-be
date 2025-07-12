const express = require("express");
const router = express.Router();
const Agent = require("../models/Agent");
const Property = require("../models/Property");
const auth = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

// @route   GET /api/agents
// @desc    Get all agents
// @access  Public
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      location,
      specialty,
      verified,
      active,
      search,
      sortBy = "rating",
      sortOrder = "desc",
    } = req.query;

    let query = {};

    if (location && location !== "all") {
      query.location = { $regex: location, $options: "i" };
    }

    if (specialty && specialty !== "all") {
      query.specialties = { $in: [specialty] };
    }

    if (verified !== undefined) {
      query.verified = verified === "true";
    }

    if (active !== undefined) {
      query.active = active === "true";
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const agents = await Agent.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get property count for each agent
    const agentsWithCounts = await Promise.all(
      agents.map(async (agent) => {
        const propertyCount = await Property.countDocuments({
          agent: agent._id,
          status: "active",
        });
        return {
          ...agent.toObject(),
          propertyCount,
        };
      })
    );

    const total = await Agent.countDocuments(query);

    res.json({
      agents: agentsWithCounts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/agents/:id
// @desc    Get agent by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id).populate(
      "user",
      "firstName lastName email avatar"
    );

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    // Get properties managed by this agent - without virtual fields
    const properties = await Property.find({
      agent: req.params.id,
      status: "active",
    })
      .select("title city country images price ratings type")
      .lean(); // Use lean() to get plain objects without virtuals

    // Manually construct response to avoid virtual field issues
    const agentResponse = {
      _id: agent._id,
      user: agent.user,
      agentId: agent.agentId,
      profileImage: agent.profileImage,
      bio: agent.bio,
      specialties: agent.specialties,
      languages: agent.languages,
      location: agent.location,
      contact: agent.contact,
      experience: agent.experience,
      statistics: agent.statistics,
      ratings: agent.ratings,
      availability: agent.availability,
      commission: agent.commission,
      verification: agent.verification,
      status: agent.status,
      featured: agent.featured,
      reviews: agent.reviews,
      lastActiveAt: agent.lastActiveAt,
      joinedAt: agent.joinedAt,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      properties,
      propertyCount: properties.length,
    };

    res.json(agentResponse);
  } catch (error) {
    console.error("Error in agent/:id route:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/agents/:id/properties
// @desc    Get properties managed by an agent
// @access  Public
router.get("/:id/properties", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const properties = await Property.find({
      agent: req.params.id,
      status: "active",
    })
      .populate("category", "name icon")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Property.countDocuments({
      agent: req.params.id,
      status: "active",
    });

    res.json({
      agent: {
        id: agent._id,
        name: agent.name,
        title: agent.title,
        image: agent.image,
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
});

// @route   POST /api/agents
// @desc    Create a new agent (Admin only)
// @access  Private (Admin)
router.post(
  "/",
  [
    auth,
    [
      body("name", "Agent name is required").not().isEmpty(),
      body("email", "Valid email is required").isEmail(),
      body("title", "Agent title is required").not().isEmpty(),
      body("location", "Location is required").not().isEmpty(),
      body("phone", "Phone number is required").not().isEmpty(),
      body("languages", "At least one language is required").isArray({
        min: 1,
      }),
      body("specialties", "At least one specialty is required").isArray({
        min: 1,
      }),
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
      const {
        name,
        email,
        title,
        location,
        phone,
        languages,
        specialties,
        bio,
        image,
        experience,
        responseTime,
        verified = false,
        active = true,
      } = req.body;

      // Check if email already exists
      const existingAgent = await Agent.findOne({ email });
      if (existingAgent) {
        return res
          .status(400)
          .json({ message: "Agent with this email already exists" });
      }

      const agent = new Agent({
        name,
        email,
        title,
        location,
        phone,
        languages,
        specialties,
        bio,
        image,
        experience,
        responseTime,
        verified,
        active,
      });

      await agent.save();

      res.status(201).json({
        message: "Agent created successfully",
        agent,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   PUT /api/agents/:id
// @desc    Update an agent
// @access  Private (Admin only)
router.put(
  "/:id",
  [
    auth,
    [
      body("name", "Agent name is required").optional().not().isEmpty(),
      body("email", "Valid email is required").optional().isEmail(),
      body("title", "Agent title is required").optional().not().isEmpty(),
      body("location", "Location is required").optional().not().isEmpty(),
      body("phone", "Phone number is required").optional().not().isEmpty(),
      body("languages", "At least one language is required")
        .optional()
        .isArray({ min: 1 }),
      body("specialties", "At least one specialty is required")
        .optional()
        .isArray({ min: 1 }),
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
      const agent = await Agent.findById(req.params.id);

      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      const {
        name,
        email,
        title,
        location,
        phone,
        languages,
        specialties,
        bio,
        image,
        experience,
        responseTime,
        verified,
        active,
      } = req.body;

      // Check if new email already exists (exclude current agent)
      if (email && email !== agent.email) {
        const existingAgent = await Agent.findOne({
          email,
          _id: { $ne: req.params.id },
        });
        if (existingAgent) {
          return res
            .status(400)
            .json({ message: "Agent with this email already exists" });
        }
      }

      // Update agent fields
      if (name) agent.name = name;
      if (email) agent.email = email;
      if (title) agent.title = title;
      if (location) agent.location = location;
      if (phone) agent.phone = phone;
      if (languages) agent.languages = languages;
      if (specialties) agent.specialties = specialties;
      if (bio) agent.bio = bio;
      if (image) agent.image = image;
      if (experience) agent.experience = experience;
      if (responseTime) agent.responseTime = responseTime;
      if (verified !== undefined) agent.verified = verified;
      if (active !== undefined) agent.active = active;
      agent.updatedAt = new Date();

      await agent.save();

      res.json({
        message: "Agent updated successfully",
        agent,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   DELETE /api/agents/:id
// @desc    Delete an agent
// @access  Private (Admin only)
router.delete("/:id", auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    // Check if there are properties assigned to this agent
    const propertyCount = await Property.countDocuments({
      agent: req.params.id,
    });

    if (propertyCount > 0) {
      return res.status(400).json({
        message: `Cannot delete agent. ${propertyCount} properties are assigned to this agent.`,
      });
    }

    await Agent.findByIdAndDelete(req.params.id);

    res.json({ message: "Agent deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/agents/:id/toggle-status
// @desc    Toggle agent active status
// @access  Private (Admin only)
router.put("/:id/toggle-status", auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    agent.active = !agent.active;
    agent.updatedAt = new Date();
    await agent.save();

    res.json({
      message: `Agent ${
        agent.active ? "activated" : "deactivated"
      } successfully`,
      agent,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/agents/:id/verify
// @desc    Toggle agent verification status
// @access  Private (Admin only)
router.put("/:id/verify", auth, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    agent.verified = !agent.verified;
    agent.updatedAt = new Date();
    await agent.save();

    res.json({
      message: `Agent ${
        agent.verified ? "verified" : "unverified"
      } successfully`,
      agent,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/agents/:id/contact
// @desc    Contact an agent
// @access  Private
router.post(
  "/:id/contact",
  [
    auth,
    [
      body("message", "Message is required").not().isEmpty(),
      body("subject", "Subject is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const agent = await Agent.findById(req.params.id);

      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      if (!agent.active) {
        return res
          .status(400)
          .json({ message: "Agent is currently unavailable" });
      }

      const { message, subject } = req.body;

      // Here you would typically send an email to the agent
      // For now, we'll just log the contact request
      console.log(`Contact request for agent ${agent.name}:`, {
        from: req.user.email,
        subject,
        message,
      });

      res.json({ message: "Contact request sent successfully" });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/agents/search/locations
// @desc    Get all unique agent locations
// @access  Public
router.get("/search/locations", async (req, res) => {
  try {
    const locations = await Agent.distinct("location", { active: true });
    res.json(locations);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/agents/search/specialties
// @desc    Get all unique agent specialties
// @access  Public
router.get("/search/specialties", async (req, res) => {
  try {
    const specialties = await Agent.distinct("specialties", { active: true });
    res.json(specialties);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
