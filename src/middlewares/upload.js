import multer from "multer";
import path from "path";
import fs from "fs";

import { fileURLToPath } from "url";

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create folder if not exists
const createFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

// Reusable uploader
export const createUploader = ({
  folder = "common",
  allowedFileTypes = "images",
}) => {
  const uploadPath = path.join(__dirname, `../uploads/${folder}`);

  createFolder(uploadPath);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(
        Math.random() * 1e9,
      )}${path.extname(file.originalname)}`;

      cb(null, uniqueName);
    },
  });

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

    cb(new Error(currentRules.errorMsg));
  };

  return multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter,
  });
};
