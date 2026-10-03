import mongoose from "mongoose";
import Folder from "../models/Folder.js";
import Document from "../models/Document.js";
import * as storage from "../services/storageService.js";

const DOCUMENTS_FOLDER = "documents"; // storage folder for uploaded blobs

// ==================== Helper Functions ====================

const isValidId = (id) => mongoose.isValidObjectId(id);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const formatDocument = (doc) => ({
  _id: doc._id,
  displayName: doc.displayName,
  fileName: doc.fileName,
  fileType: doc.fileType,
  fileSize: doc.fileSize,
  filePath: doc.filePath,
  fileUrl: storage.resolveUrl(doc.filePath),
  folderId: doc.folder,
  uploadedAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const formatFolder = (folder, documents = []) => ({
  _id: folder._id,
  name: folder.name,
  description: folder.description || "",
  parentFolderId: folder.parentFolder || null,
  createdAt: folder.createdAt,
  updatedAt: folder.updatedAt,
  documents: documents.map(formatDocument),
});

// Collect a folder's id plus the ids of every folder nested beneath it.
const collectFolderTreeIds = async (userId, rootFolderId) => {
  const folders = await Folder.find({ user: userId }).select("parentFolder");
  const childrenByParent = new Map();
  for (const folder of folders) {
    const parentKey = folder.parentFolder?.toString() || "root";
    const children = childrenByParent.get(parentKey) || [];
    children.push(folder._id.toString());
    childrenByParent.set(parentKey, children);
  }

  const ids = [];
  const queue = [rootFolderId.toString()];
  while (queue.length > 0) {
    const id = queue.shift();
    ids.push(id);
    queue.push(...(childrenByParent.get(id) || []));
  }
  return ids;
};

// Folder names must be unique (case-insensitive) among siblings.
const hasSiblingWithName = (userId, parentFolder, name, excludeId = null) =>
  Folder.exists({
    user: userId,
    parentFolder: parentFolder || null,
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
    ...(excludeId && { _id: { $ne: excludeId } }),
  });

// Validate an optional parent folder id from the request body. Returns
// { parentFolder } on success or { error, status } on failure.
const resolveParentFolder = async (userId, parentFolderId) => {
  if (!parentFolderId) return { parentFolder: null };
  if (!isValidId(parentFolderId)) {
    return { error: "Invalid parent folder id", status: 400 };
  }
  const parent = await Folder.exists({ _id: parentFolderId, user: userId });
  if (!parent) return { error: "Parent folder not found", status: 404 };
  return { parentFolder: parentFolderId };
};

// ==================== Folders ====================

// Get all folders, each with its documents (newest first)
const getFolders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [folders, documents] = await Promise.all([
      Folder.find({ user: userId }).sort({ createdAt: -1 }),
      Document.find({ user: userId }).sort({ createdAt: -1 }),
    ]);

    const documentsByFolder = new Map();
    for (const doc of documents) {
      const key = doc.folder.toString();
      const list = documentsByFolder.get(key) || [];
      list.push(doc);
      documentsByFolder.set(key, list);
    }

    res.json({
      folders: folders.map((folder) =>
        formatFolder(folder, documentsByFolder.get(folder._id.toString())),
      ),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch folders", error: err.message });
  }
};

// Create folder
const createFolder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const name = req.body.name?.trim();
    const description = req.body.description?.trim() || "";

    if (!name) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const { parentFolder, error, status } = await resolveParentFolder(
      userId,
      req.body.parentFolderId,
    );
    if (error) return res.status(status).json({ message: error });

    if (await hasSiblingWithName(userId, parentFolder, name)) {
      return res
        .status(409)
        .json({ message: "A folder with this name already exists here" });
    }

    const folder = await Folder.create({
      user: userId,
      name,
      description,
      parentFolder,
    });

    res.status(201).json({
      message: "Folder created successfully",
      folder: formatFolder(folder),
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to create folder", error: err.message });
  }
};

// Update folder (rename, edit description, or move under another parent)
const updateFolder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { folderId } = req.params;

    if (!isValidId(folderId)) {
      return res.status(400).json({ message: "Invalid folder id" });
    }

    const folder = await Folder.findOne({ _id: folderId, user: userId });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (req.body.name !== undefined) {
      const name = req.body.name.trim();
      if (!name) {
        return res.status(400).json({ message: "Folder name is required" });
      }
      folder.name = name;
    }
    if (req.body.description !== undefined) {
      folder.description = req.body.description.trim();
    }

    if (req.body.parentFolderId !== undefined) {
      const { parentFolder, error, status } = await resolveParentFolder(
        userId,
        req.body.parentFolderId,
      );
      if (error) return res.status(status).json({ message: error });

      // A folder can't be moved into itself or any of its own subfolders.
      if (parentFolder) {
        const treeIds = await collectFolderTreeIds(userId, folder._id);
        if (treeIds.includes(parentFolder.toString())) {
          return res.status(400).json({
            message: "A folder cannot be moved into itself or its subfolder",
          });
        }
      }
      folder.parentFolder = parentFolder;
    }

    if (
      await hasSiblingWithName(
        userId,
        folder.parentFolder,
        folder.name,
        folder._id,
      )
    ) {
      return res
        .status(409)
        .json({ message: "A folder with this name already exists here" });
    }

    await folder.save();

    const documents = await Document.find({
      user: userId,
      folder: folder._id,
    }).sort({ createdAt: -1 });

    res.json({
      message: "Folder updated successfully",
      folder: formatFolder(folder, documents),
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to update folder", error: err.message });
  }
};

// Delete folder along with all its subfolders and their documents
const deleteFolder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { folderId } = req.params;

    if (!isValidId(folderId)) {
      return res.status(400).json({ message: "Invalid folder id" });
    }

    const folder = await Folder.exists({ _id: folderId, user: userId });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const folderIds = await collectFolderTreeIds(userId, folderId);
    const documents = await Document.find({
      user: userId,
      folder: { $in: folderIds },
    }).select("filePath");

    await Document.deleteMany({ user: userId, folder: { $in: folderIds } });
    await Folder.deleteMany({ user: userId, _id: { $in: folderIds } });
    await Promise.all(documents.map((doc) => storage.remove(doc.filePath)));

    res.json({
      message: "Folder deleted successfully",
      deletedFolders: folderIds.length,
      deletedDocuments: documents.length,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete folder", error: err.message });
  }
};

// ==================== Documents ====================

// List documents, optionally filtered by ?folderId= and ?search=
const getDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { folderId, search } = req.query;

    const filter = { user: userId };
    if (folderId) {
      if (!isValidId(folderId)) {
        return res.status(400).json({ message: "Invalid folder id" });
      }
      filter.folder = folderId;
    }
    if (search?.trim()) {
      const pattern = { $regex: escapeRegex(search.trim()), $options: "i" };
      filter.$or = [{ displayName: pattern }, { fileName: pattern }];
    }

    const documents = await Document.find(filter).sort({ createdAt: -1 });
    res.json({ documents: documents.map(formatDocument) });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch documents", error: err.message });
  }
};

