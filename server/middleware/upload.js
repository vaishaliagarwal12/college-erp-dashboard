const multer = require("multer");
const AppError = require("../utils/AppError");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIMETYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
]);

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
    return cb(
      new AppError(
        `File type "${file.mimetype}" is not allowed. Allowed: images, PDF, DOC/DOCX, XLS/XLSX, CSV, TXT`,
        400
      )
    );
  }
  cb(null, true);
};

// Files are kept in memory and streamed into GridFS by the controller
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
  fileFilter,
});

module.exports = upload;
