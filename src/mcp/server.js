import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import "dotenv/config";
import { JwtService as jwtService } from "../services/jwtService.js";

// -----------------------------------------------------------------
// Point this at your real model file, e.g. "../models/User.js"
// -----------------------------------------------------------------
import User from "../models/User.js"; // adjust if your models folder is elsewhere

const ARRAY_SECTIONS = [
  "education",
  "experience",
  "projects",
  "skills",
  "resumes",
];
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
        "Update personalDetails fields (firstName, lastName, profileName, profileDescription, jobRole). Requires authToken from 'login'.",
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
            phones: z.array(z.any()).max(2).optional(),
            addresses: z.array(z.any()).max(2).optional(),
            socialLinks: z.array(z.any()).optional(),
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
        "Add a new item to one of: education, experience, projects, skills, resumes, certifications. Requires authToken from 'login'.",
      inputSchema: {
        authToken: z.string(),
        section: sectionEnum,
        data: z.record(z.any()).describe("Fields for the new item"),
      },
    },
    async ({ authToken, section, data }) => {
      try {
        const { userId } = jwtService.requireAuth(authToken);
        const user = await User.findById(userId);
        if (!user) return errorResult(new Error("User not found"));

        user[section].push(data);
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
        "Update an existing item (by its subdocument _id) within one of: education, experience, projects, skills, resumes, certifications. Requires authToken from 'login'.",
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
        const user = await User.findById(userId);
        if (!user) return errorResult(new Error("User not found"));

        const item = user[section].id(itemId);
        if (!item)
          return errorResult(new Error(`Item not found in ${section}`));

        Object.assign(item, data);
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
