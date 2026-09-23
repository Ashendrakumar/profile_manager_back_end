/**
 * @swagger
 * /api/settings:
 *   get:
 *     tags:
 *       - Settings
 *     summary: Get current user's settings (created with defaults on first access)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings
 *   put:
 *     tags:
 *       - Settings
 *     summary: Update any subset of settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferences:
 *                 type: object
 *                 properties:
 *                   theme:
 *                     type: string
 *                     enum: [light, dark, system]
 *                   language:
 *                     type: string
 *                   timezone:
 *                     type: string
 *                   dateFormat:
 *                     type: string
 *                     enum: [DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD]
 *               notifications:
 *                 type: object
 *                 properties:
 *                   emailNotifications:
 *                     type: boolean
 *                   securityAlerts:
 *                     type: boolean
 *                   profileReminders:
 *                     type: boolean
 *                   certificationExpiry:
 *                     type: boolean
 *                   productUpdates:
 *                     type: boolean
 *               privacy:
 *                 type: object
 *                 properties:
 *                   portfolioVisibility:
 *                     type: string
 *                     enum: [public, private]
 *                   showEmail:
 *                     type: boolean
 *                   showPhone:
 *                     type: boolean
 *                   showAddress:
 *                     type: boolean
 *                   showResumeDownload:
 *                     type: boolean
 *                   showCertifications:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Settings updated
 */

/**
 * @swagger
 * /api/settings/reset:
 *   post:
 *     tags:
 *       - Settings
 *     summary: Reset settings to defaults
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: section
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [preferences, notifications, privacy]
 *     responses:
 *       200:
 *         description: Settings reset
 */

/**
 * @swagger
 * /api/settings/change-password:
 *   put:
 *     tags:
 *       - Settings
 *     summary: Change password (Google-only accounts can set one without currentPassword)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated
 */

/**
 * @swagger
 * /api/settings/account:
 *   delete:
 *     tags:
 *       - Settings
 *     summary: Permanently delete the current account and all its data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: Required for password accounts
 *               confirmText:
 *                 type: string
 *                 description: Must be "DELETE" for Google-only accounts
 *     responses:
 *       200:
 *         description: Account deleted
 */

import express from "express";
import authenticateToken from "../middlewares/auth.js";
import {
  getSettings,
  updateSettings,
  resetSettings,
  changePassword,
  deleteAccount,
} from "../controllers/settings.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get("/", getSettings);
router.put("/", updateSettings);
router.post("/reset", resetSettings);
router.put("/change-password", changePassword);
router.delete("/account", deleteAccount);

export default router;
