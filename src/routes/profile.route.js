/**
 * @swagger
 * /api/profile/personal-details:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get personal details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personal details
 *   post:
 *     tags:
 *       - Profile
 *     summary: Save personal details
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Personal details saved
 */

/**
 * @swagger
 * /api/profile/contact:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get contact details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contact details
 *   put:
 *     tags:
 *       - Profile
 *     summary: Update contact details
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Contact details updated
 */

/**
 * @swagger
 * /api/profile/education:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get education details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Education details
 *   post:
 *     tags:
 *       - Profile
 *     summary: Add education
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
 *         description: Education added
 */

/**
 * @swagger
 * /api/profile/education/{educationId}:
 *   put:
 *     tags:
 *       - Profile
 *     summary: Update education
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: educationId
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
 *         description: Education updated
 *   delete:
 *     tags:
 *       - Profile
 *     summary: Delete education
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: educationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Education deleted
 */

/**
 * @swagger
 * /api/profile/experience:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get experience details
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Experience details
 *   post:
 *     tags:
 *       - Profile
 *     summary: Add experience
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
 *         description: Experience added
 */

/**
 * @swagger
 * /api/profile/experience/companies:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get companies list
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Companies list
 */

/**
 * @swagger
 * /api/profile/experience/{experienceId}:
 *   put:
 *     tags:
 *       - Profile
 *     summary: Update experience
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: experienceId
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
 *         description: Experience updated
 *   delete:
 *     tags:
 *       - Profile
 *     summary: Delete experience
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: experienceId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Experience deleted
 */

/**
 * @swagger
 * /api/profile/projects:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get projects
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects list
 *   post:
 *     tags:
 *       - Profile
 *     summary: Add project
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
 *         description: Project added
 */

/**
 * @swagger
 * /api/profile/projects/{projectId}:
 *   put:
 *     tags:
 *       - Profile
 *     summary: Update project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
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
 *         description: Project updated
 *   delete:
 *     tags:
 *       - Profile
 *     summary: Delete project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted
 */

/**
 * @swagger
 * /api/profile/skills:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get skills
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Skills list
 *   post:
 *     tags:
 *       - Profile
 *     summary: Add skill
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
 *         description: Skill added
 */

/**
 * @swagger
 * /api/profile/skills/{skillId}:
 *   put:
 *     tags:
 *       - Profile
 *     summary: Update skill
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: skillId
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
 *         description: Skill updated
 *   delete:
 *     tags:
 *       - Profile
 *     summary: Delete skill
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: skillId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Skill deleted
 */

import express from "express";
import {
  // Personal Details
  getPersonalDetails,
  savePersonalDetails,
  // Contact Details
  getContactDetails,
  updateContactDetails,
  // Education
  getEducation,
  addEducation,
  updateEducation,
  deleteEducation,
  // Experience
  getExperience,
  addExperience,
  updateExperience,
  deleteExperience,
  getCompanies,
  // Projects
  getProjects,
  addProject,
  updateProject,
  deleteProject,
  // Skills
  getSkills,
  addSkill,
  updateSkill,
  deleteSkill,
  // Profile Completion
  getProfileCompletion,
} from "../controllers/profile.controller.js";

import authenticateToken from "../middlewares/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Personal Details routes
router.get("/personal-details", getPersonalDetails);
router.post("/save-personal-details", savePersonalDetails);

// Contact Details routes
router.get("/contact", getContactDetails);
router.put("/contact", updateContactDetails);

// Education routes
router.get("/education", getEducation);
router.post("/education", addEducation);
router.put("/education/:educationId", updateEducation);
router.delete("/education/:educationId", deleteEducation);

// Experience routes
router.get("/experience", getExperience);
router.post("/experience", addExperience);
router.put("/experience/:experienceId", updateExperience);
router.delete("/experience/:experienceId", deleteExperience);
router.get("/experience/companies", getCompanies);
// Projects routes
router.get("/projects", getProjects);
router.post("/projects", addProject);
router.put("/projects/:projectId", updateProject);
router.delete("/projects/:projectId", deleteProject);

// Skills routes
router.get("/skills", getSkills);
router.post("/skills", addSkill);
router.put("/skills/:skillId", updateSkill);
router.delete("/skills/:skillId", deleteSkill);

// Profile Completion routes
router.get("/completion", getProfileCompletion);

export default router;
