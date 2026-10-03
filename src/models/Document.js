import mongoose from "mongoose";

// A single uploaded file in the Documents module. The bytes live in the
// storage service (local disk or Cloudflare R2); `filePath` holds whatever
// storage.save() returned, and storage.resolveUrl() turns it into a URL.
const DocumentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      required: true,
      index: true,
    },
    displayName: { type: String, required: true, trim: true, maxlength: 150 },
    fileName: { type: String, required: true }, // original filename
    fileType: { type: String, default: "application/octet-stream" }, // MIME type
    fileSize: { type: Number, default: 0 }, // bytes
    filePath: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("Document", DocumentSchema);
