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
export const createUploader = ({ folder = "common" }) => {
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

  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;

    const extName = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );

    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    }

    cb(new Error("Only image files are allowed"));
  };

  return multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter,
  });
};
