const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Property description is required"],
      maxlength: [2000, "Description cannot be more than 2000 characters"],
    },
    shortDescription: {
      type: String,
      maxlength: [200, "Short description cannot be more than 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Property category is required"],
    },
    type: {
      type: String,
      required: [true, "Property type is required"],
      enum: [
        "villa",
        "apartment",
        "house",
        "hotel",
        "resort",
        "cabin",
        "cottage",
        "lodge",
        "suite",
        "farmstay",
        "treehouse",
        "boathouse",
      ],
    },
    price: {
      amount: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price cannot be negative"],
      },
      currency: {
        type: String,
        default: "IDR",
      },
      per: {
        type: String,
        enum: ["night", "week", "month"],
        default: "night",
      },
    },
    location: {
      address: {
        type: String,
        required: [true, "Address is required"],
      },
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
      zipCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
      nearbyLandmarks: [String],
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: String,
        caption: String,
        isMain: {
          type: Boolean,
          default: false,
        },
      },
    ],
    amenities: [
      {
        name: {
          type: String,
          required: true,
        },
        icon: String,
        category: {
          type: String,
          enum: [
            "basic",
            "kitchen",
            "bathroom",
            "bedroom",
            "entertainment",
            "outdoor",
            "safety",
          ],
        },
      },
    ],
    specifications: {
      bedrooms: {
        type: Number,
        min: 0,
      },
      bathrooms: {
        type: Number,
        min: 0,
      },
      livingRooms: {
        type: Number,
        min: 0,
      },
      kitchens: {
        type: Number,
        min: 0,
      },
      maxGuests: {
        type: Number,
        required: [true, "Maximum guests is required"],
        min: 1,
      },
      area: {
        size: Number,
        unit: {
          type: String,
          enum: ["sqm", "sqft"],
          default: "sqm",
        },
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
    },
    availability: {
      isAvailable: {
        type: Boolean,
        default: true,
      },
      availableFrom: Date,
      availableTo: Date,
      blackoutDates: [
        {
          from: Date,
          to: Date,
          reason: String,
        },
      ],
    },
    bookingRules: {
      minimumStay: {
        type: Number,
        default: 1,
      },
      maximumStay: {
        type: Number,
        default: 30,
      },
      checkInTime: {
        type: String,
        default: "15:00",
      },
      checkOutTime: {
        type: String,
        default: "11:00",
      },
      instantBook: {
        type: Boolean,
        default: false,
      },
      advanceBooking: {
        type: Number,
        default: 365,
      },
    },
    policies: {
      cancellation: {
        type: String,
        enum: ["flexible", "moderate", "strict"],
        default: "moderate",
      },
      petPolicy: {
        allowed: {
          type: Boolean,
          default: false,
        },
        fee: Number,
        restrictions: [String],
      },
      smokingPolicy: {
        type: String,
        enum: ["no-smoking", "smoking-allowed", "designated-areas"],
        default: "no-smoking",
      },
      partyPolicy: {
        type: String,
        enum: ["no-parties", "small-gatherings", "events-allowed"],
        default: "no-parties",
      },
      additionalRules: [String],
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
        cleanliness: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        location: { type: Number, default: 0 },
        checkIn: { type: Number, default: 0 },
        value: { type: Number, default: 0 },
      },
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "suspended"],
      default: "pending",
    },
    views: {
      type: Number,
      default: 0,
    },
    bookingCount: {
      type: Number,
      default: 0,
    },
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
propertySchema.index({ "location.city": 1 });
propertySchema.index({ "location.state": 1 });
propertySchema.index({ category: 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ "price.amount": 1 });
propertySchema.index({ "ratings.average": -1 });
propertySchema.index({ featured: -1 });
propertySchema.index({ status: 1 });
propertySchema.index({ publishedAt: -1 });

// Create slug before saving
propertySchema.pre("save", function (next) {
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
  next();
});

// Virtual for main image
propertySchema.virtual("mainImage").get(function () {
  if (!this.images || !Array.isArray(this.images) || this.images.length === 0) {
    return null;
  }
  const mainImg = this.images.find((img) => img.isMain);
  return mainImg ? mainImg.url : this.images[0] ? this.images[0].url : null;
});

// Virtual for formatted price
propertySchema.virtual("formattedPrice").get(function () {
  if (!this.price || !this.price.currency || !this.price.amount) {
      return "N/A";
  }
  const formatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: this.price.currency,
  });
  return formatter.format(this.price.amount);
});

// Ensure virtual fields are serialised
propertySchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Property", propertySchema);
