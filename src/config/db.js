import mongoose from "mongoose";
import config from "./config.js";

const connectDB = async () => {
  console.log(config.mongoURI);

  try {
    await mongoose.connect(config.mongoURI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
