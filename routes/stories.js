const express = require("express");
const router = express.Router();
const Story = require("../models/Story");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

// @route   GET /api/stories
// @desc    Get all stories
// @access  Public
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      tag,
      featured,
      published,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    let query = {};

    if (category && category !== "all") {
      query.category = category;
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    if (featured !== undefined) {
      query.featured = featured === "true";
    }

    if (published !== undefined) {
      query.status = published === "true" ? "published" : "draft";
    } else {
      // By default, only show published stories for public access
      query.status = "published";
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const stories = await Story.find(query)
      .populate("author.user", "firstName lastName avatar")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Story.countDocuments(query);

    res.json({
      stories,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/stories/featured
// @desc    Get featured stories
// @access  Public
router.get("/featured", async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const stories = await Story.find({
      featured: true,
      published: true,
    })
      .populate("author.user", "firstName lastName avatar")
      .sort({ featuredOrder: 1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json(stories);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/stories/trending
// @desc    Get trending stories
// @access  Public
router.get("/trending", async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    // Get stories with most views/likes in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stories = await Story.find({
      published: true,
      createdAt: { $gte: thirtyDaysAgo },
    })
      .populate("author.user", "firstName lastName avatar")
      .sort({ views: -1, likes: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json(stories);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/stories/:id
// @desc    Get story by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate("author.user", "firstName lastName avatar bio")
      .populate("engagement.comments.user", "firstName lastName avatar");

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Determine if user is author or admin
    let isAuthor = false;
    if (req.user && story.author && story.author.user) {
      const authorId = story.author.user._id
        ? story.author.user._id.toString()
        : story.author.user.toString();
      isAuthor = authorId === req.user.id;
    }
    const isAdmin = req.user && req.user.role === "admin";

    // If story is not published, only author and admin can view
    if (story.status !== "published" && !isAuthor && !isAdmin) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Increment view count asynchronously (fire and forget)
    // Use findByIdAndUpdate to avoid validation errors on existing docs
    Story.findByIdAndUpdate(req.params.id, {
      $inc: { "engagement.views": 1 },
    }).catch((err) => console.error("Error incrementing views:", err.message));

    res.json(story);
  } catch (error) {
    console.error("Error in GET /api/stories/:id:", error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// @route   POST /api/stories
// @desc    Create a new story
// @access  Private
router.post(
  "/",
  [
    auth,
    [
      body("title", "Story title is required").not().isEmpty(),
      body("excerpt", "Story excerpt is required").not().isEmpty(),
      body("content", "Story content is required").not().isEmpty(),
      body("category", "Story category is required").not().isEmpty(),
      body("image", "Story image is required").not().isEmpty(),
      body("tags", "At least one tag is required").isArray({ min: 1 }),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        title,
        excerpt,
        content,
        category,
        image,
        tags,
        published = false,
        featured = false,
        readTime,
      } = req.body;

      // Fetch user details for author field
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const story = new Story({
        title,
        excerpt,
        content,
        category,
        featuredImage: {
          url: image,
          alt: title,
        },
        tags,
        author: {
          user: user._id,
          name: `${user.firstName} ${user.lastName}`,
          avatar: user.avatar,
          bio: user.bio,
        },
        status: published ? "published" : "draft",
        featured,
        // readTime is calculated in pre-save hook
      });

      await story.save();

      // Populate author details for response
      await story.populate("author.user", "firstName lastName avatar");

      res.status(201).json({
        message: "Story created successfully",
        story,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// @route   PUT /api/stories/:id
// @desc    Update a story
// @access  Private
router.put(
  "/:id",
  [
    auth,
    [
      body("title", "Story title is required").optional().not().isEmpty(),
      body("excerpt", "Story excerpt is required").optional().not().isEmpty(),
      body("content", "Story content is required").optional().not().isEmpty(),
      body("category", "Story category is required").optional().not().isEmpty(),
      body("image", "Story image is required").optional().not().isEmpty(),
      body("tags", "At least one tag is required")
        .optional()
        .isArray({ min: 1 }),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const story = await Story.findById(req.params.id);

      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }

      // Check if user owns this story or is admin
      const isAuthor =
        story.author &&
        story.author.user &&
        (story.author.user.toString() === req.user.id ||
          (story.author.user._id &&
            story.author.user._id.toString() === req.user.id));

      if (!isAuthor && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const {
        title,
        excerpt,
        content,
        category,
        image,
        tags,
        published,
        featured,
        readTime,
      } = req.body;

      // Update story fields
      if (title) story.title = title;
      if (excerpt) story.excerpt = excerpt;
      if (content) {
        story.content = content;
        // Recalculate read time if content changed
        if (!readTime) {
          const wordCount = content.split(" ").length;
          story.readTime = `${Math.ceil(wordCount / 200)} min read`;
        }
      }
      if (category) story.category = category;
      if (image) {
        story.featuredImage = {
          url: image,
          alt: title || story.title,
        };
      }
      if (tags) story.tags = tags;
      if (readTime) story.readTime = readTime;
      if (published !== undefined) {
        story.status = published ? "published" : "draft";
      }

      // Only admin can set featured status
      if (featured !== undefined && req.user.role === "admin") {
        story.featured = featured;
      }

      story.updatedAt = new Date();

      await story.save();

      // Populate author details for response
      await story.populate("author.user", "firstName lastName avatar");

      res.json({
        message: "Story updated successfully",
        story,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// @route   DELETE /api/stories/:id
// @desc    Delete a story
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Check if user owns this story or is admin
    const isAuthor =
      story.author &&
      story.author.user &&
      (story.author.user.toString() === req.user.id ||
        (story.author.user._id &&
          story.author.user._id.toString() === req.user.id));

    if (!isAuthor && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    await Story.findByIdAndDelete(req.params.id);

    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/stories/:id/like
// @desc    Like/unlike a story
// @access  Private
router.post("/:id/like", auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Check if user already liked this story
    // Assuming likes are under engagement.likes.users
    // But previous code accessed story.likes?
    // Let's check Schema: engagement.likes.users

    // The previous implementation accessed story.likes directly which might be wrong too?
    // Schema says: engagement: { likes: { count: Number, users: [ObjectId] } }

    // I need to fix the LIKE route too!

    if (!story.engagement)
      story.engagement = { likes: { count: 0, users: [] } };
    if (!story.engagement.likes)
      story.engagement.likes = { count: 0, users: [] };

    const likedIndex = story.engagement.likes.users.indexOf(req.user.id);

    if (likedIndex > -1) {
      story.engagement.likes.users.splice(likedIndex, 1);
      story.engagement.likes.count = Math.max(
        0,
        story.engagement.likes.count - 1,
      );

      // Use findByIdAndUpdate to avoid validation errors
      await Story.findByIdAndUpdate(req.params.id, {
        "engagement.likes": story.engagement.likes,
      });

      res.json({
        message: "Story unliked",
        liked: false,
        likesCount: story.engagement.likes.count,
      });
    } else {
      story.engagement.likes.users.push(req.user.id);
      story.engagement.likes.count += 1;

      await Story.findByIdAndUpdate(req.params.id, {
        "engagement.likes": story.engagement.likes,
      });

      res.json({
        message: "Story liked",
        liked: true,
        likesCount: story.engagement.likes.count,
      });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/stories/:id/comments
// @desc    Add a comment to a story
// @access  Private
router.post(
  "/:id/comments",
  [auth, [body("comment", "Comment text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const story = await Story.findById(req.params.id);

      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }

      if (story.status !== "published") {
        return res
          .status(400)
          .json({ message: "Cannot comment on unpublished story" });
      }

      const { comment } = req.body;

      const newComment = {
        user: req.user.id,
        comment,
        createdAt: new Date(),
      };

      if (!story.engagement) story.engagement = {};
      if (!story.engagement.comments) story.engagement.comments = [];

      story.engagement.comments.push(newComment);
      await story.save();

      // Populate the new comment with user details
      // Note: we can't populate 'comments.user' on the story directly if it's nested
      // We might need to fetch the story again or manually construct response

      const populatedStory = await Story.findById(req.params.id).populate(
        "engagement.comments.user",
        "firstName lastName avatar",
      );

      const addedComment =
        populatedStory.engagement.comments[
          populatedStory.engagement.comments.length - 1
        ];

      res.status(201).json({
        message: "Comment added successfully",
        comment: addedComment,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// @route   DELETE /api/stories/:storyId/comments/:commentId
// @desc    Delete a comment
// @access  Private
router.delete("/:storyId/comments/:commentId", auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Find comment in engagement.comments
    if (!story.engagement || !story.engagement.comments) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Mongoose array doesn't support .id() method on nested subdocuments directly if not loaded as MainDocument
    // usage: story.engagement.comments.id(id) should work if schema is set up right
    const comment = story.engagement.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user owns this comment or is admin
    if (comment.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Remove comment
    story.engagement.comments.pull(req.params.commentId);
    await story.save();

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/stories/search/categories
// @desc    Get all unique story categories
// @access  Public
router.get("/search/categories", async (req, res) => {
  try {
    const categories = await Story.distinct("category", { published: true });
    res.json(categories);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/stories/search/tags
// @desc    Get all unique story tags
// @access  Public
router.get("/search/tags", async (req, res) => {
  try {
    const tags = await Story.distinct("tags", { published: true });
    res.json(tags);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
