import User from "../models/User.js";
import config from "../config/config.js";

// ==================== Helper Functions ====================

// Get full download URL
const getDownloadUrl = (filePath) => {
  if (!filePath) return null;
  return `${config.baseUrl}${filePath}`;
};

// Shape a resume subdocument for API responses with an absolute download URL.
const formatResume = (resume) => ({
  _id: resume._id,
  fileName: resume.fileName,
  filePath: resume.filePath,
  downloadUrl: getDownloadUrl(resume.filePath),
  isPrimary: resume.isPrimary,
  uploadedAt: resume.createdAt,
});

const normalizeCompanyName = (companyName) => {
  return typeof companyName === "string"
    ? companyName.trim().toLowerCase()
    : "";
};

const getProjectsByCompany = (projects = []) => {
  const map = new Map();

  for (const project of projects) {
    if (project.projectType !== "Professional") continue;

    const companyKey = normalizeCompanyName(project.company);
    if (!companyKey || !project._id || !project.title) continue;

    const projectLinks = map.get(companyKey) || [];
    projectLinks.push({
      projectId: project._id.toString(),
      title: project.title,
    });
    map.set(companyKey, projectLinks);
  }

  return map;
};

const syncExperienceProjectLinks = (user) => {
  if (!user?.experience || !user?.projects) return;

  const projectMap = getProjectsByCompany(user.projects);

  user.experience.forEach((exp) => {
    const companyKey = normalizeCompanyName(exp.companyName);
    exp.projects = companyKey ? projectMap.get(companyKey) || [] : [];
  });
};

const syncSkillsWithTechnologies = (user, technologies = []) => {
  if (!user?.skills || !Array.isArray(technologies)) return;

  const normalizedTechs = technologies
    .map((tech) => ({
      normalized: typeof tech === "string" ? tech.trim().toLowerCase() : "",
      original: tech,
    }))
    .filter((t) => t.normalized);

  const existingSkillNames = new Set(
    user.skills.map((skill) => skill.name.toLowerCase().trim()),
  );

  for (const tech of normalizedTechs) {
    if (!existingSkillNames.has(tech.normalized)) {
      user.skills.push({
        name: tech.original,
        category: "Others",
        level: "ADVANCED",
        yearsOfExperience: 1,
      });
      existingSkillNames.add(tech.normalized);
    }
  }
};

const calculateProfileCompletion = (user) => {
  if (!user) return { percentage: 0, completedSections: [] };

  const weights = {
    personalDetails: 15,
    contactDetails: 15,
    education: 10,
    experience: 15,
    projects: 10,
    skills: 10,
    portfolio: 10,
    profileImage: 5,
    resume: 10,
  };

  const completedSections = [];
  let totalPercentage = 0;

  // Check Personal Details (15%)
  const personalDetailsComplete =
    user.personalDetails?.firstName &&
    user.personalDetails?.lastName &&
    user.personalDetails?.jobRole;
  if (personalDetailsComplete) {
    completedSections.push("Personal Details");
    totalPercentage += weights.personalDetails;
  }

  // Check Contact Details (15%)
  const contactDetailsComplete =
    user.email &&
    user.contactDetails?.phones?.length > 0 &&
    user.contactDetails?.addresses?.length > 0;
  if (contactDetailsComplete) {
    completedSections.push("Contact Details");
    totalPercentage += weights.contactDetails;
  }

  // Check Education (10%)
  if (user.education && user.education.length > 0) {
    completedSections.push("Education");
    totalPercentage += weights.education;
  }

  // Check Experience (15%)
  if (user.experience && user.experience.length > 0) {
    completedSections.push("Experience");
    totalPercentage += weights.experience;
  }

  // Check Projects (10%)
  if (user.projects && user.projects.length > 0) {
    completedSections.push("Projects");
    totalPercentage += weights.projects;
  }

  // Check Skills (10%)
  if (user.skills && user.skills.length > 0) {
    completedSections.push("Skills");
    totalPercentage += weights.skills;
  }

  // Check Portfolio (10%)
  const portfolioComplete = user.portfolio?.link && user.portfolio.link.trim();
  if (portfolioComplete) {
    completedSections.push("Portfolio");
    totalPercentage += weights.portfolio;
  }

  // Check Profile Image (5%)
  if (user.profileImage && user.profileImage.trim()) {
    completedSections.push("Profile Image");
    totalPercentage += weights.profileImage;
  }

  // Check Resume (10%)
  if (user.resumes?.length > 0 || (user.resume && user.resume.trim())) {
    completedSections.push("Resume");
    totalPercentage += weights.resume;
  }

  return {
    percentage: totalPercentage,
    completedSections,
    lastCalculatedAt: new Date(),
  };
};

