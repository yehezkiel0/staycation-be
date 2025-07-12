const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Story title is required"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    slug: {
      type: String,
      unique: true,
    },
    excerpt: {
      type: String,
      required: [true, "Story excerpt is required"],
      maxlength: [300, "Excerpt cannot be more than 300 characters"],
    },
    content: {
      type: String,
      required: [true, "Story content is required"],
    },
    author: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Author is required"],
      },
      name: {
        type: String,
        required: true,
      },
      avatar: String,
      bio: String,
    },
    featuredImage: {
      url: {
        type: String,
        required: [true, "Featured image is required"],
      },
      alt: String,
      caption: String,
    },
    images: [
      {
        url: String,
        alt: String,
        caption: String,
      },
    ],
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Romance",
        "Family",
        "Solo",
        "Business",
        "Adventure",
        "Luxury",
        "Budget",
        "Wellness",
        "Culinary",
        "Cultural",
        "Nature",
        "Urban",
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      city: String,
      state: String,
      country: {
        type: String,
        default: "Indonesia",
      },
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
    },
    readTime: {
      type: Number,
      default: 5,
    },
    engagement: {
      views: {
        type: Number,
        default: 0,
      },
      likes: {
        count: {
          type: Number,
          default: 0,
        },
        users: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],
      },
      comments: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          name: String,
          email: String,
          comment: {
            type: String,
            required: true,
            maxlength: [500, "Comment cannot be more than 500 characters"],
          },
          isApproved: {
            type: Boolean,
            default: false,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      shares: {
        type: Number,
        default: 0,
      },
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      ogImage: String,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived", "featured"],
      default: "draft",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    trending: {
      type: Boolean,
      default: false,
    },
    publishedAt: Date,
    language: {
      type: String,
      default: "id",
    },
    relatedStories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Story",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
storySchema.index({ slug: 1 });
storySchema.index({ category: 1 });
storySchema.index({ tags: 1 });
storySchema.index({ status: 1 });
storySchema.index({ featured: -1 });
storySchema.index({ trending: -1 });
storySchema.index({ publishedAt: -1 });
storySchema.index({ "engagement.views": -1 });
storySchema.index({ "engagement.likes.count": -1 });

// Create slug before saving
storySchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");

    // Add timestamp to ensure uniqueness
    this.slug += "-" + Date.now();
  }

  // Set published date
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  next();
});

// Calculate read time based on content length
storySchema.pre("save", function (next) {
  if (this.isModified("content")) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / wordsPerMinute);
  }
  next();
});

// Virtual for formatted date
storySchema.virtual("formattedDate").get(function () {
  const date = this.publishedAt || this.createdAt;
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Virtual for read time display
storySchema.virtual("readTimeDisplay").get(function () {
  return `${this.readTime} min read`;
});

// Virtual for comment count
storySchema.virtual("commentCount").get(function () {
  return this.engagement.comments.filter(
    (comment) => comment.isApproved
  ).length;
});

// Virtual for like count
storySchema.virtual("likeCount").get(function () {
  return this.engagement.likes.count;
});

// Method to check if user liked the story
storySchema.methods.isLikedBy = function (userId) {
  return this.engagement.likes.users.includes(userId);
};

// Method to toggle like
storySchema.methods.toggleLike = function (userId) {
  const isLiked = this.isLikedBy(userId);

  if (isLiked) {
    this.engagement.likes.users.pull(userId);
    this.engagement.likes.count = Math.max(0, this.engagement.likes.count - 1);
  } else {
    this.engagement.likes.users.push(userId);
    this.engagement.likes.count += 1;
  }

  return !isLiked;
};

// Ensure virtual fields are serialised
storySchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Story", storySchema);