// Get a single document
const getDocumentById = async (req, res) => {
  try {
    const { documentId } = req.params;
    if (!isValidId(documentId)) {
      return res.status(400).json({ message: "Invalid document id" });
    }

    const document = await Document.findOne({
      _id: documentId,
      user: req.user.userId,
    });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({ document: formatDocument(document) });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch document", error: err.message });
  }
};

// Upload a document (multipart: file, displayName, folderId)
const uploadDocument = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { folderId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }
    if (!folderId || !isValidId(folderId)) {
      return res.status(400).json({ message: "A valid folderId is required" });
    }

    const folder = await Folder.exists({ _id: folderId, user: userId });
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const displayName =
      req.body.displayName?.trim() || req.file.originalname;

    const { storedValue } = await storage.save({
      buffer: req.file.buffer,
      folder: DOCUMENTS_FOLDER,
      originalName: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const document = await Document.create({
      user: userId,
      folder: folderId,
      displayName,
      fileName: req.file.originalname,
      fileType: req.file.mimetype || "application/octet-stream",
      fileSize: req.file.size,
      filePath: storedValue,
    });

    res.status(201).json({
      message: "Document uploaded successfully",
      document: formatDocument(document),
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to upload document", error: err.message });
  }
};

// Update a document: rename, move to another folder, and/or replace the file
const updateDocument = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { documentId } = req.params;

    if (!isValidId(documentId)) {
      return res.status(400).json({ message: "Invalid document id" });
    }

    const document = await Document.findOne({ _id: documentId, user: userId });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (req.body.displayName !== undefined) {
      const displayName = req.body.displayName.trim();
      if (!displayName) {
        return res.status(400).json({ message: "Display name is required" });
      }
      document.displayName = displayName;
    }

    if (req.body.folderId) {
      if (!isValidId(req.body.folderId)) {
        return res.status(400).json({ message: "Invalid folder id" });
      }
      const folder = await Folder.exists({
        _id: req.body.folderId,
        user: userId,
      });
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
      document.folder = req.body.folderId;
    }

    let replacedPath = null;
    if (req.file) {
      const { storedValue } = await storage.save({
        buffer: req.file.buffer,
        folder: DOCUMENTS_FOLDER,
        originalName: req.file.originalname,
        contentType: req.file.mimetype,
      });
      replacedPath = document.filePath;
      document.filePath = storedValue;
      document.fileName = req.file.originalname;
      document.fileType = req.file.mimetype || "application/octet-stream";
      document.fileSize = req.file.size;
    }

    await document.save();

    // Remove the old blob only after the new one is safely recorded.
    if (replacedPath) await storage.remove(replacedPath);

    res.json({
      message: "Document updated successfully",
      document: formatDocument(document),
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to update document", error: err.message });
  }
};

// Delete a document and its stored file
const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    if (!isValidId(documentId)) {
      return res.status(400).json({ message: "Invalid document id" });
    }

    const document = await Document.findOneAndDelete({
      _id: documentId,
      user: req.user.userId,
    });
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    await storage.remove(document.filePath);

    res.json({ message: "Document deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete document", error: err.message });
  }
};

export {
  // Folders
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  // Documents
  getDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  deleteDocument,
};
