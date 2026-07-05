import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import mongoose from "mongoose";
import { z } from "zod";
import "dotenv/config";

// -----------------------------------------------------------------
// IMPORTANT: point this at your real model file in your Express app,
// e.g. "../models/User.js" relative to wherever you place this file.
// -----------------------------------------------------------------
import User from "./models/User.js";
import connectDB from "../config/db.js";

// Sections that live as arrays of subdocuments inside the User doc
const ARRAY_SECTIONS = [
  "education",
  "experience",
  "projects",
  "skills",
  "resumes",
];
const sectionEnum = z.enum(ARRAY_SECTIONS);

// -----------------------------------------------------------------
// 1. DB connection (reuse your existing MONGO_URI)
// -----------------------------------------------------------------
connectDB();

// -----------------------------------------------------------------
// 2. Helpers
// -----------------------------------------------------------------
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
// 3. MCP server + tools (current API: McpServer + registerTool)
// -----------------------------------------------------------------
const server = new McpServer({ name: "profile-manager-mcp", version: "1.0.0" });

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
      "Add a new item to one of: education, experience, projects, skills, resumes. Provide the fields matching that section's schema.",
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
      itemId: z.string().describe("The subdocument's _id"),
      data: z.record(z.any()).describe("Fields to update on that item"),
    },
  },
  async ({ userId, section, itemId, data }) => {
    try {
      const user = await User.findById(userId);
      if (!user) return errorResult(new Error("User not found"));

      const item = user[section].id(itemId);
      if (!item) return errorResult(new Error(`Item not found in ${section}`));

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
      if (!item) return errorResult(new Error(`Item not found in ${section}`));

      item.deleteOne();
      await user.save();

      return textResult({ message: `Deleted item from ${section}` });
    } catch (err) {
      return errorResult(err);
    }
  },
);

// -----------------------------------------------------------------
// 4. Start over stdio
// -----------------------------------------------------------------
async function main() {
  await connectDB();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[profile-manager-mcp] MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
