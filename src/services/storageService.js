import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import config from "../config/config.js";

/**
 * Storage service — a thin abstraction over where uploaded blobs live.
 *
 * Two drivers, chosen by STORAGE_DRIVER:
 *  - "local" (default): writes to src/uploads/<folder> and returns a relative
 *    path (e.g. "/uploads/profiles/x.webp"), served by express.static.
 *  - "r2": uploads to a Cloudflare R2 bucket (S3-compatible) and returns the
 *    absolute public URL (e.g. "https://pub-xxxx.r2.dev/profiles/x.webp").
 *
 * DB fields (profileImage, resume.filePath, …) store whatever `save()` returns.
 * `resolveUrl()` turns that stored value into an absolute URL for API responses,
 * and passes through values that are already absolute (R2 URLs, Google avatars).
 * `remove()` cleans up the underlying blob for whichever driver produced it.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// src/ — local files live under src/uploads and are served from here (app.js).
const SRC_ROOT = path.join(__dirname, "..");

const driver = config.storage.driver === "r2" ? "r2" : "local";

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value);

// Build a collision-resistant filename, preserving the original extension.
const generateFileName = (originalName = "") => {
  const ext = path.extname(originalName).toLowerCase();
  const unique = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
  return `${unique}${ext}`;
};

// ---------------------------------------------------------------------------
// Cloudflare R2 (S3-compatible) — client is created lazily so the local driver
// never needs the credentials, and so a missing @aws-sdk install can't break
// local dev.
// ---------------------------------------------------------------------------
let _r2 = null;
let _s3 = null; // cached module exports { S3Client, PutObjectCommand, ... }

const loadS3 = async () => {
  if (!_s3) {
    _s3 = await import("@aws-sdk/client-s3");
  }
  return _s3;
};

const getR2Client = async () => {
  if (_r2) return _r2;
  const { accountId, accessKeyId, secretAccessKey, endpoint } = config.storage.r2;
  if (!accessKeyId || !secretAccessKey || (!accountId && !endpoint)) {
    throw new Error(
      "Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET and R2_PUBLIC_URL.",
    );
  }
  const { S3Client } = await loadS3();
  _r2 = new S3Client({
    region: "auto",
    endpoint: endpoint || `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _r2;
};

const r2PublicUrl = (key) => {
  const base = config.storage.r2.publicUrl;
  if (!base) {
    throw new Error("R2_PUBLIC_URL is not set — cannot build a public file URL.");
  }
  return `${base}/${key}`;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Persist a file buffer and return the value to store in the DB.
 *
 * @param {object}  opts
 * @param {Buffer}  opts.buffer        raw file bytes (from multer memoryStorage)
 * @param {string}  opts.folder        logical folder, e.g. "profiles" | "portfolios" | "heroes"
 * @param {string}  opts.originalName  original filename (used for the extension)
 * @param {string} [opts.contentType]  MIME type; stored so the blob serves correctly
 * @param {boolean}[opts.download]     force download (Content-Disposition: attachment)
 * @returns {Promise<{storedValue: string, url: string, key: string, fileName: string}>}
 */
export const save = async ({
  buffer,
  folder = "common",
  originalName = "",
  contentType,
  download = false,
}) => {
  if (!buffer) throw new Error("No file buffer provided to storage.save()");

  const fileName = generateFileName(originalName);

  if (driver === "r2") {
    const key = `${folder}/${fileName}`;
    const { PutObjectCommand } = await loadS3();
    const client = await getR2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: config.storage.r2.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType || "application/octet-stream",
        ...(download
          ? {
              ContentDisposition: `attachment; filename="${path.basename(
                originalName || fileName,
              )}"`,
            }
          : {}),
      }),
    );
    const url = r2PublicUrl(key);
    // Store the absolute URL: consumers pass it through unchanged.
    return { storedValue: url, url, key, fileName };
  }

  // local driver
  const dir = path.join(SRC_ROOT, "uploads", folder);
  fs.mkdirSync(dir, { recursive: true });
  await fs.promises.writeFile(path.join(dir, fileName), buffer);
  const storedValue = `/uploads/${folder}/${fileName}`;
  return { storedValue, url: resolveUrl(storedValue), key: storedValue, fileName };
};

/**
 * Turn a stored value into an absolute URL for API responses.
 * Absolute URLs (R2, Google avatars, …) are returned unchanged.
 */
export const resolveUrl = (storedValue) => {
  if (!storedValue) return "";
  if (isAbsoluteUrl(storedValue)) return storedValue;
  const prefix = storedValue.startsWith("/") ? "" : "/";
  return `${config.baseUrl}${prefix}${storedValue}`;
};

/**
 * Best-effort delete of a previously stored blob. Safe to call with any stored
 * value — local paths are unlinked, R2 URLs are deleted from the bucket, and
 * foreign absolute URLs (e.g. Google avatars) are left untouched.
 */
export const remove = async (storedValue) => {
  if (!storedValue) return;
  try {
    if (isAbsoluteUrl(storedValue)) {
      const base = config.storage.r2.publicUrl;
      // Only delete objects that belong to our own R2 public bucket.
      if (base && storedValue.startsWith(`${base}/`)) {
        const key = storedValue.slice(base.length + 1);
        const { DeleteObjectCommand } = await loadS3();
        const client = await getR2Client();
        await client.send(
          new DeleteObjectCommand({
            Bucket: config.storage.r2.bucket,
            Key: key,
          }),
        );
      }
      return; // foreign URL — nothing we own to clean up
    }

    // local path like "/uploads/profiles/x.webp"
    const absolutePath = path.join(SRC_ROOT, storedValue);
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
    }
  } catch {
    // Cleanup is best-effort: never let it block or fail the request.
  }
};

export const storageDriver = driver;

export default { save, resolveUrl, remove, storageDriver: driver };
