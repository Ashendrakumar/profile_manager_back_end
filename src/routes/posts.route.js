// src/routes/posts.route.js

import express from "express";
import * as postController from "../controllers/post.controller.js";
import authenticateToken from "../middlewares/auth.js";

const router = express.Router();

router.post("/", authenticateToken, postController.createPost);
router.get("/", postController.getPosts);
router.get("/:id", postController.getPostById);
router.put("/:id", authenticateToken, postController.updatePost);
router.delete("/:id", authenticateToken, postController.deletePost);

export default router;