// ==================== Personal Details ====================

// Get personal details
const getPersonalDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("personalDetails");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const personalDetails = {
      firstName: user.personalDetails?.firstName || "",
      lastName: user.personalDetails?.lastName || "",
      profileName: user.personalDetails?.profileName || "",
      jobRole: user.personalDetails?.jobRole || "",
      profileDescription: user.personalDetails?.profileDescription || "",
    };

    res.json({ personalDetails });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch personal details",
      error: err.message,
    });
  }
};

// Save personal details
const savePersonalDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, profileName, jobRole, profileDescription } =
      req.body;

    const updateData = {};
    if (firstName !== undefined)
      updateData["personalDetails.firstName"] = firstName;
    if (lastName !== undefined)
      updateData["personalDetails.lastName"] = lastName;
    if (profileName !== undefined)
      updateData["personalDetails.profileName"] = profileName;
    if (jobRole !== undefined) updateData["personalDetails.jobRole"] = jobRole;
    if (profileDescription !== undefined)
      updateData["personalDetails.profileDescription"] = profileDescription;

    let user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("personalDetails");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Recalculate profile completion
    const completion = calculateProfileCompletion(user);
    user.profileCompletion = {
      percentage: completion.percentage,
      completedSections: completion.completedSections,
      lastCalculatedAt: completion.lastCalculatedAt,
    };
    await user.save();

    res.json({
      message: "Personal details saved successfully",
      personalDetails: {
        firstName: user.personalDetails?.firstName || "",
        lastName: user.personalDetails?.lastName || "",
        profileName: user.personalDetails?.profileName || "",
        jobRole: user.personalDetails?.jobRole || "",
        profileDescription: user.personalDetails?.profileDescription || "",
      },
      profileCompletion: user.profileCompletion,
    });
  } catch (err) {
    res.status(400).json({
      message: "Failed to save personal details",
      error: err.message,
    });
  }
};

// ==================== Contact Details ====================

// Get contact details
const getContactDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select(
      "email contactDetails resume resumes profileImage",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const personContact = {
      email: user.email,
      resumes: (user.resumes || []).map(formatResume),

      profileImage: user.profileImage,
      profileImageUrl: getDownloadUrl(user.profileImage),
      ...(user.contactDetails?.toObject?.() || user.contactDetails || null),
    };
    res.json({ contactDetails: personContact });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch contact details", error: err.message });
  }
};

// Update contact details
const updateContactDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { email, phones, addresses, socialLinks } = req.body;

    const updateData = {};
    if (email !== undefined) updateData["email"] = email;
    if (phones !== undefined) updateData["contactDetails.phones"] = phones;
    if (addresses !== undefined)
      updateData["contactDetails.addresses"] = addresses;
    if (socialLinks !== undefined)
      updateData["contactDetails.socialLinks"] = socialLinks;

    let user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select(
      "contactDetails email personalDetails education experience projects skills portfolio profileImage resume resumes",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Recalculate profile completion
    const completion = calculateProfileCompletion(user);
    user.profileCompletion = {
      percentage: completion.percentage,
      completedSections: completion.completedSections,
      lastCalculatedAt: completion.lastCalculatedAt,
    };
    await user.save();

    res.json({
      message: "Contact details updated successfully",
      contactDetails: user.contactDetails,
      profileCompletion: user.profileCompletion,
    });
  } catch (err) {
    res.status(400).json({
      message: "Failed to update contact details",
      error: err.message,
    });
  }
};

