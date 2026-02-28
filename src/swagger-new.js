import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "Node APIs",
    description: "API documentation using swagger-autogen",
    version: "1.0.0",
  },
  host: "localhost:8001",
  schemes: ["http"],
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
  // Remove global security - apply per route instead
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./src/app.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);
