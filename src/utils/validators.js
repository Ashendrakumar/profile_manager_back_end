import { body, param, query, validationResult } from "express-validator";

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// User validators
const validateRegister = [
  body("username")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),
  body("email")
    .isEmail()
    .withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  handleValidationErrors,
];

const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Invalid email format"),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  handleValidationErrors,
];

const validatePersonalDetails = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("First name cannot be empty"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Last name cannot be empty"),
  body("profileDescription")
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage("Profile description cannot exceed 160 characters"),
  handleValidationErrors,
];

const validateEducation = [
  body("standard")
    .notEmpty()
    .withMessage("Standard/degree is required"),
  body("institution")
    .notEmpty()
    .withMessage("Institution is required"),
  body("passingYear")
    .isInt({ min: 1900, max: new Date().getFullYear() + 5 })
    .withMessage("Invalid passing year"),
  handleValidationErrors,
];

const validateExperience = [
  body("companyName")
    .notEmpty()
    .withMessage("Company name is required"),
  body("role")
    .notEmpty()
    .withMessage("Role is required"),
  body("location")
    .notEmpty()
    .withMessage("Location is required"),
  body("description")
    .notEmpty()
    .withMessage("Description is required"),
  body("startDate")
    .isISO8601()
    .withMessage("Invalid start date"),
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid end date"),
  handleValidationErrors,
];

const validateProject = [
  body("title")
    .notEmpty()
    .withMessage("Project title is required"),
  body("description")
    .notEmpty()
    .withMessage("Description is required"),
  body("projectType")
    .isIn(["personal", "work"])
    .withMessage("Project type must be 'personal' or 'work'"),
  handleValidationErrors,
];

const validateSkill = [
  body("name")
    .notEmpty()
    .withMessage("Skill name is required"),
  body("category")
    .notEmpty()
    .withMessage("Category is required"),
  body("level")
    .isIn(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
    .withMessage("Invalid skill level"),
  handleValidationErrors,
];

const validateContactDetails = [
  body("phones")
    .optional()
    .isArray()
    .withMessage("Phones must be an array"),
  body("addresses")
    .optional()
    .isArray()
    .withMessage("Addresses must be an array"),
  body("socialLinks")
    .optional()
    .isArray()
    .withMessage("Social links must be an array"),
  handleValidationErrors,
];

const validateIdParam = [
  param("id")
    .isMongoId()
    .withMessage("Invalid ID format"),
  handleValidationErrors,
];

export {
  validateRegister,
  validateLogin,
  validatePersonalDetails,
  validateEducation,
  validateExperience,
  validateProject,
  validateSkill,
  validateContactDetails,
  validateIdParam,
};