// ==================== Education ====================

// Get all education entries
const getEducation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("education");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ education: user.education || [] });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch education", error: err.message });
  }
};

// Add education entry
const addEducation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const educationData = req.body;

    let user = await User.findById(userId).select(
      "education personalDetails contactDetails email experience projects skills portfolio profileImage resume resumes",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.education.push(educationData);

    // Recalculate profile completion
    const completion = calculateProfileCompletion(user);
    user.profileCompletion = {
      percentage: completion.percentage,
      completedSections: completion.completedSections,
      lastCalculatedAt: completion.lastCalculatedAt,
    };

    await user.save();

    const newEducation = user.education[user.education.length - 1];
    res.status(201).json({
      message: "Education added successfully",
      education: newEducation,
      profileCompletion: user.profileCompletion,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to add education", error: err.message });
  }
};

// Update education entry
const updateEducation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { educationId } = req.params;
    const updateData = req.body;

    let user = await User.findOne({ _id: userId }).select(
      "education personalDetails contactDetails email experience projects skills portfolio profileImage resume resumes",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const educationIndex = user.education.findIndex(
      (edu) => edu._id.toString() === educationId,
    );

    if (educationIndex === -1) {
      return res.status(404).json({ message: "Education entry not found" });
    }

    Object.assign(user.education[educationIndex], updateData);

    // Recalculate profile completion
    const completion = calculateProfileCompletion(user);
    user.profileCompletion = {
      percentage: completion.percentage,
      completedSections: completion.completedSections,
      lastCalculatedAt: completion.lastCalculatedAt,
    };

    await user.save();

    res.json({
      message: "Education updated successfully",
      education: user.education[educationIndex],
      profileCompletion: user.profileCompletion,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to update education", error: err.message });
  }
};

// Delete education entry
const deleteEducation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { educationId } = req.params;

    let user = await User.findById(userId).select(
      "education personalDetails contactDetails email experience projects skills portfolio profileImage resume resumes",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const educationIndex = user.education.findIndex(
      (edu) => edu._id.toString() === educationId,
    );

    if (educationIndex === -1) {
      return res.status(404).json({ message: "Education not found" });
    }

    user.education.splice(educationIndex, 1);

    // Recalculate profile completion
    const completion = calculateProfileCompletion(user);
    user.profileCompletion = {
      percentage: completion.percentage,
      completedSections: completion.completedSections,
      lastCalculatedAt: completion.lastCalculatedAt,
    };

    await user.save();

    res.json({
      message: "Education deleted successfully",
      profileCompletion: user.profileCompletion,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to delete education", error: err.message });
  }
};

// ==================== Experience ====================

// Get all experience entries
const getExperience = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("experience projects");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const projectMap = getProjectsByCompany(user.projects || []);
    const experienceWithProjects = (user.experience || []).map((exp) => {
      const companyKey = normalizeCompanyName(exp.companyName);
      return {
        ...exp.toObject(),
        projects: companyKey ? projectMap.get(companyKey) || [] : [],
      };
    });

    res.json({ experience: experienceWithProjects });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch experience", error: err.message });
  }
};

// Add experience entry
const addExperience = async (req, res) => {
  try {
    const userId = req.user.userId;
    const experienceData = req.body;

    let user = await User.findById(userId).select(
      "experience projects skills personalDetails contactDetails email education projects skills portfolio profileImage resume resumes",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.experience.push(experienceData);
    syncExperienceProjectLinks(user);
    syncSkillsWithTechnologies(user, experienceData.technologiesUsed);

    // Recalculate profile completion
    const completion = calculateProfileCompletion(user);
    user.profileCompletion = {
      percentage: completion.percentage,
      completedSections: completion.completedSections,
      lastCalculatedAt: completion.lastCalculatedAt,
    };

    await user.save();

    const newExperience = user.experience[user.experience.length - 1];
    res.status(201).json({
      message: "Experience added successfully",
      experience: newExperience,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to add experience", error: err.message });
  }
};

// Update experience entry
const updateExperience = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { experienceId } = req.params;
    const updateData = req.body;

    let user = await User.findOne({ _id: userId }).select(
      "experience projects skills personalDetails contactDetails email education portfolio profileImage resume resumes",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const experienceIndex = user.experience.findIndex(
      (exp) => exp._id.toString() === experienceId,
    );

    if (experienceIndex === -1) {
      return res.status(404).json({ message: "Experience entry not found" });
    }

    Object.assign(user.experience[experienceIndex], updateData);
    syncExperienceProjectLinks(user);
    syncSkillsWithTechnologies(user, updateData.technologiesUsed);

    // Recalculate profile completion
    const completion = calculateProfileCompletion(user);
    user.profileCompletion = {
      percentage: completion.percentage,
      completedSections: completion.completedSections,
      lastCalculatedAt: completion.lastCalculatedAt,
    };

    await user.save();

    res.json({
      message: "Experience updated successfully",
      experience: user.experience[experienceIndex],
      profileCompletion: user.profileCompletion,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to update experience", error: err.message });
  }
};

// Delete experience entry
const deleteExperience = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { experienceId } = req.params;

    let user = await User.findById(userId).select(
      "experience projects skills personalDetails contactDetails email education portfolio profileImage resume resumes",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const experienceIndex = user.experience.findIndex(
      (exp) => exp._id.toString() === experienceId,
    );

    if (experienceIndex === -1) {
      return res.status(404).json({ message: "Experience not found" });
    }

    user.experience.splice(experienceIndex, 1);

    // Recalculate profile completion
    const completion = calculateProfileCompletion(user);
    user.profileCompletion = {
      percentage: completion.percentage,
      completedSections: completion.completedSections,
      lastCalculatedAt: completion.lastCalculatedAt,
    };

    await user.save();

    res.json({
      message: "Experience deleted successfully",
      profileCompletion: user.profileCompletion,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to delete experience", error: err.message });
  }
};

const getCompanies = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("experience");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const companies = user.experience.map((exp) => {
      return {
        companyName: exp.companyName,
        id: exp._id,
      };
    });

    res.json({ companies: companies || [] });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch experience", error: err.message });
  }
};
// ==================== Projects ====================

// Get all projects
const getProjects = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("projects");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ projects: user.projects || [] });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch projects", error: err.message });
  }
};

