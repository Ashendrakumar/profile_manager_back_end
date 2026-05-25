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

export default router;
