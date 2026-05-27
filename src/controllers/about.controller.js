import About from "../models/About.js";

const getAbout = async (req, res, next) => {
  try {
    // Get the published About content (public endpoint)
    const about = await About.findOne({ isPublished: true }).populate(
      "createdBy",
      "username email",
    );

    if (!about) {
      return res.status(404).json({ message: "About content not found" });
    }

    res.json(about);
  } catch (err) {
    next(err);
  }
};

const getAboutForAdmin = async (req, res, next) => {
  try {
    // Get About content for admin (regardless of published status)
    const about = await About.findOne().populate("createdBy", "username email");

    if (!about) {
      return res.status(404).json({ message: "About content not found" });
    }

    res.json(about);
  } catch (err) {
    next(err);
  }
};

const createAbout = async (req, res, next) => {
  try {
    // Check if About already exists
    const existingAbout = await About.findOne();
    if (existingAbout) {
      return res.status(400).json({
        message: "About content already exists. Use update instead of create.",
      });
    }

    const { title, description, features, isPublished } = req.body;

    // Validate required fields
    if (!description) {
      return res.status(400).json({ message: "Description is required" });
    }

    const about = new About({
      title: title || "About Our Project",
      description,
      features: features || [],
      createdBy: req.user.userId,
      isPublished: isPublished !== undefined ? isPublished : true,
    });

    await about.save();
    await about.populate("createdBy", "username email");

    res.status(201).json(about);
  } catch (err) {
    next(err);
  }
};

const updateAbout = async (req, res, next) => {
  try {
    const { title, description, features, isPublished } = req.body;

    // Validate required fields
    if (description === "") {
      return res.status(400).json({ message: "Description cannot be empty" });
    }

    const about = await About.findByIdAndUpdate(
      req.params.id,
      {
        ...(title && { title }),
        ...(description && { description }),
        ...(features && { features }),
        ...(isPublished !== undefined && { isPublished }),
      },
      { new: true, runValidators: true },
    ).populate("createdBy", "username email");

    if (!about) {
      return res.status(404).json({ message: "About content not found" });
    }

    res.json(about);
  } catch (err) {
    next(err);
  }
};

const deleteAbout = async (req, res, next) => {
  try {
    const result = await About.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "About content not found" });
    }

    res.json({ message: "About content deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export { getAbout, getAboutForAdmin, createAbout, updateAbout, deleteAbout };
