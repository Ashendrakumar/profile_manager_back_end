import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Profile Manager API",
      version: "1.0.0",
      description: "Node APIs for profile manager",
    },
    servers: [
      {
        url: "http://localhost:8001",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    "./src/routes/users.route.js",
    "./src/routes/posts.route.js",
    "./src/routes/profile.route.js",
    "./src/routes/portfolio.route.js",
    "./src/routes/upload.route.js",
  ],
};

const specs = swaggerJsdoc(options);

export default specs;
