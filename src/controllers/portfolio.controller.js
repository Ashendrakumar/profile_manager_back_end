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

const generatePortfolioLink = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select("portfolio username");

    if (user.portfolio?.isGenerated) {
      return res.status(400).json({
        message: "Your portfolio link is already generated",
        data: {
          link: user.portfolio.link,
          isGenerated: user.portfolio.isGenerated,
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
      message: "Portfolio link generated",
      data: { link, isGenerated: true },
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to generate portfolio link",
      error: err.message,
    });
  }
};

export { getUserPortfolioDetails, generatePortfolioLink };
