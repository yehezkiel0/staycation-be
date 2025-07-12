# Staycation Backend

Complete backend API for the Staycation frontend application built with Express.js, MongoDB, and modern web technologies.

## Features

- 🔐 **Authentication & Authorization** - JWT-based authentication with role-based access control
- 🏠 **Property Management** - CRUD operations for properties with search, filtering, and availability checking
- 📅 **Booking System** - Complete booking workflow with payment integration
- ⭐ **Review System** - User reviews and ratings for properties
- 📖 **Story Management** - Guest stories with like/comment functionality
- 👥 **Agent Management** - Property agent profiles and contact system
- 🏷️ **Category Management** - Property categorization system
- 📤 **File Upload** - Image upload with Cloudinary integration
- 💳 **Payment Processing** - Stripe integration for secure payments
- 📧 **Email Notifications** - Automated email notifications
- 🔒 **Security** - Helmet, CORS, rate limiting, and input validation
- 📊 **Admin Dashboard** - Administrative functions and statistics
- 🧪 **Testing** - Comprehensive test suite with Jest and Supertest

## Technology Stack

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Payment**: Stripe
- **Email**: Nodemailer
- **Validation**: Express Validator
- **Security**: Helmet, CORS, bcryptjs
- **Testing**: Jest, Supertest
- **Development**: Nodemon, Morgan

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Cloudinary account (for image uploads)
- Stripe account (for payments)
- Email service (Gmail recommended)

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd staycation-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   Create a `.env` file in the root directory:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/staycation
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=30d

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # Frontend URL (for CORS and emails)
   FRONTEND_URL=http://localhost:3000
   ```

4. **Database setup**

   Make sure MongoDB is running, then seed the database:

   ```bash
   npm run seed
   ```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Testing

```bash
npm test
```

### Database Seeding

```bash
npm run seed
```

## API Documentation

The API provides the following main endpoints:

- **Authentication**: `/api/auth` - Register, login, profile management
- **Users**: `/api/users` - User profile, favorites, notifications
- **Properties**: `/api/properties` - Property CRUD, search, availability
- **Bookings**: `/api/bookings` - Booking management and workflow
- **Reviews**: `/api/reviews` - Review system with ratings
- **Categories**: `/api/categories` - Property categories
- **Agents**: `/api/agents` - Agent profiles and contact
- **Stories**: `/api/stories` - Guest stories and interactions
- **Uploads**: `/api/uploads` - File upload endpoints
- **Payments**: `/api/payments` - Payment processing with Stripe

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Sample Data

After running the seed script, you can use these sample credentials:

### Admin Account

- Email: `admin@staycation.com`
- Password: `password123`

### Regular User Account

- Email: `john@example.com`
- Password: `password123`

The seed script also creates:

- 6 property categories
- 4 sample properties
- 3 sample agents
- 3 sample stories
- Sample user accounts

## Project Structure

```
staycation-backend/
├── config/
│   └── config.js                 # Environment configuration
├── middleware/
│   ├── auth.js                   # JWT authentication middleware
│   ├── errorHandler.js           # Global error handling
│   └── notFound.js               # 404 handler
├── models/
│   ├── User.js                   # User model
│   ├── Property.js               # Property model
│   ├── Booking.js                # Booking model
│   ├── Review.js                 # Review model
│   ├── Category.js               # Category model
│   ├── Agent.js                  # Agent model
│   └── Story.js                  # Story model
├── routes/
│   ├── auth.js                   # Authentication routes
│   ├── users.js                  # User routes
│   ├── properties.js             # Property routes
│   ├── bookings.js               # Booking routes
│   ├── reviews.js                # Review routes
│   ├── categories.js             # Category routes
│   ├── agents.js                 # Agent routes
│   ├── stories.js                # Story routes
│   ├── uploads.js                # Upload routes
│   └── payments.js               # Payment routes
├── tests/
│   └── api.test.js               # API tests
├── utils/
│   └── helpers.js                # Utility functions
├── .env.example                  # Environment variables example
├── .gitignore                    # Git ignore file
├── API_DOCUMENTATION.md          # Detailed API documentation
├── package.json                  # Dependencies and scripts
├── seedDatabase.js               # Database seeding script
└── server.js                     # Main server file
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: Express Validator for request validation
- **Rate Limiting**: Express rate limit to prevent abuse
- **CORS**: Configured for frontend integration
- **Helmet**: Security headers for protection
- **Role-based Access**: Admin and user role separation

## API Features

### Authentication & Authorization

- User registration and login
- JWT token generation and validation
- Password change functionality
- Role-based access control (admin/user)

### Property Management

- Full CRUD operations for properties
- Advanced search and filtering
- Property availability checking
- Image upload and management
- Category-based organization

### Booking System

- Complete booking workflow
- Date validation and conflict checking
- Payment integration with Stripe
- Booking status management (pending, confirmed, completed, cancelled)
- Email notifications for booking updates

### Review System

- User reviews and ratings
- Review moderation and reporting
- Helpful voting system
- Property rating calculation

### File Upload

- Cloudinary integration for image storage
- Multiple file upload support
- Image transformation and optimization
- Secure file handling

### Payment Processing

- Stripe payment intent creation
- Webhook handling for payment events
- Refund processing
- Payment status tracking

## Development Guidelines

### Code Style

- Use ESLint and Prettier for consistent code formatting
- Follow RESTful API conventions
- Write comprehensive tests for all endpoints
- Use meaningful commit messages

### Error Handling

- All routes use consistent error response format
- Global error handling middleware
- Input validation on all endpoints
- Proper HTTP status codes

### Database

- Use Mongoose for MongoDB object modeling
- Implement proper indexing for performance
- Use population for related data
- Implement soft deletes where appropriate

## Deployment

### Environment Variables

Ensure all environment variables are properly set in production:

- Use strong JWT secrets
- Configure production database URI
- Set up production email service
- Configure Cloudinary and Stripe for production

### Production Considerations

- Use PM2 or similar for process management
- Implement proper logging
- Set up monitoring and alerts
- Use HTTPS in production
- Configure firewall and security groups

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Support

For support and questions:

- Check the API documentation
- Review the test files for usage examples
- Create an issue in the repository

## License

This project is licensed under the MIT License.

## Changelog

### v1.0.0 (Initial Release)

- Complete backend API implementation
- Authentication and authorization system
- Property and booking management
- Review and story systems
- Agent and category management
- File upload and payment processing
- Comprehensive test suite
- Documentation and deployment guides
