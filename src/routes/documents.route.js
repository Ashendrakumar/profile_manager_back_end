/**
 * @swagger
 * /api/documents/folders:
 *   get:
 *     tags:
 *       - Documents
 *     summary: Get all folders, each with its documents
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Folders list
 *   post:
 *     tags:
 *       - Documents
 *     summary: Create folder
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               parentFolderId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Folder created
 */

/**
 * @swagger
 * /api/documents/folders/{folderId}:
 *   put:
 *     tags:
 *       - Documents
 *     summary: Update folder (rename, describe, or move)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: folderId
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               parentFolderId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Folder updated
 *   delete:
 *     tags:
 *       - Documents
 *     summary: Delete folder, its subfolders, and all their documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: folderId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Folder deleted
 */

/**
 * @swagger
 * /api/documents:
 *   get:
 *     tags:
 *       - Documents
 *     summary: List documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: folderId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *       - name: search
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Documents list
 *   post:
 *     tags:
 *       - Documents
 *     summary: Upload document (max 5MB)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, folderId]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               displayName:
 *                 type: string
 *               folderId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document uploaded
 */

/**
 * @swagger
 * /api/documents/{documentId}:
 *   get:
 *     tags:
 *       - Documents
 *     summary: Get document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: documentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document
 *   put:
 *     tags:
 *       - Documents
 *     summary: Update document (rename, move, or replace file)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: documentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               displayName:
 *                 type: string
 *               folderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document updated
 *   delete:
 *     tags:
 *       - Documents
 *     summary: Delete document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: documentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted
 */

import express from "express";
import authenticateToken from "../middlewares/auth.js";
import { createUploader } from "../middlewares/upload.js";
import {
  // Folders
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  // Documents
  getDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  deleteDocument,
} from "../controllers/document.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

const documentUploader = createUploader({ allowedFileTypes: "files" });

// Folder routes (declared before /:documentId so "folders" isn't read as an id)
router.get("/folders", getFolders);
router.post("/folders", createFolder);
router.put("/folders/:folderId", updateFolder);
router.delete("/folders/:folderId", deleteFolder);

// Document routes
router.get("/", getDocuments);
router.post("/", documentUploader.single("file"), uploadDocument);
router.get("/:documentId", getDocumentById);
router.put("/:documentId", documentUploader.single("file"), updateDocument);
router.delete("/:documentId", deleteDocument);

export default router;
