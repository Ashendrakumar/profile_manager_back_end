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
        platform: { type: String, required: true }, // e.g., 'linkedin', 'github', 'twitter'
        url: { type: String, required: true },
      },
    ],
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
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isCurrentlyWorking: { type: Boolean, default: false },
    responsibilities: [{ type: String }],
    technologiesUsed: [{ type: String }],
  },
  { timestamps: true },
);

// Project Schema
const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
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
    link: { type: String, default: null, sparse: true },
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
    contactDetails: { type: ContactDetailsSchema },
    education: [EducationSchema],
    experience: [ExperienceSchema],
    projects: [ProjectSchema],
    skills: [SkillSchema],
    portfolio: {
      type: PortfolioSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

// Pre-save hook to hash passwords
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Optional: helper method for login
UserSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", UserSchema);
