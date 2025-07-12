const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    agentId: {
      type: String,
      unique: true,
      required: true,
    },
    profileImage: {
      type: String,
      default: "https://via.placeholder.com/150",
    },
    bio: {
      type: String,
      maxlength: [1000, "Bio cannot be more than 1000 characters"],
    },
    specialties: [
      {
        type: String,
        enum: [
          "luxury-properties",
          "budget-friendly",
          "family-accommodations",
          "business-travel",
          "beach-properties",
          "mountain-retreats",
          "city-apartments",
          "eco-friendly",
          "pet-friendly",
          "accessible-properties",
        ],
      },
    ],
    languages: [
      {
        language: {
          type: String,
          required: true,
        },
        level: {
          type: String,
          enum: ["basic", "conversational", "fluent", "native"],
          default: "conversational",
        },
      },
    ],
    location: {
      city: {
        type: String,
        required: [true, "City is required"],
      },
      state: {
        type: String,
        required: [true, "State is required"],
      },
      country: {
        type: String,
        default: "Indonesia",
      },
      serviceAreas: [String],
    },
    contact: {
      phone: {
        type: String,
        required: [true, "Phone number is required"],
      },
      whatsapp: String,
      telegram: String,
      alternateEmail: String,
    },
    socialMedia: {
      instagram: String,
      facebook: String,
      linkedin: String,
      twitter: String,
      website: String,
    },
    experience: {
      yearsInBusiness: {
        type: Number,
        min: 0,
        default: 0,
      },
      previousWork: String,
      education: String,
      certifications: [String],
    },
    statistics: {
      totalBookings: {
        type: Number,
        default: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
      },
      responseTime: {
        average: {
          type: Number,
          default: 0,
        },
        unit: {
          type: String,
          enum: ["minutes", "hours"],
          default: "hours",
        },
      },
      responseRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
      breakdown: {
        communication: { type: Number, default: 0 },
        helpfulness: { type: Number, default: 0 },
        knowledge: { type: Number, default: 0 },
        professionalism: { type: Number, default: 0 },
        responsiveness: { type: Number, default: 0 },
      },
    },
    properties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property",
      },
    ],
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    availability: {
      workingHours: {
        monday: { start: String, end: String, available: Boolean },
        tuesday: { start: String, end: String, available: Boolean },
        wednesday: { start: String, end: String, available: Boolean },
        thursday: { start: String, end: String, available: Boolean },
        friday: { start: String, end: String, available: Boolean },
        saturday: { start: String, end: String, available: Boolean },
        sunday: { start: String, end: String, available: Boolean },
      },
      timezone: {
        type: String,
        default: "Asia/Jakarta",
      },
      vacationMode: {
        isActive: {
          type: Boolean,
          default: false,
        },
        from: Date,
        to: Date,
        autoReply: String,
      },
    },
    commission: {
      rate: {
        type: Number,
        default: 10,
        min: 0,
        max: 50,
      },
      type: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "percentage",
      },
    },
    verification: {
      isVerified: {
        type: Boolean,
        default: false,
      },
      documents: [
        {
          type: {
            type: String,
            enum: ["identity", "license", "certification", "other"],
          },
          url: String,
          status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
          },
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      verifiedAt: Date,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "pending"],
      default: "pending",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
agentSchema.index({ user: 1 });
agentSchema.index({ agentId: 1 });
agentSchema.index({ "location.city": 1 });
agentSchema.index({ "location.state": 1 });
agentSchema.index({ "ratings.average": -1 });
agentSchema.index({ status: 1 });
agentSchema.index({ featured: -1 });

// Generate unique agent ID
agentSchema.pre("save", function (next) {
  if (!this.agentId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 3);
    this.agentId = `AG${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Virtual for full location
agentSchema.virtual("fullLocation").get(function () {
  return `${this.location.city}, ${this.location.state}`;
});

// Virtual for property count
agentSchema.virtual("propertyCount").get(function () {
  return this.properties ? this.properties.length : 0;
});

// Virtual for experience display
agentSchema.virtual("experienceDisplay").get(function () {
  const years = this.experience.yearsInBusiness;
  if (years === 0) return "New Agent";
  if (years === 1) return "1 Year Experience";
  return `${years} Years Experience`;
});

// Virtual for response time display
agentSchema.virtual("responseTimeDisplay").get(function () {
  const time = this.statistics.responseTime.average;
  const unit = this.statistics.responseTime.unit;

  if (time === 0) return "Not Available";
  if (time < 1 && unit === "hours") return "Within 1 hour";
  if (time === 1 && unit === "hours") return "1 hour";
  if (unit === "hours") return `${Math.round(time)} hours`;
  if (time === 1) return "1 minute";
  return `${Math.round(time)} minutes`;
});

// Ensure virtual fields are serialised
agentSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Agent", agentSchema);
