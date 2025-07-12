const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },
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
    checkIn: {
      type: Date,
      required: [true, "Check-in date is required"],
    },
    checkOut: {
      type: Date,
      required: [true, "Check-out date is required"],
    },
    guests: {
      adults: {
        type: Number,
        required: true,
        min: 1,
      },
      children: {
        type: Number,
        default: 0,
        min: 0,
      },
      infants: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    totalGuests: {
      type: Number,
      required: true,
    },
    nights: {
      type: Number,
      required: true,
    },
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
      totalPrice: {
        type: Number,
        required: true,
      },
      serviceFee: {
        type: Number,
        default: 0,
      },
      cleaningFee: {
        type: Number,
        default: 0,
      },
      taxes: {
        type: Number,
        default: 0,
      },
      discount: {
        amount: {
          type: Number,
          default: 0,
        },
        type: {
          type: String,
          enum: ["percentage", "fixed"],
          default: "fixed",
        },
        reason: String,
      },
    },
    payment: {
      method: {
        type: String,
        enum: [
          "credit_card",
          "debit_card",
          "bank_transfer",
          "e_wallet",
          "cash",
        ],
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
        default: "pending",
      },
      transactionId: String,
      paymentIntent: String,
      paidAt: Date,
      refundedAt: Date,
      refundAmount: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
        "completed",
      ],
      default: "pending",
    },
    guestDetails: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      specialRequests: String,
      arrivalTime: String,
    },
    cancellation: {
      cancelledAt: Date,
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: String,
      refundAmount: {
        type: Number,
        default: 0,
      },
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
    notes: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        message: String,
        isInternal: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    confirmationSentAt: Date,
    reminderSentAt: Date,
    checkInCode: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ user: 1 });
bookingSchema.index({ property: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ checkIn: 1 });
bookingSchema.index({ checkOut: 1 });
bookingSchema.index({ createdAt: -1 });

// Generate unique booking ID
bookingSchema.pre("save", function (next) {
  if (!this.bookingId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.bookingId = `BK${timestamp}${random}`.toUpperCase();
  }

  // Calculate total guests
  this.totalGuests = this.guests.adults + this.guests.children;

  // Calculate nights
  if (this.checkIn && this.checkOut) {
    const diffTime = Math.abs(this.checkOut - this.checkIn);
    this.nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  next();
});

// Validation to ensure checkout is after checkin
bookingSchema.pre("save", function (next) {
  if (this.checkOut <= this.checkIn) {
    next(new Error("Check-out date must be after check-in date"));
  }
  next();
});

// Virtual for booking duration
bookingSchema.virtual("duration").get(function () {
  if (this.checkIn && this.checkOut) {
    const diffTime = Math.abs(this.checkOut - this.checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for total amount formatted
bookingSchema.virtual("formattedTotal").get(function () {
  const formatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  });
  return formatter.format(this.pricing.totalPrice);
});

// Virtual for guest full name
bookingSchema.virtual("guestFullName").get(function () {
  return `${this.guestDetails.firstName} ${this.guestDetails.lastName}`;
});

// Ensure virtual fields are serialised
bookingSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Booking", bookingSchema);
