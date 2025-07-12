const nodemailer = require("nodemailer");
const config = require("../config/config");

// Email service configuration
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: config.email.host,
    port: config.email.port,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
};

// Send email utility
const sendEmail = async (options) => {
  try {
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: config.email.user,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
};

// Generate booking confirmation email HTML
const generateBookingConfirmationEmail = (booking, property) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .booking-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Booking Confirmed!</h1>
            </div>
            <div class="content">
                <p>Dear ${booking.guestInfo.firstName} ${
    booking.guestInfo.lastName
  },</p>
                <p>Your booking has been confirmed. Here are your booking details:</p>
                
                <div class="booking-details">
                    <h3>Booking Information</h3>
                    <p><strong>Booking ID:</strong> ${booking._id}</p>
                    <p><strong>Property:</strong> ${property.name}</p>
                    <p><strong>Location:</strong> ${property.city}, ${
    property.country
  }</p>
                    <p><strong>Check-in:</strong> ${booking.checkIn.toDateString()}</p>
                    <p><strong>Check-out:</strong> ${booking.checkOut.toDateString()}</p>
                    <p><strong>Guests:</strong> ${booking.guests}</p>
                    <p><strong>Total Price:</strong> $${booking.totalPrice}</p>
                </div>
                
                <p>We look forward to hosting you at ${property.name}!</p>
                <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Staycation. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Generate welcome email HTML
const generateWelcomeEmail = (user) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Staycation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; }
            .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to Staycation!</h1>
            </div>
            <div class="content">
                <p>Dear ${user.firstName} ${user.lastName},</p>
                <p>Welcome to Staycation! Your account has been created successfully.</p>
                <p>You can now start browsing and booking amazing properties for your next getaway.</p>
                <p>Explore our collection of:</p>
                <ul>
                    <li>Beachfront villas</li>
                    <li>Mountain lodges</li>
                    <li>City apartments</li>
                    <li>Luxury resorts</li>
                    <li>And much more!</li>
                </ul>
                <p style="text-align: center;">
                    <a href="${
                      process.env.FRONTEND_URL || "http://localhost:3000"
                    }" class="btn">Start Exploring</a>
                </p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Staycation. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Format currency
const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

// Format date
const formatDate = (date, locale = "en-US") => {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
};

// Generate random string
const generateRandomString = (length = 10) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number format
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

// Slugify string for URLs
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

// Paginate results
const paginate = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(parseInt(limit));
};

// Build sort object from query string
const buildSort = (sortBy = "createdAt", sortOrder = "desc") => {
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;
  return sort;
};

module.exports = {
  sendEmail,
  generateBookingConfirmationEmail,
  generateWelcomeEmail,
  formatCurrency,
  formatDate,
  generateRandomString,
  isValidEmail,
  isValidPhone,
  calculateDistance,
  slugify,
  paginate,
  buildSort,
};
