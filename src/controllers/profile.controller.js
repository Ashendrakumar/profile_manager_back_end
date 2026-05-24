import User from "../models/User.js";

// ==================== Helper Functions ====================

// Get full download URL
const getDownloadUrl = (filePath) => {
  if (!filePath) return null;
  const baseUrl = process.env.BASE_URL || "http://localhost:10000";
  return `${baseUrl}${filePath}`;
};

// ==================== Contact Details ====================

// Get contact details
const getContactDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select(
      "email contactDetails resume profileImage",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const personContact = {
      email: user.email,
      resume: user.resume,
      
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
    if (email !== undefined) updateData["contactDetails.email"] = email;
    if (phones !== undefined) updateData["contactDetails.phones"] = phones;
    if (addresses !== undefined)
      updateData["contactDetails.addresses"] = addresses;
    if (socialLinks !== undefined)
      updateData["contactDetails.socialLinks"] = socialLinks;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("contactDetails");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Contact details updated successfully",
      contactDetails: user.contactDetails,
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

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { education: educationData } },
      { new: true, runValidators: true },
    ).select("education");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newEducation = user.education[user.education.length - 1];
    res.status(201).json({
      message: "Education added successfully",
      education: newEducation,
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

    const user = await User.findOne({ _id: userId });
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
    await user.save();

    res.json({
      message: "Education updated successfully",
      education: user.education[educationIndex],
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

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { education: { _id: educationId } } },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Education deleted successfully" });
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
    // const projectByCompany = new Map();
    // for (const project of user.projects) {
    //   // only consider work projects for experience section
    //   if (project.projectType !== "work") continue;
    //   if (!projectByCompany.has(project.company)) {
    //     projectByCompany.set(project.company, []);
    //   }
    //   projectByCompany.get(project.company).push(project);
    // }

    // const UserExperience = user.experience.map((exp) => {
    //   return {
    //     ...exp.toObject(),
    //     projects: projectByCompany.get(exp.companyName) || [],
    //   };
    // });

    res.json({ experience: user.experience || [] });
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

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { experience: experienceData } },
      { new: true, runValidators: true },
    ).select("experience");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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

    const user = await User.findOne({ _id: userId });
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
    await user.save();

    res.json({
      message: "Experience updated successfully",
      experience: user.experience[experienceIndex],
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

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { experience: { _id: experienceId } } },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Experience deleted successfully" });
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

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { projects: projectData } },
      { new: true, runValidators: true },
    ).select("projects");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newProject = user.projects[user.projects.length - 1];
    res.status(201).json({
      message: "Project added successfully",
      project: newProject,
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

    const user = await User.findOne({ _id: userId });
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
    await user.save();

    res.json({
      message: "Project updated successfully",
      project: user.projects[projectIndex],
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

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { projects: { _id: projectId } } },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Project deleted successfully" });
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

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { skills: skillData } },
      { new: true, runValidators: true },
    ).select("skills");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newSkill = user.skills[user.skills.length - 1];
    res.status(201).json({
      message: "Skill added successfully",
      skill: newSkill,
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

    const user = await User.findOne({ _id: userId });
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
    await user.save();

    res.json({
      message: "Skill updated successfully",
      skill: user.skills[skillIndex],
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

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { skills: { _id: skillId } } },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Skill deleted successfully" });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to delete skill", error: err.message });
  }
};

export {
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
};
