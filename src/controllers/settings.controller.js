import User from "../models/User.js";
import Setting, { SETTING_SECTIONS } from "../models/Setting.js";
import Folder from "../models/Folder.js";
import Document from "../models/Document.js";
import * as storage from "../services/storageService.js";

const MIN_PASSWORD_LENGTH = 6;

// Fetch the user's settings, creating a defaults document on first access.
const findOrCreateSettings = (userId) =>
  Setting.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

const formatSettings = (settings) => ({
  preferences: settings.preferences,
  notifications: settings.notifications,
  privacy: settings.privacy,
  updatedAt: settings.updatedAt,
});

/**
 * Turn a nested body like { privacy: { showEmail: false } } into a dotted
 * $set ({ "privacy.showEmail": false }), keeping only whitelisted fields.
 * Returns the list of rejected keys so the client gets a clear error.
 */
const buildSettingsUpdate = (body = {}) => {
  const update = {};
  const unknown = [];

  for (const [section, values] of Object.entries(body)) {
    const allowedFields = SETTING_SECTIONS[section];
    if (!allowedFields || typeof values !== "object" || values === null) {
      unknown.push(section);
      continue;
    }
    for (const [field, value] of Object.entries(values)) {
      if (!allowedFields.includes(field)) {
        unknown.push(`${section}.${field}`);
        continue;
      }
      update[`${section}.${field}`] = value;
    }
  }

  return { update, unknown };
};

// ==================== Settings ====================

// Get current user's settings
const getSettings = async (req, res) => {
  try {
    const settings = await findOrCreateSettings(req.user.userId);
    res.json({ settings: formatSettings(settings) });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch settings", error: err.message });
  }
};

// Update any subset of preferences / notifications / privacy
const updateSettings = async (req, res) => {
  try {
    const { update, unknown } = buildSettingsUpdate(req.body);

    if (unknown.length > 0) {
      return res
        .status(400)
        .json({ message: `Unknown settings: ${unknown.join(", ")}` });
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No settings provided" });
    }

    const settings = await Setting.findOneAndUpdate(
      { user: req.user.userId },
      { $set: update, $setOnInsert: { user: req.user.userId } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );

    res.json({
      message: "Settings updated successfully",
      settings: formatSettings(settings),
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to update settings", error: err.message });
  }
};

// Reset all settings (or one section via ?section=privacy) to defaults
const resetSettings = async (req, res) => {
  try {
    const { section } = req.query;
    if (section && !SETTING_SECTIONS[section]) {
      return res.status(400).json({ message: `Unknown section: ${section}` });
    }

    const settings = await findOrCreateSettings(req.user.userId);
    const sections = section ? [section] : Object.keys(SETTING_SECTIONS);
    for (const name of sections) {
      settings[name] = {}; // sub-schema defaults fill in on assignment
    }
    await settings.save();

    res.json({
      message: "Settings reset to defaults",
      settings: formatSettings(settings),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to reset settings", error: err.message });
  }
};

// ==================== Account ====================

// Change password. Users who signed up with Google have no password yet and
// may set one without supplying currentPassword.
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }
    if (confirmPassword !== undefined && confirmPassword !== newPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.password) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ message: "Current password is required" });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }
      if (await user.comparePassword(newPassword)) {
        return res.status(400).json({
          message: "New password must be different from the current password",
        });
      }
    }

    user.password = newPassword; // hashed by the User pre-save hook
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to change password", error: err.message });
  }
};

// Permanently delete the current user's account and everything they own.
// Password users confirm with their password; Google-only users confirm by
// sending { confirmText: "DELETE" }.
const deleteAccount = async (req, res) => {
  try {
    const { password, confirmText } = req.body || {};
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.password) {
      if (!password || !(await user.comparePassword(password))) {
        return res.status(400).json({ message: "Password is incorrect" });
      }
    } else if (confirmText !== "DELETE") {
      return res
        .status(400)
        .json({ message: 'Type "DELETE" to confirm account deletion' });
    }

    const documents = await Document.find({ user: user._id }).select(
      "filePath",
    );
    const blobs = [
      ...documents.map((doc) => doc.filePath),
      ...(user.resumes || []).map((resume) => resume.filePath),
      user.resume,
      user.profileImage,
    ].filter(Boolean);

    await Promise.all([
      Document.deleteMany({ user: user._id }),
      Folder.deleteMany({ user: user._id }),
      Setting.deleteOne({ user: user._id }),
    ]);
    await User.deleteOne({ _id: user._id });

    // Best-effort blob cleanup after the data is gone.
    await Promise.all(blobs.map((blob) => storage.remove(blob)));

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete account", error: err.message });
  }
};

export {
  getSettings,
  updateSettings,
  resetSettings,
  changePassword,
  deleteAccount,
  findOrCreateSettings,
};
