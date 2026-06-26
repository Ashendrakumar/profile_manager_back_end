import User from "../models/User.js";
import config from "../config/config.js";
import mapUserToPortfolio from "../mappers/portfolio.mapper.js";

const { portfolioUrl } = config;

const getUserPortfolioDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const portfolioData = mapUserToPortfolio(user);
    res.json(portfolioData);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch user", error: err.message });
  }
};

const calculateProfileCompletion = (user) => {
  if (!user) return 0;

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

  let totalPercentage = 0;

  if (
    user.personalDetails?.firstName &&
    user.personalDetails?.lastName &&
    user.personalDetails?.jobRole
  ) {
    totalPercentage += weights.personalDetails;
  }

  if (
    user.email &&
    user.contactDetails?.phones?.length > 0 &&
    user.contactDetails?.addresses?.length > 0
  ) {
    totalPercentage += weights.contactDetails;
  }

  if (user.education && user.education.length > 0) {
    totalPercentage += weights.education;
  }

  if (user.experience && user.experience.length > 0) {
    totalPercentage += weights.experience;
  }

  if (user.projects && user.projects.length > 0) {
    totalPercentage += weights.projects;
  }

  if (user.skills && user.skills.length > 0) {
    totalPercentage += weights.skills;
  }

  if (user.profileImage && user.profileImage.trim()) {
    totalPercentage += weights.profileImage;
  }

  if (user.resumes?.length > 0 || (user.resume && user.resume.trim())) {
    totalPercentage += weights.resume;
  }

  return totalPercentage;
};

const generatePortfolioLink = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select(
      "portfolio username personalDetails contactDetails email education experience projects skills profileImage resume resumes"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.portfolio?.isGenerated) {
      return res.status(400).json({
        message: "Your portfolio link is already generated",
        data: {
          link: user.portfolio.link,
          isGenerated: user.portfolio.isGenerated,
        },
      });
    }

    const completionPercentage = calculateProfileCompletion(user);

    if (completionPercentage < 60) {
      return res.status(400).json({
        message: `Your profile must be at least 60% complete to generate a portfolio. Currently at ${completionPercentage}%`,
        data: {
          completionPercentage,
          requiredPercentage: 60,
          isGenerated: false,
        },
      });
    }

    const portfolio_id = `${user.username}-${user._id}`;
    const link = `${portfolioUrl}/${portfolio_id}`;

    await User.findOneAndUpdate(
      { _id: userId, "portfolio.isGenerated": { $ne: true } },
      {
        $set: {
          "portfolio.link": link,
          "portfolio.isGenerated": true,
        },
      },
    );

    res.json({
      message: "Portfolio link generated successfully",
      data: { link, isGenerated: true, completionPercentage },
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to generate portfolio link",
      error: err.message,
    });
  }
};

export { getUserPortfolioDetails, generatePortfolioLink };
