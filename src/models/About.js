import mongoose from "mongoose";

const FeatureSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false },
);

const AboutSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: "About Our Project",
    },
    description: {
      type: String,
      required: true,
      trim: true,
      // Rich HTML content
    },
    features: {
      type: [FeatureSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("About", AboutSchema);
