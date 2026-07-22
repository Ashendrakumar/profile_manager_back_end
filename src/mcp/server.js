import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import "dotenv/config";
import { jwtService } from "../services/jwtService.js";
import User  from "../models/User.js";

// -----------------------------------------------------------------
// Point this at your real model file, e.g. "../models/User.js"
// -----------------------------------------------------------------

// ===================================================================
// PER-SECTION SCHEMAS
// These mirror the Mongoose sub-schemas field-for-field, including
// which fields are required vs optional in User.js.
// ===================================================================

// --- Education (standard, institution, passingYear are required) ---
const EducationInput = z.object({
  standard: z.string().describe("e.g. Bachelor's Degree, Class 12 (required)"),
  institution: z.string().describe("required"),
  university: z.string().optional(),
  passingYear: z.number().describe("required"),
  grade: z.string().optional(),
  specialization: z.string().optional(),
});

// --- Experience (companyName, role, startDate are required) ---
const ExperienceProjectRef = z.object({
  projectId: z.string().describe("ObjectId of a project already in `projects` (required)"),
  title: z.string().describe("required"),
});

const ExperienceInput = z.object({
  companyName: z.string().describe("required"),
  role: z.string().describe("required"),
  roleDescription: z.string().optional(),
  startDate: z.coerce.date().describe("required, e.g. 2023-06-01"),
  endDate: z.coerce.date().optional(),
  isCurrentlyWorking: z.boolean().optional().default(false),
  responsibilities: z.array(z.string()).optional(),
  technologiesUsed: z.array(z.string()).optional(),
  projects: z.array(ExperienceProjectRef).optional(),
});

// --- Project (title, description required; company required IF projectType is Professional) ---
// NOTE: there is no startDate/endDate on Project in the Mongoose model.
// Project timelines live only on the linked Experience entry.
const ProjectInputBase = z.object({
  title: z.string().describe("required"),
  description: z.string().describe("required"),
  projectType: z.enum(["Personal", "Professional"]).optional().default("Personal"),
  company: z
    .string()
    .trim()
    .optional()
    .describe("required only when projectType is 'Professional'"),
  technologies: z.array(z.string()).optional(),
  projectUrl: z.string().optional(),
  githubRepo: z.string().optional(),
});

const ProjectInput = ProjectInputBase.refine(
  (data) => data.projectType !== "Professional" || !!data.company,
  {
    message: "`company` is required when projectType is 'Professional'",
    path: ["company"],
  },
);

// --- Skill (name, category, level are required) ---
const SkillInput = z.object({
  name: z.string().describe("required"),
  category: z.string().describe("required"),
  level: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
    .describe("required"),
  yearsOfExperience: z.number().min(0).optional(),
});

// --- Resume (fileName, filePath are required) ---
const ResumeInput = z.object({
  fileName: z.string().describe("required"),
  filePath: z.string().describe("required"),
  isPrimary: z.boolean().optional().default(false),
});

// --- Certification (name, issuingOrganization, issueDate are required) ---
const CertificationInput = z.object({
  name: z.string().describe("required"),
  issuingOrganization: z.string().describe("required"),
  issueDate: z.coerce.date().describe("required"),
  expirationDate: z.coerce.date().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().optional(),
});

const SECTION_SCHEMAS = {
  education: EducationInput,
  experience: ExperienceInput,
  projects: ProjectInput,
  skills: SkillInput,
  resumes: ResumeInput,
  certifications: CertificationInput,
};

const ARRAY_SECTIONS = Object.keys(SECTION_SCHEMAS);
const sectionEnum = z.enum(ARRAY_SECTIONS);

function textResult(obj) {
  return {
    content: [
      {
        type: "text",
        text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 2),
      },
    ],
  };
}
function errorResult(err) {
  return {
    content: [{ type: "text", text: `Error: ${err.message}` }],
    isError: true,
  };
}

// Turns a ZodError into a compact, readable message for the MCP client.
function zodErrorResult(zodErr) {
  const details = zodErr.errors
    .map((e) => `${e.path.join(".") || "(root)"}: ${e.message}`)
    .join("; ");
  return errorResult(new Error(`Validation failed — ${details}`));
}

