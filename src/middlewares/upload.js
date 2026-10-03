import multer from "multer";
import path from "path";

// Uploads are held in memory as buffers and then handed to the storage service
// (src/services/storageService.js), which decides where the bytes actually go —
// local disk in dev, Cloudflare R2 in production. Multer no longer touches the
// filesystem directly, so switching the storage driver requires no changes here.
export const createUploader = ({ allowedFileTypes = "images" } = {}) => {
  const storage = multer.memoryStorage();

  // Define allowed file types
  const fileTypeRules = {
    images: {
      extensions: /jpeg|jpg|png|webp/,
      mimeTypes: /image\/(jpeg|jpg|png|webp)/,
      errorMsg: "Only image files are allowed (jpeg, jpg, png, webp)",
    },
    documents: {
      extensions: /pdf|doc|docx/,
      mimeTypes:
        /application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)/,
      errorMsg: "Only document files are allowed (pdf, doc, docx)",
    },
    // Documents module: office files, text, and images.
    files: {
      extensions:
        /^\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|jpeg|jpg|png|webp|gif)$/,
      mimeTypes:
        /^(application\/(pdf|msword|vnd\.openxmlformats-officedocument\.(wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation)|vnd\.ms-excel|vnd\.ms-powerpoint)|text\/(plain|csv)|image\/(jpeg|jpg|png|webp|gif))$/,
      errorMsg:
        "Unsupported file type (allowed: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv, jpg, png, webp, gif)",
    },
  };

  const currentRules = fileTypeRules[allowedFileTypes] || fileTypeRules.images;

  const fileFilter = (req, file, cb) => {
    const extName = currentRules.extensions.test(
      path.extname(file.originalname).toLowerCase(),
    );

    const mimeType = currentRules.mimeTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    }

    const error = new Error(currentRules.errorMsg);
    error.statusCode = 400; // invalid file type is a client error, not a 500
    cb(error);
  };

  return multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter,
  });
};
