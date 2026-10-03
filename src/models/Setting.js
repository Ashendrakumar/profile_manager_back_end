import mongoose from "mongoose";

// One settings document per user. Created lazily with defaults the first time
// a user reads or updates their settings (see settings.controller.js).

const PreferencesSchema = new mongoose.Schema(
  {
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    language: { type: String, default: "en", trim: true },
    timezone: { type: String, default: "UTC", trim: true },
    dateFormat: {
      type: String,
      enum: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
      default: "DD/MM/YYYY",
    },
  },
  { _id: false },
);

const NotificationsSchema = new mongoose.Schema(
  {
    emailNotifications: { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true },
    profileReminders: { type: Boolean, default: true }, // nudge to complete the profile
    certificationExpiry: { type: Boolean, default: true }, // warn before a certificate expires
    productUpdates: { type: Boolean, default: false },
  },
  { _id: false },
);

// Controls what the public portfolio (GET /api/portfolio/:id) exposes.
const PrivacySchema = new mongoose.Schema(
  {
    portfolioVisibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    showEmail: { type: Boolean, default: true },
    showPhone: { type: Boolean, default: true },
    showAddress: { type: Boolean, default: true },
    showResumeDownload: { type: Boolean, default: true },
    showCertifications: { type: Boolean, default: true },
  },
  { _id: false },
);

const SettingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    preferences: { type: PreferencesSchema, default: () => ({}) },
    notifications: { type: NotificationsSchema, default: () => ({}) },
    privacy: { type: PrivacySchema, default: () => ({}) },
  },
  { timestamps: true },
);

// Whitelist of updatable fields per section, derived from the sub-schemas so
// the controller and the schema can never drift apart.
export const SETTING_SECTIONS = {
  preferences: Object.keys(PreferencesSchema.paths),
  notifications: Object.keys(NotificationsSchema.paths),
  privacy: Object.keys(PrivacySchema.paths),
};

export default mongoose.model("Setting", SettingSchema);
