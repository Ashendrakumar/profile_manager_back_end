# Profile Manager API

A comprehensive backend API for managing user profiles, portfolios, and professional information.

## Features

- ✅ User authentication with JWT
- ✅ Complete profile management (personal, contact, education, experience, projects, skills)
- ✅ File uploads (profile image, resume, hero images)
- ✅ Portfolio generation with public access
- ✅ Role-based access control (admin/user)
- ✅ Rate limiting and request logging
- ✅ Input validation
- ✅ Error handling with standardized responses
- ✅ API documentation with Swagger
- ✅ Pagination and sorting support

## Technology Stack

- **Runtime**: Node.js with ES Modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **File Upload**: multer
- **API Documentation**: Swagger/OpenAPI
- **Validation**: express-validator
- **Rate Limiting**: express-rate-limit
- **Logging**: Morgan

## Installation

1. Clone the repository
```bash
git clone <repo-url>
cd profile_manager_back_end
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the server
```bash
npm start        # Production
npm run dev      # Development with nodemon
```

The API will be available at `http://localhost:10000`

## Environment Variables

```
PORT=10000
MONGODB_URI=mongodb://localhost:27017/profile_manager
JWT_SECRET=your_jwt_secret_key
BASE_URL=http://localhost:10000
PORTFOLIO_URL=http://localhost:3000
NODE_ENV=development
```

## API Endpoints

### Authentication

- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `POST /api/users/logout` - Logout user

### User Management

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/me` - Get current user
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users/create` - Create user (admin only)
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user (admin only)

### Profile - Personal Details

- `GET /api/profile/personal-details` - Get personal details
- `POST /api/profile/save-personal-details` - Save personal details

### Profile - Contact Details

- `GET /api/profile/contact` - Get contact details
- `PUT /api/profile/contact` - Update contact details

### Profile - Education

- `GET /api/profile/education` - Get all education entries
- `POST /api/profile/education` - Add education
- `PUT /api/profile/education/{educationId}` - Update education
- `DELETE /api/profile/education/{educationId}` - Delete education

### Profile - Experience

- `GET /api/profile/experience` - Get all experience entries
- `POST /api/profile/experience` - Add experience
- `PUT /api/profile/experience/{experienceId}` - Update experience
- `DELETE /api/profile/experience/{experienceId}` - Delete experience
- `GET /api/profile/experience/companies` - Get company list

### Profile - Projects

- `GET /api/profile/projects` - Get all projects
- `POST /api/profile/projects` - Add project
- `PUT /api/profile/projects/{projectId}` - Update project
- `DELETE /api/profile/projects/{projectId}` - Delete project

### Profile - Skills

- `GET /api/profile/skills` - Get all skills
- `POST /api/profile/skills` - Add skill
- `PUT /api/profile/skills/{skillId}` - Update skill
- `DELETE /api/profile/skills/{skillId}` - Delete skill

### Portfolio

- `GET /api/portfolio/{id}` - Get user portfolio (public)
- `GET /api/portfolio/public/{username}` - Get public profile
- `POST /api/portfolio/generate` - Generate portfolio link

### File Upload

- `POST /api/upload/profile` - Upload profile image
- `POST /api/upload/resume` - Upload resume PDF
- `POST /api/upload/heroes` - Upload hero images (max 5)
- `GET /api/upload/download-resume` - Download resume
- `GET /api/upload/download-file` - Get download URL

### Posts

- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post
- `GET /api/posts/{id}` - Get post by ID
- `PUT /api/posts/{id}` - Update post
- `DELETE /api/posts/{id}` - Delete post

## Request/Response Format

### Success Response
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success",
  "success": true
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "errors": [],
  "success": false
}
```

## Authentication

Include JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Pagination

List endpoints support pagination:
```
GET /api/users?page=1&limit=10
```

## Rate Limiting

- Login: 5 attempts per 15 minutes
- Register: 3 attempts per hour
- API: 100 requests per minute
- Upload: 10 uploads per minute

## Validation Rules

### Register
- Username: minimum 3 characters
- Email: valid email format
- Password: minimum 6 characters

### Education
- Standard/Degree: required
- Institution: required
- Passing Year: between 1900 and current year + 5

### Experience
- Company Name, Role, Location: required
- Dates: valid ISO8601 format

### Skill
- Name, Category: required
- Level: BEGINNER, INTERMEDIATE, ADVANCED, or EXPERT

## API Documentation

Interactive API documentation is available at:
```
http://localhost:10000/api-docs
```

## File Structure

```
src/
├── app.js                 # Express app setup
├── server.js              # Server entry point
├── config/                # Configuration files
│   ├── config.js         # App config
│   └── db.js             # Database connection
├── models/                # Mongoose models
│   ├── User.js
│   └── Post.js
├── controllers/           # Route controllers
│   ├── user.controller.js
│   ├── profile.controller.js
│   ├── portfolio.controller.js
│   ├── upload.controller.js
│   └── post.controller.js
├── routes/                # API routes
│   ├── index.route.js
│   ├── users.route.js
│   ├── profile.route.js
│   ├── portfolio.route.js
│   ├── upload.route.js
│   └── posts.route.js
├── middlewares/           # Custom middlewares
│   ├── auth.js           # JWT authentication
│   ├── authorize.js      # Role authorization
│   ├── errorHandler.js   # Error handling
│   ├── logger.js         # Request logging
│   ├── rateLimiter.js    # Rate limiting
│   └── upload.js         # File upload config
├── utils/                # Utility functions
│   ├── validators.js     # Input validators
│   ├── response.js       # Response formatting
│   ├── pagination.js     # Pagination utilities
│   ├── cryptoHelper.js
│   ├── routeHelpers.js
│   └── swaggerHelpers.js
└── mappers/              # Data mappers
    └── portfolio.mapper.js
```

## Logs

Request logs are stored in:
- `logs/access.log` - All requests
- `logs/error.log` - Error requests only

## Security Best Practices

1. **JWT Secret**: Use a strong, random string in production
2. **CORS**: Configure allowed origins in production
3. **Rate Limiting**: Enabled by default
4. **Input Validation**: All inputs are validated
5. **Password Hashing**: Passwords are hashed with bcryptjs
6. **Authorization**: Role-based access control

## Error Handling

All errors return standardized error responses with:
- Status code
- Error message
- Field-specific error details (if validation errors)

## Testing

To test the API, you can use:
- Postman
- Insomnia
- curl
- Swagger UI at `/api-docs`

Example with curl:
```bash
curl -X POST http://localhost:10000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## Missing Features (Future Work)

The following features are planned for future versions:
1. Password reset functionality with email verification
2. Refresh token implementation for better security
3. Unit and integration tests
4. Audit logging for all user actions
5. Advanced search and filtering
6. Two-factor authentication
7. Profile completion percentage tracking
8. Soft delete functionality for users

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

ISC

## Support

For issues and questions, please create an issue in the repository.
