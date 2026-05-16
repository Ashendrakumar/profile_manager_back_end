import express from "express";
import { createUploader } from "../middlewares/upload.js";
import * as uploadController from "../controllers/upload.controller.js";

const router = express.Router();
const { uploadProfile, uploadHeroImages } = uploadController;

router.post("/profile-upload", uploadProfile);

router.post("/hero-images", uploadHeroImages);

export default router;
