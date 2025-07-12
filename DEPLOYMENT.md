# Staycation Backend Deployment Guide

## íº€ Production Deployment

### Prerequisites
- Node.js v18+ 
- MongoDB Atlas account or local MongoDB instance
- Environment variables configured

### Environment Variables (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
CORS_ORIGIN=https://your-frontend-domain.com
```

### Installation Steps
```bash
# Clone repository
git clone https://github.com/yehezkiel0/staycation-be.git
cd staycation-be

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Seed database (first time only)
node seedDatabase.js

# Start production server
npm start
```

### API Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

### Health Check
GET `/api/health` - Returns server status

### Database Setup
1. Create MongoDB Atlas cluster or local instance
2. Configure connection string in .env
3. Run seeding script to populate initial data

### Security Considerations
- JWT secrets should be complex and unique
- CORS configured for specific frontend domains
- Rate limiting implemented
- Input validation on all endpoints
- Error messages sanitized for production

### Monitoring
- Server logs for debugging
- API response times
- Database connection status
- Error tracking recommended

### Scaling
- Use PM2 for process management
- Load balancer for multiple instances  
- Database indexing for performance
- Caching layer (Redis) for high traffic
