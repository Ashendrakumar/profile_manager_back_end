// src/routes/posts.route.js

/**
 * @swagger
 * /api/posts:
 *   post:
 *     tags:
 *       - Posts
 *     summary: Create a new post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Post created
 *   get:
 *     tags:
 *       - Posts
 *     summary: Get all posts
 *     responses:
 *       200:
 *         description: List of posts
 */

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Get post by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post details
 *   put:
 *     tags:
 *       - Posts
 *     summary: Update post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Post updated
 *   delete:
 *     tags:
 *       - Posts
 *     summary: Delete post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted
 */

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
