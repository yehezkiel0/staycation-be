# Staycation Backend API Documentation

## Overview

Complete backend API for the Staycation frontend application built with Express.js and MongoDB.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register a new user
- `POST /login` - Login user
- `GET /profile` - Get current user profile (requires auth)
- `PUT /change-password` - Change user password (requires auth)
- `POST /logout` - Logout user (requires auth)

### Users (`/api/users`)

- `GET /profile` - Get current user profile (requires auth)
- `PUT /profile` - Update user profile (requires auth)
- `GET /favorites` - Get user's favorite properties (requires auth)
- `POST /favorites/:propertyId` - Add property to favorites (requires auth)
- `DELETE /favorites/:propertyId` - Remove property from favorites (requires auth)
- `GET /bookings` - Get user's bookings (requires auth)
- `GET /notifications` - Get user notifications (requires auth)
- `PUT /notifications/:notificationId/read` - Mark notification as read (requires auth)

### Properties (`/api/properties`)

- `GET /` - Get all properties (public)
- `GET /:id` - Get property by ID (public)
- `POST /` - Create new property (admin only)
- `PUT /:id` - Update property (admin only)
- `DELETE /:id` - Delete property (admin only)
- `GET /:id/availability` - Check property availability (public)
- `GET /:id/reviews` - Get property reviews (public)
- `GET /search/filters` - Get available search filters (public)

### Bookings (`/api/bookings`)

- `POST /` - Create new booking (requires auth)
- `GET /` - Get user's bookings (requires auth)
- `GET /:id` - Get booking by ID (requires auth)
- `PUT /:id/cancel` - Cancel booking (requires auth)
- `PUT /:id/confirm` - Confirm booking (admin only)
- `PUT /:id/checkin` - Check-in booking (admin only)
- `PUT /:id/checkout` - Check-out booking (admin only)
- `POST /:id/payment` - Update payment information (requires auth)

### Reviews (`/api/reviews`)

- `POST /` - Create new review (requires auth)
- `GET /` - Get reviews with filtering (public)
- `GET /:id` - Get review by ID (public)
- `PUT /:id` - Update review (requires auth)
- `DELETE /:id` - Delete review (requires auth)
- `POST /:id/helpful` - Mark review as helpful (requires auth)
- `DELETE /:id/helpful` - Remove helpful mark (requires auth)
- `POST /:id/report` - Report review (requires auth)

### Categories (`/api/categories`)

- `GET /` - Get all categories (public)
- `GET /:id` - Get category by ID (public)
- `GET /:id/properties` - Get properties in category (public)
- `POST /` - Create new category (admin only)
- `PUT /:id` - Update category (admin only)
- `DELETE /:id` - Delete category (admin only)
- `PUT /:id/toggle-status` - Toggle category status (admin only)
- `PUT /reorder` - Reorder categories (admin only)

### Agents (`/api/agents`)

- `GET /` - Get all agents (public)
- `GET /:id` - Get agent by ID (public)
- `GET /:id/properties` - Get agent's properties (public)
- `POST /` - Create new agent (admin only)
- `PUT /:id` - Update agent (admin only)
- `DELETE /:id` - Delete agent (admin only)
- `PUT /:id/toggle-status` - Toggle agent status (admin only)
- `PUT /:id/verify` - Toggle agent verification (admin only)
- `POST /:id/contact` - Contact agent (requires auth)
- `GET /search/locations` - Get agent locations (public)
- `GET /search/specialties` - Get agent specialties (public)

### Stories (`/api/stories`)

- `GET /` - Get all stories (public)
- `GET /featured` - Get featured stories (public)
- `GET /trending` - Get trending stories (public)
- `GET /:id` - Get story by ID (public)
- `POST /` - Create new story (requires auth)
- `PUT /:id` - Update story (requires auth)
- `DELETE /:id` - Delete story (requires auth)
- `POST /:id/like` - Like/unlike story (requires auth)
- `POST /:id/comments` - Add comment to story (requires auth)
- `DELETE /:storyId/comments/:commentId` - Delete comment (requires auth)
- `GET /search/categories` - Get story categories (public)
- `GET /search/tags` - Get story tags (public)

### Uploads (`/api/uploads`)

- `POST /image` - Upload single image (requires auth)
- `POST /images` - Upload multiple images (requires auth)
- `POST /property-images` - Upload property images (requires auth)
- `POST /avatar` - Upload user avatar (requires auth)
- `POST /payment-proof` - Upload payment proof (requires auth)
- `DELETE /:public_id` - Delete image from Cloudinary (requires auth)

### Payments (`/api/payments`)

- `POST /create-payment-intent` - Create Stripe payment intent (requires auth)
- `POST /confirm-payment` - Confirm payment (requires auth)
- `POST /webhook` - Stripe webhook endpoint (public)
- `POST /refund` - Process refund (admin only)
- `GET /booking/:bookingId` - Get payment details (requires auth)
- `GET /stats` - Get payment statistics (admin only)

## Sample Data

Run the seed script to populate the database with sample data:

```bash
npm run seed
```

### Sample Admin Credentials

- Email: `admin@staycation.com`
- Password: `password123`

### Sample User Credentials

- Email: `john@example.com`
- Password: `password123`

## Environment Variables

Create a `.env` file with the following variables:

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/staycation
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe (for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm start

# Seed database
npm run seed
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field specific error message"
    }
  ]
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Features

- JWT Authentication & Authorization
- Role-based access control (user/admin)
- File upload with Cloudinary
- Payment processing with Stripe
- Email notifications
- Input validation
- Error handling
- Rate limiting
- Security headers
- CORS enabled
- Data pagination
- Search and filtering
- Image transformations
- Webhook handling