// -----------------------------------------------------------------
// Build a fresh McpServer instance with all tools registered.
// (Created per-request in stateless mode — see notes below.)
// -----------------------------------------------------------------
function buildMcpServer() {
  const server = new McpServer({
    name: "profile-manager-mcp",
    version: "1.0.0",
  });

  // ---------------------------------------------------------------
  // LOGIN — the only tool that doesn't require an authToken.
  // ---------------------------------------------------------------
  server.registerTool(
    "login",
    {
      title: "Login",
      description:
        "Log in with email and password to receive an authToken. Call this FIRST — every other tool requires the authToken this returns.",
      inputSchema: {
        email: z.string().email(),
        password: z.string(),
      },
    },
    async ({ email, password }) => {
      try {
        const user = await User.findOne({ email });
        if (!user) return errorResult(new Error("Invalid email or password"));

        const isMatch = await user.comparePassword(password);
        if (!isMatch)
          return errorResult(new Error("Invalid email or password"));

        const authToken = jwtService.sign({
          userId: user._id.toString(),
          role: user.role,
        });

        return textResult({
          message:
            "Login successful. Use this authToken in every subsequent tool call.",
          authToken,
          expiresIn: jwtService.expiresIn,
          userId: user._id.toString(),
        });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // ---------------------------------------------------------------
  // GET PROFILE
  // ---------------------------------------------------------------
  server.registerTool(
    "get_profile",
    {
      title: "Get Profile",
      description:
        "Get your full profile (personal details, contact, education, experience, projects, skills, resumes). Requires authToken from 'login'. Password is never returned.",
      inputSchema: {
        authToken: z.string().describe("Token returned by the 'login' tool"),
      },
    },
    async ({ authToken }) => {
      try {
        const { userId } = jwtService.requireAuth(authToken);
        const user = await User.findById(userId).select("-password -otp");
        if (!user) return errorResult(new Error("User not found"));
        return textResult(user);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // ---------------------------------------------------------------
  // UPDATE PERSONAL DETAILS
  // ---------------------------------------------------------------
  server.registerTool(
    "update_personal_details",
    {
      title: "Update Personal Details",
      description:
        "Update personalDetails fields (firstName, lastName, profileName, profileDescription, jobRole). All optional — only send fields you want to change. Requires authToken from 'login'.",
      inputSchema: {
        authToken: z.string(),
        data: z
          .object({
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            profileName: z.string().optional(),
            profileDescription: z.string().max(160).optional(),
            jobRole: z.string().optional(),
          })
          .describe("Fields to update"),
      },
    },
    async ({ authToken, data }) => {
      try {
        const { userId } = jwtService.requireAuth(authToken);
        const user = await User.findByIdAndUpdate(
          userId,
          { $set: { personalDetails: data } },
          { new: true, runValidators: true },
        ).select("-password -otp");
        if (!user) return errorResult(new Error("User not found"));
        return textResult(user.personalDetails);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // ---------------------------------------------------------------
  // UPDATE CONTACT DETAILS
  // ---------------------------------------------------------------
  server.registerTool(
    "update_contact_details",
    {
      title: "Update Contact Details",
      description:
        "Update contactDetails (phones, addresses, socialLinks). Max 2 phones and 2 addresses. Requires authToken from 'login'.",
      inputSchema: {
        authToken: z.string(),
        data: z
          .object({
            phones: z
              .array(
                z.object({
                  number: z.string(),
                  type: z.enum(["mobile", "home", "work"]).optional(),
                }),
              )
              .max(2)
              .optional(),
            addresses: z
              .array(
                z.object({
                  street: z.string(),
                  city: z.string(),
                  state: z.string().optional(),
                  zipCode: z.string().optional(),
                  country: z.string(),
                  type: z.enum(["home", "work"]).optional(),
                }),
              )
              .max(2)
              .optional(),
            socialLinks: z
              .array(
                z.object({
                  platform: z.enum([
                    "linkedin",
                    "github",
                    "twitter",
                    "portfolio",
                  ]),
                  url: z.string(),
                }),
              )
              .optional(),
          })
          .describe(
            "e.g. { phones: [...], addresses: [...], socialLinks: [...] }",
          ),
      },
    },
    async ({ authToken, data }) => {
      try {
        const { userId } = jwtService.requireAuth(authToken);
        const user = await User.findByIdAndUpdate(
          userId,
          { $set: { contactDetails: data } },
          { new: true, runValidators: true },
        ).select("-password -otp");
        if (!user) return errorResult(new Error("User not found"));
        return textResult(user.contactDetails);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // ---------------------------------------------------------------
  // ADD SECTION ITEM
  // ---------------------------------------------------------------
  server.registerTool(
    "add_section_item",
    {
      title: "Add Section Item",
      description:
        "Add a new item to one of: education, experience, projects, skills, resumes, certifications. " +
        "Each section is validated against its schema before saving:\n" +
        "- education: standard, institution, passingYear required\n" +
        "- experience: companyName, role, startDate required\n" +
        "- projects: title, description required; company required if projectType='Professional' (no date fields exist on projects — dates live on the linked experience)\n" +
        "- skills: name, category, level required\n" +
        "- resumes: fileName, filePath required\n" +
        "- certifications: name, issuingOrganization, issueDate required\n" +
        "Requires authToken from 'login'.",
      inputSchema: {
        authToken: z.string(),
        section: sectionEnum,
        data: z.record(z.any()).describe("Fields for the new item"),
      },
    },
    async ({ authToken, section, data }) => {
      try {
        const { userId } = jwtService.requireAuth(authToken);

        // Validate against the section's schema before touching the DB
        const schema = SECTION_SCHEMAS[section];
        const parsed = schema.safeParse(data);
        if (!parsed.success) return zodErrorResult(parsed.error);

        const user = await User.findById(userId);
        if (!user) return errorResult(new Error("User not found"));

        user[section].push(parsed.data);
        await user.save();

        const added = user[section][user[section].length - 1];
        return textResult({ message: `Added to ${section}`, item: added });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // ---------------------------------------------------------------
  // UPDATE SECTION ITEM
  // ---------------------------------------------------------------
  server.registerTool(
    "update_section_item",
    {
      title: "Update Section Item",
      description:
        "Update an existing item (by its subdocument _id) within one of: education, experience, projects, skills, resumes, certifications. " +
        "Only send the fields you want to change — partial updates are validated against the same schema as add_section_item, but all fields become optional. " +
        "Requires authToken from 'login'.",
      inputSchema: {
        authToken: z.string(),
        section: sectionEnum,
        itemId: z.string().describe("The subdocument's _id"),
        data: z.record(z.any()).describe("Fields to update on that item"),
      },
    },
    async ({ authToken, section, itemId, data }) => {
      try {
        const { userId } = jwtService.requireAuth(authToken);

        // Partial validation: same field types/enums, but nothing required
        // (the item already exists, so we only check the fields being changed).
        const baseSchema =
          section === "projects" ? ProjectInputBase : SECTION_SCHEMAS[section];
        const partialSchema = baseSchema.partial();
        const parsed = partialSchema.safeParse(data);
        if (!parsed.success) return zodErrorResult(parsed.error);

        const user = await User.findById(userId);
        if (!user) return errorResult(new Error("User not found"));

        const item = user[section].id(itemId);
        if (!item)
          return errorResult(new Error(`Item not found in ${section}`));

        // Extra cross-field check for projects: if the resulting projectType
        // will be 'Professional', a company must exist (either already on
        // the item or supplied in this update).
        if (section === "projects") {
          const resultingType = parsed.data.projectType ?? item.projectType;
          const resultingCompany = parsed.data.company ?? item.company;
          if (resultingType === "Professional" && !resultingCompany) {
            return errorResult(
              new Error(
                "`company` is required when projectType is 'Professional'",
              ),
            );
          }
        }

        Object.assign(item, parsed.data);
        await user.save();

        return textResult({ message: `Updated ${section} item`, item });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  // ---------------------------------------------------------------
  // DELETE SECTION ITEM
  // ---------------------------------------------------------------
  server.registerTool(
    "delete_section_item",
    {
      title: "Delete Section Item",
      description:
        "Delete an item (by its subdocument _id) from one of: education, experience, projects, skills, resumes, certifications. Requires authToken from 'login'.",
      inputSchema: {
        authToken: z.string(),
        section: sectionEnum,
        itemId: z.string(),
      },
    },
    async ({ authToken, section, itemId }) => {
      try {
        const { userId } = jwtService.requireAuth(authToken);
        const user = await User.findById(userId);
        if (!user) return errorResult(new Error("User not found"));

        const item = user[section].id(itemId);
        if (!item)
          return errorResult(new Error(`Item not found in ${section}`));

        item.deleteOne();
        await user.save();

        return textResult({ message: `Deleted item from ${section}` });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  return server;
}

// -----------------------------------------------------------------
// Express router: mount this at /mcp in your existing app
// -----------------------------------------------------------------
export function createMcpRouter() {
  const router = express.Router();
  router.use(express.json());

  router.post("/", async (req, res) => {
    try {
      const server = buildMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless
      });

      res.on("close", () => {
        transport.close();
        server.close();
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("[profile-manager-mcp] Error handling MCP request:", err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  router.get("/", (req, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed (stateless server)" },
      id: null,
    });
  });
  router.delete("/", (req, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed (stateless server)" },
      id: null,
    });
  });

  return router;
}