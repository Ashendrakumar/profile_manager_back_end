import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import "dotenv/config";

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

  server.registerTool(
    "get_profile",
    {
      title: "Get Profile",
      description:
        "Get a user's full profile (personal details, contact, education, experience, projects, skills, resumes). Password is never returned.",
      inputSchema: { userId: z.string().describe("The user's _id") },
    },
    async ({ userId }) => {
      try {
        const user = await User.findById(userId).select("-password -otp");
        if (!user) return errorResult(new Error("User not found"));
        return textResult(user);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.registerTool(
    "update_personal_details",
    {
      title: "Update Personal Details",
      description:
        "Update personalDetails fields (firstName, lastName, profileName, profileDescription, jobRole) for a user",
      inputSchema: {
        userId: z.string(),
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
    async ({ userId, data }) => {
      try {
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

  server.registerTool(
    "update_contact_details",
    {
      title: "Update Contact Details",
      description:
        "Update contactDetails (phones, addresses, socialLinks) for a user. Max 2 phones and 2 addresses.",
      inputSchema: {
        userId: z.string(),
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
    async ({ userId, data }) => {
      try {
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

  server.registerTool(
    "add_section_item",
    {
      title: "Add Section Item",
      description:
        "Add a new item to one of: education, experience, projects, skills, resumes.",
      inputSchema: {
        userId: z.string(),
        section: sectionEnum,
        data: z.record(z.any()).describe("Fields for the new item"),
      },
    },
    async ({ userId, section, data }) => {
      try {
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

  server.registerTool(
    "update_section_item",
    {
      title: "Update Section Item",
      description:
        "Update an existing item (by its subdocument _id) within one of: education, experience, projects, skills, resumes.",
      inputSchema: {
        userId: z.string(),
        section: sectionEnum,
        itemId: z.string(),
        data: z.record(z.any()),
      },
    },
    async ({ userId, section, itemId, data }) => {
      try {
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

  server.registerTool(
    "delete_section_item",
    {
      title: "Delete Section Item",
      description:
        "Delete an item (by its subdocument _id) from one of: education, experience, projects, skills, resumes.",
      inputSchema: {
        userId: z.string(),
        section: sectionEnum,
        itemId: z.string(),
      },
    },
    async ({ userId, section, itemId }) => {
      try {
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

  // Stateless mode: a fresh McpServer + transport per request.
  // Simplest option for hosting on Render — no session storage needed,
  // and survives instance restarts/free-tier spin-downs cleanly.
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

  // Streamable HTTP clients may probe with GET/DELETE for session
  // management — not needed in stateless mode, so respond 405.
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
