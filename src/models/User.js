import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Contact Details Schema
const ContactDetailsSchema = new mongoose.Schema(
  {
    // email: { type: String, required: true },
    phones: {
      type: [
        {
          number: { type: String, required: true },
          type: {
            type: String,
            enum: ["mobile", "home", "work"],
            default: "mobile",
          },
        },
      ],
      validate: [arrayLimit, "{PATH} exceeds the limit of 2"],
    },
    addresses: {
      type: [
        {
          street: { type: String, required: true },
          city: { type: String, required: true },
          state: { type: String },
          zipCode: { type: String },
          country: { type: String, required: true },
          type: { type: String, enum: ["home", "work"], default: "home" },
        },
      ],
      validate: [arrayLimit, "{PATH} exceeds the limit of 2"],
    },
    socialLinks: [
      {
        platform: {
          type: String,
          enum: ["linkedin", "github", "twitter", "portfolio"],
          default: "linkedin",
          required: true,
        }, // e.g., 'linkedin', 'github', 'twitter', 'portfolio'
        url: { type: String, required: true },
      },
    ],
  },
  { _id: false },
);

// Personal Details Schema
const PersonalDetailsSchema = new mongoose.Schema(
  {
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    profileName: { type: String, default: "" },
    profileDescription: { type: String, default: "", maxlength: 160 },
    jobRole: { type: String, default: "" },
  },
  { _id: false },
);

// Education Schema
const EducationSchema = new mongoose.Schema(
  {
    standard: { type: String, required: true }, // e.g., "Bachelor's Degree", "Class 12"
    institution: { type: String, required: true },
    university: { type: String },
    passingYear: { type: Number, required: true },
    grade: { type: String }, // e.g., "A+", "3.8/4.0"
    specialization: { type: String }, // e.g., "Computer Science"
  },
  { timestamps: true },
);

// Experience Schema
const ExperienceSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    role: { type: String, required: true },
    roleDescription: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isCurrentlyWorking: { type: Boolean, default: false },
    responsibilities: [{ type: String }],
    technologiesUsed: [{ type: String }],
    projects: [
      new mongoose.Schema(
        {
          projectId: { type: mongoose.Schema.Types.ObjectId, required: true },
          title: { type: String, required: true },
        },
        { _id: false },
      ),
    ],
  },
  { timestamps: true },
);

// Project Schema
const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    projectType: {
      type: String,
      enum: ["Personal", "Professional"],
      default: "Personal",
    },
    company: {
      type: String,
      required: function () {
        return this.projectType === "Professional";
      },
      sparse: true,
      trim: true,
    },
    technologies: [{ type: String }],
    projectUrl: { type: String },
    githubRepo: { type: String },
  },
  { timestamps: true },
);

// Skill Schema
const SkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true }, // e.g., "Programming Languages", "Frameworks", "Tools"
    level: {
      type: String,
      enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"],
      required: true,
    },
    yearsOfExperience: { type: Number, min: 0 },
  },
  { timestamps: true },
);

// Portfolio Schema
const PortfolioSchema = new mongoose.Schema(
  {
    link: {
      type: String,
      sparse: true,
      trim: true,
      default: "", // if link is empty then isGenerated should be false
    },
    isGenerated: {
      type: Boolean,
      required: true,
      default: false, // if link is there then isGenerated should be true
    },
  },
  { timestamps: true },
);

// Helper function to limit array length
function arrayLimit(val) {
  return val.length <= 2;
}

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
      required: true,
    },
    // Profile sections
    personalDetails: { type: PersonalDetailsSchema },
    contactDetails: { type: ContactDetailsSchema },
    education: [EducationSchema],
    experience: [ExperienceSchema],
    projects: [ProjectSchema],
    skills: [SkillSchema],
    portfolio: { type: PortfolioSchema },
    profileImage: { type: String, default: "" },
    resume: { type: String, default: "" },
  },
  { timestamps: true },
);

// Pre-save hook to hash passwords and auto-populate personal details
UserSchema.pre("save", async function () {
  // Hash password if modified
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Auto-populate firstName from username if not set
  if (
    !this.personalDetails?.firstName ||
    this.personalDetails.firstName === ""
  ) {
    if (!this.personalDetails) {
      this.personalDetails = {};
    }
    this.personalDetails.firstName = this.username;
  }

  // Auto-populate jobRole from latest experience if experience exists
  if (this.experience && this.experience.length > 0) {
    if (!this.personalDetails) {
      this.personalDetails = {};
    }
    // Get the latest experience (most recent by default, or the last in array)
    const latestExperience = this.experience[this.experience.length - 1];
    this.personalDetails.jobRole = latestExperience.role || "";
  }
});

// Optional: helper method for login
UserSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", UserSchema);
