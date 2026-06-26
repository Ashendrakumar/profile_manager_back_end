import dotenv from "dotenv";
dotenv.config();

const config = {
  port: process.env.PORT || 8001,
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  encryptionKey: process.env.ENCRYPTION_KEY,
  portfolioUrl: process.env.PORTFOLIO_URL,
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 8001}`,
};

export default config;
