import express from "express";
import { query } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { validateUuidParam } from "../middleware/validateRequest.js";
import {
  createDocumentDownloadUrl,
  deleteStoredDocument,
  getDocumentFilePath,
  getSafeDownloadName,
  maxDocumentUploadBytes,
  uploadDocumentFile,
  verifyDocumentDownloadToken
} from "../services/documentStorage.js";
import { isValidDate, toLimitedString, toNonNegativeInteger } from "../utils/validation.js";

const router = express.Router();
router.param("id", validateUuidParam("Document id"));
const documentFields = `id, user_id, name, document_type, expiry_date, reminder_days_before, status, notes,
  file_url, file_type, file_size, storage_key, uploaded_at, created_at, updated_at`;

function toDateString(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

function daysUntil(dateValue) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateValue}T00:00:00`);
  return Math.ceil((target - today) / 86400000);
}

function getDocumentStatus(expiryDate) {
  const days = daysUntil(expiryDate);

  if (days < 0) {
    return "expired";
  }

  if (days <= 30) {
    return "expiring_soon";
  }

  return "valid";
}

function toDocument(row) {
  const expiryDate = toDateString(row.expiry_date);

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    documentType: row.document_type,
    expiryDate,
    reminderDaysBefore: Number(row.reminder_days_before),
    status: getDocumentStatus(expiryDate),
    notes: row.notes || "",
    fileUrl: row.file_url,
    fileType: row.file_type,
    fileSize: row.file_size ? Number(row.file_size) : null,
    storageKey: row.storage_key,
    uploadedAt: row.uploaded_at,
    hasFile: Boolean(row.storage_key),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function validateDocument(input) {
  const errors = {};
  const name = toLimitedString(input.name, 160);
  const documentType = toLimitedString(input.documentType || input.document_type, 100);
  const expiryDate = String(input.expiryDate || input.expiry_date || "").trim();
  const reminderDaysBefore = toNonNegativeInteger(input.reminderDaysBefore ?? input.reminder_days_before, 30);
  const notes = toLimitedString(input.notes, 2000);

  if (name.length < 2) {
    errors.name = "Document name must be at least 2 characters.";
  }

  if (documentType.length < 2) {
    errors.documentType = "Document type must be at least 2 characters.";
  }

  if (!isValidDate(expiryDate)) {
    errors.expiryDate = "Expiry date must be a valid YYYY-MM-DD date.";
  }

  if (reminderDaysBefore === null) {
    errors.reminderDaysBefore = "Reminder preference must be zero or more days.";
  }

  return {
    values: {
      name,
      documentType,
      expiryDate,
      reminderDaysBefore,
      status: getDocumentStatus(expiryDate),
      notes
    },
    errors
  };
}

function runDocumentUpload(req, res) {
  return new Promise((resolve, reject) => {
    uploadDocumentFile.single("file")(req, res, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

router.get("/:id/download", async (req, res, next) => {
  try {
    if (!req.query.token) {
      return res.status(401).json({ message: "A signed download token is required." });
    }

    const payload = verifyDocumentDownloadToken(req.query.token, req.params.id);
    const result = await query(
      `SELECT ${documentFields}
       FROM documents
       WHERE id = $1 AND user_id = $2 AND storage_key IS NOT NULL`,
      [req.params.id, payload.sub]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Document file was not found." });
    }

    const document = result.rows[0];
    res.setHeader("Content-Type", document.file_type);
    return res.download(getDocumentFilePath(document.storage_key), getSafeDownloadName(document));
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Document download link is invalid or expired." });
    }

    return next(error);
  }
});

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT ${documentFields}
       FROM documents
       WHERE user_id = $1
       ORDER BY expiry_date ASC, created_at DESC`,
      [req.user.sub]
    );

    return res.json({ documents: result.rows.map(toDocument) });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT ${documentFields}
       FROM documents
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.sub]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Document was not found." });
    }

    return res.json({ document: toDocument(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { values, errors } = validateDocument(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Document details are invalid.", errors });
    }

    const result = await query(
      `INSERT INTO documents (user_id, name, document_type, expiry_date, reminder_days_before, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${documentFields}`,
      [
        req.user.sub,
        values.name,
        values.documentType,
        values.expiryDate,
        values.reminderDaysBefore,
        values.status,
        values.notes
      ]
    );

    return res.status(201).json({ document: toDocument(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { values, errors } = validateDocument(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Document details are invalid.", errors });
    }

    const result = await query(
      `UPDATE documents
       SET name = $1, document_type = $2, expiry_date = $3, reminder_days_before = $4, status = $5, notes = $6
       WHERE id = $7 AND user_id = $8
       RETURNING ${documentFields}`,
      [
        values.name,
        values.documentType,
        values.expiryDate,
        values.reminderDaysBefore,
        values.status,
        values.notes,
        req.params.id,
        req.user.sub
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Document was not found." });
    }

    return res.json({ document: toDocument(result.rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/upload", async (req, res, next) => {
  let uploadedStorageKey = null;

  try {
    const existingResult = await query(
      `SELECT ${documentFields}
       FROM documents
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.sub]
    );

    if (existingResult.rowCount === 0) {
      return res.status(404).json({ message: "Document was not found." });
    }

    try {
      await runDocumentUpload(req, res);
    } catch (uploadError) {
      return res.status(400).json({
        message:
          uploadError.code === "LIMIT_FILE_SIZE"
            ? `Document files must be ${Math.floor(maxDocumentUploadBytes / 1024 / 1024)} MB or smaller.`
            : uploadError.message || "Document upload failed."
      });
    }

    if (!req.file || !req.documentStorageKey) {
      return res.status(400).json({ message: "Choose a PDF, JPG, or PNG file to upload." });
    }

    uploadedStorageKey = req.documentStorageKey;

    const result = await query(
      `UPDATE documents
       SET file_url = $1, file_type = $2, file_size = $3, storage_key = $4, uploaded_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING ${documentFields}`,
      [
        `/api/documents/${req.params.id}/download`,
        req.file.mimetype,
        req.file.size,
        req.documentStorageKey,
        req.params.id,
        req.user.sub
      ]
    );

    await deleteStoredDocument(existingResult.rows[0].storage_key).catch(() => {});

    return res.json({ document: toDocument(result.rows[0]) });
  } catch (error) {
    if (uploadedStorageKey) {
      await deleteStoredDocument(uploadedStorageKey).catch(() => {});
    }

    return next(error);
  }
});

router.get("/:id/download-url", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT ${documentFields}
       FROM documents
       WHERE id = $1 AND user_id = $2 AND storage_key IS NOT NULL`,
      [req.params.id, req.user.sub]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Document file was not found." });
    }

    return res.json({
      url: createDocumentDownloadUrl({
        documentId: req.params.id,
        userId: req.user.sub
      }),
      expiresInSeconds: 600
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await query("DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING storage_key", [
      req.params.id,
      req.user.sub
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Document was not found." });
    }

    await deleteStoredDocument(result.rows[0].storage_key).catch(() => {});

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
