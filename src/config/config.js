import dotenv from "dotenv";
dotenv.config();

const config = {
  port: process.env.PORT || 10000,
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  encryptionKey: process.env.ENCRYPTION_KEY,
  portfolioUrl: process.env.PORTFOLIO_URL,
  baseUrl:
    process.env.BASE_URL || `http://localhost:${process.env.PORT || 10000}`,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
};

export default config;
