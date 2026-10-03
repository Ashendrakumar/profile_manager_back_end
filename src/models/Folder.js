import mongoose from "mongoose";

// A user-owned folder in the Documents module. Folders nest via
// `parentFolder` (null = top level). Documents live in their own collection
// and point back to a folder (see Document.js).
const FolderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
  },
  { timestamps: true },
);

FolderSchema.index({ user: 1, parentFolder: 1 });

export default mongoose.model("Folder", FolderSchema);
