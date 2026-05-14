import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";
import multer from "multer";

const currentFile = fileURLToPath(import.meta.url);
const servicesDir = path.dirname(currentFile);
const backendRoot = path.resolve(servicesDir, "../..");
const repoRoot = path.resolve(backendRoot, "..");

export const allowedDocumentTypes = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png"
};

export const maxDocumentUploadBytes = Number(process.env.MAX_DOCUMENT_UPLOAD_BYTES || 10 * 1024 * 1024);

export function getDocumentStorageRoot() {
  const configuredPath = process.env.DOCUMENT_STORAGE_DIR || "backend/storage/documents";
  return path.isAbsolute(configuredPath) ? configuredPath : path.resolve(repoRoot, configuredPath);
}

function getSigningSecret() {
  return process.env.DOCUMENT_SIGNING_SECRET || process.env.JWT_SECRET;
}

export function getDocumentFilePath(storageKey) {
  const storageRoot = getDocumentStorageRoot();
  const filePath = path.resolve(storageRoot, storageKey || "");

  if (!filePath.startsWith(`${storageRoot}${path.sep}`)) {
    throw new Error("Document storage key is invalid.");
  }

  return filePath;
}

const storage = multer.diskStorage({
  destination: async (req, file, done) => {
    try {
      const userDirectory = path.join(getDocumentStorageRoot(), req.user.sub);
      await fs.mkdir(userDirectory, { recursive: true });
      done(null, userDirectory);
    } catch (error) {
      done(error);
    }
  },
  filename: (req, file, done) => {
    const extension = allowedDocumentTypes[file.mimetype];
    const fileName = `${crypto.randomUUID()}${extension}`;
    req.documentStorageKey = `${req.user.sub}/${fileName}`;
    done(null, fileName);
  }
});

export const uploadDocumentFile = multer({
  storage,
  limits: {
    fileSize: maxDocumentUploadBytes,
    files: 1
  },
  fileFilter: (req, file, done) => {
    if (!allowedDocumentTypes[file.mimetype]) {
      return done(new Error("Only PDF, JPG, and PNG files can be uploaded."));
    }

    return done(null, true);
  }
});

export function createDocumentDownloadUrl({ documentId, userId }) {
  const secret = getSigningSecret();

  if (!secret) {
    throw new Error("Document signing secret is not configured.");
  }

  const token = jwt.sign(
    {
      purpose: "document-download",
      documentId,
      sub: userId
    },
    secret,
    { expiresIn: "10m" }
  );

  return `/api/documents/${documentId}/download?token=${encodeURIComponent(token)}`;
}

export function verifyDocumentDownloadToken(token, documentId) {
  const secret = getSigningSecret();

  if (!secret) {
    throw new Error("Document signing secret is not configured.");
  }

  const payload = jwt.verify(token, secret);

  if (payload.purpose !== "document-download" || payload.documentId !== documentId) {
    throw new Error("Document download token is invalid.");
  }

  return payload;
}

export async function deleteStoredDocument(storageKey) {
  if (!storageKey) {
    return;
  }

  await fs.unlink(getDocumentFilePath(storageKey)).catch((error) => {
    if (error.code !== "ENOENT") {
      throw error;
    }
  });
}

export function getSafeDownloadName(document) {
  const extension = allowedDocumentTypes[document.file_type] || "";
  const baseName = String(document.name || "document")
    .trim()
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${baseName || "document"}${extension}`;
}
