const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property is required"],
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking is required"],
    },
    rating: {
      overall: {
        type: Number,
        required: [true, "Overall rating is required"],
        min: 1,
        max: 5,
      },
      cleanliness: {
        type: Number,
        min: 1,
        max: 5,
      },
      accuracy: {
        type: Number,
        min: 1,
        max: 5,
      },
      communication: {
        type: Number,
        min: 1,
        max: 5,
      },
      location: {
        type: Number,
        min: 1,
        max: 5,
      },
      checkIn: {
        type: Number,
        min: 1,
        max: 5,
      },
      value: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
    title: {
      type: String,
      required: [true, "Review title is required"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      maxlength: [1000, "Comment cannot be more than 1000 characters"],
    },
    images: [
      {
        url: String,
        caption: String,
      },
    ],
    pros: [String],
    cons: [String],
    recommendToFriends: {
      type: Boolean,
      default: true,
    },
    stayPeriod: {
      month: {
        type: String,
        enum: [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ],
      },
      year: Number,
    },
    tripType: {
      type: String,
      enum: ["business", "leisure", "family", "couple", "solo", "friends"],
      required: true,
    },
    guestType: {
      type: String,
      enum: ["first_time", "returning", "local", "international"],
    },
    helpful: {
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
    response: {
      text: String,
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      createdAt: Date,
    },
    status: {
      type: String,
      enum: ["pending", "published", "hidden", "flagged"],
      default: "pending",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    language: {
      type: String,
      default: "id",
    },
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
reviewSchema.index({ user: 1 });
reviewSchema.index({ property: 1 });
reviewSchema.index({ booking: 1 });
reviewSchema.index({ "rating.overall": -1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ publishedAt: -1 });

// Ensure one review per booking
reviewSchema.index({ booking: 1 }, { unique: true });

// Calculate average rating
reviewSchema.methods.calculateAverageRating = function () {
  const ratings = this.rating;
  const ratingFields = [
    "cleanliness",
    "accuracy",
    "communication",
    "location",
    "checkIn",
    "value",
  ];

  let total = 0;
  let count = 0;

  ratingFields.forEach((field) => {
    if (ratings[field]) {
      total += ratings[field];
      count++;
    }
  });

  return count > 0 ? Math.round((total / count) * 10) / 10 : ratings.overall;
};

// Set published date when status changes to published
reviewSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
  next();
});

// Virtual for formatted date
reviewSchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Virtual for stay month and year display
reviewSchema.virtual("stayPeriodDisplay").get(function () {
  if (this.stayPeriod.month && this.stayPeriod.year) {
    return `${this.stayPeriod.month} ${this.stayPeriod.year}`;
  }
  return null;
});

// Ensure virtual fields are serialised
reviewSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Review", reviewSchema);