// Add project
const addProject = async (req, res) => {
  try {
    const userId = req.user.userId;
    const projectData = req.body;

    let user = await User.findById(userId).select(
      "projects experience skills personalDetails contactDetails email education portfolio profileImage resume resumes",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.projects.push(projectData);
    syncExperienceProjectLinks(user);
    syncSkillsWithTechnologies(user, projectData.technologies);

    // Recalculate profile completion
    const completion = calculateProfileCompletion(user);
    user.profileCompletion = {
      percentage: completion.percentage,
      completedSections: completion.completedSections,
      lastCalculatedAt: completion.lastCalculatedAt,
    };

    await user.save();

    const newProject = user.projects[user.projects.length - 1];
    res.status(201).json({
      message: "Project added successfully",
      project: newProject,
      profileCompletion: user.profileCompletion,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to add project", error: err.message });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId } = req.params;
    const updateData = req.body;

    let user = await User.findOne({ _id: userId }).select(
      "projects experience skills personalDetails contactDetails email education portfolio profileImage resume resumes",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const projectIndex = user.projects.findIndex(
      (proj) => proj._id.toString() === projectId,
    );

    if (projectIndex === -1) {
      return res.status(404).json({ message: "Project not found" });
    }

    Object.assign(user.projects[projectIndex], updateData);
    syncExperienceProjectLinks(user);
    syncSkillsWithTechnologies(user, updateData.technologies);

    // Recalculate profile completion
    const completion = calculateProfileCompletion(user);
    user.profileCompletion = {
      percentage: completion.percentage,
      completedSections: completion.completedSections,
      lastCalculatedAt: completion.lastCalculatedAt,
    };

    await user.save();

    res.json({
      message: "Project updated successfully",
      project: user.projects[projectIndex],
      profileCompletion: user.profileCompletion,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to update project", error: err.message });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId } = req.params;

    let user = await User.findById(userId).select(
      "projects experience skills personalDetails contactDetails email education portfolio profileImage resume resumes",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const projectIndex = user.projects.findIndex(
      (proj) => proj._id.toString() === projectId,
    );

    if (projectIndex === -1) {
      return res.status(404).json({ message: "Project not found" });
    }

    user.projects.splice(projectIndex, 1);
    syncExperienceProjectLinks(user);

    // Recalculate profile completion
    const completion = calculateProfileCompletion(user);
    user.profileCompletion = {
      percentage: completion.percentage,
      completedSections: completion.completedSections,
      lastCalculatedAt: completion.lastCalculatedAt,
    };

    await user.save();

    res.json({
      message: "Project deleted successfully",
      profileCompletion: user.profileCompletion,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to delete project", error: err.message });
  }
};

// ==================== Skills ====================

// Get all skills
const getSkills = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("skills");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ skills: user.skills || [] });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch skills", error: err.message });
  }
};

// Add skill
const addSkill = async (req, res) => {
  try {
    const userId = req.user.userId;
    const skillData = req.body;

    let user = await User.findById(userId).select(
      "skills personalDetails contactDetails email education experience projects portfolio profileImage resume resumes",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.skills.push(skillData);

    // Recalculate profile completion
    const completion = calculateProfileCompletion(user);
    user.profileCompletion = {
      percentage: completion.percentage,
      completedSections: completion.completedSections,
      lastCalculatedAt: completion.lastCalculatedAt,
    };

    await user.save();

    const newSkill = user.skills[user.skills.length - 1];
    res.status(201).json({
      message: "Skill added successfully",
      skill: newSkill,
      profileCompletion: user.profileCompletion,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to add skill", error: err.message });
  }
};

// Update skill
const updateSkill = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { skillId } = req.params;
    const updateData = req.body;

    let user = await User.findOne({ _id: userId }).select(
      "skills personalDetails contactDetails email education experience projects portfolio profileImage resume resumes",
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const skillIndex = user.skills.findIndex(
      (skill) => skill._id.toString() === skillId,
    );

    if (skillIndex === -1) {
      return res.status(404).json({ message: "Skill not found" });
    }

    Object.assign(user.skills[skillIndex], updateData);

    // Recalculate profile completion
    const completion = calculateProfileCompletion(user);
    user.profileCompletion = {
      percentage: completion.percentage,
      completedSections: completion.completedSections,
      lastCalculatedAt: completion.lastCalculatedAt,
    };

    await user.save();

    res.json({
      message: "Skill updated successfully",
      skill: user.skills[skillIndex],
      profileCompletion: user.profileCompletion,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to update skill", error: err.message });
  }
};

// Delete skill
const deleteSkill = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { skillId } = req.params;

    let user = await User.findById(userId).select(
      "skills personalDetails contactDetails email education experience projects portfolio profileImage resume resumes",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const skillIndex = user.skills.findIndex(
      (skill) => skill._id.toString() === skillId,
    );

    if (skillIndex === -1) {
      return res.status(404).json({ message: "Skill not found" });
    }

    user.skills.splice(skillIndex, 1);

    // Recalculate profile completion
    const completion = calculateProfileCompletion(user);
    user.profileCompletion = {
      percentage: completion.percentage,
      completedSections: completion.completedSections,
      lastCalculatedAt: completion.lastCalculatedAt,
    };

    await user.save();

    res.json({
      message: "Skill deleted successfully",
      profileCompletion: user.profileCompletion,
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to delete skill", error: err.message });
  }
};

// ==================== Profile Completion ====================

const getProfileCompletion = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select(
      "personalDetails contactDetails education experience projects skills portfolio profileImage resume resumes profileCompletion",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const completion = calculateProfileCompletion(user);

    res.json({
      profileCompletion: {
        percentage: completion.percentage,
        completedSections: completion.completedSections,
        totalSections: 9,
        remainingSections: 9 - completion.completedSections.length,
        lastCalculatedAt: completion.lastCalculatedAt,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch profile completion",
      error: err.message,
    });
  }
};

export {
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
};
