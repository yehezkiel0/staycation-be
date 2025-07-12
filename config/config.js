const config = {
  development: {
    database: {
      uri: process.env.MONGODB_URI || "mongodb://localhost:27017/staycation",
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
    jwt: {
      secret: process.env.JWT_SECRET || "your_jwt_secret_here",
      expiresIn: process.env.JWT_EXPIRE || "30d",
    },
    cloudinary: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    },
    stripe: {
      secret_key: process.env.STRIPE_SECRET_KEY,
      webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    email: {
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 587,
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001"],
      credentials: true,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },

  production: {
    database: {
      uri: process.env.MONGODB_URI,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRE || "7d",
    },
    cloudinary: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    },
    stripe: {
      secret_key: process.env.STRIPE_SECRET_KEY,
      webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    email: {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    cors: {
      origin: process.env.FRONTEND_URL || "https://your-frontend-domain.com",
      credentials: true,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50, // limit each IP to 50 requests per windowMs in production
    },
  },

  test: {
    database: {
      uri:
        process.env.MONGODB_TEST_URI ||
        "mongodb://localhost:27017/staycation_test",
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
    jwt: {
      secret: "test_jwt_secret",
      expiresIn: "1h",
    },
    cloudinary: {
      cloud_name: "test",
      api_key: "test",
      api_secret: "test",
    },
    stripe: {
      secret_key: "test_stripe_key",
      webhook_secret: "test_webhook_secret",
    },
    email: {
      host: "localhost",
      port: 587,
      user: "test@example.com",
      pass: "test_password",
    },
    cors: {
      origin: ["http://localhost:3000"],
      credentials: true,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 1000, // Higher limit for testing
    },
  },
};

const environment = process.env.NODE_ENV || "development";

module.exports = config[environment];
