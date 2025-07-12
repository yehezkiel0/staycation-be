# Contributing to Staycation Backend

## Ì¥ù How to Contribute

### Development Setup
1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and configure
5. Start development server: `npm run dev`

### Code Style
- Use consistent indentation (2 spaces)
- Follow ES6+ standards
- Use meaningful variable names
- Add comments for complex logic
- Validate all inputs

### API Guidelines
- RESTful endpoints
- Consistent response formats
- Proper HTTP status codes
- Comprehensive error handling
- Input validation and sanitization

### Database Guidelines
- Use Mongoose schemas with validation
- Proper indexing for performance
- Consistent naming conventions
- Handle relationships appropriately

### Testing
- Write unit tests for new features
- Test all API endpoints
- Validate error scenarios
- Check edge cases

### Pull Request Process
1. Create feature branch from master
2. Make your changes
3. Test thoroughly
4. Update documentation if needed
5. Submit pull request with clear description

### Commit Message Format
```
type(scope): description

feat: add new endpoint
fix: resolve authentication issue
docs: update API documentation
style: format code
refactor: improve performance
test: add missing tests
```

### Security
- Never commit sensitive data
- Use environment variables for secrets
- Validate and sanitize all inputs
- Follow OWASP guidelines
- Report security issues privately
