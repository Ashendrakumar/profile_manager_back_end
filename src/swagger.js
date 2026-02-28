import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "Node APIs",
    description: "API documentation using swagger-autogen",
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
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./src/app.js"]; // entry file

swaggerAutogen(outputFile, endpointsFiles, doc);
