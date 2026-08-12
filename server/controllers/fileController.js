const mongoose = require("mongoose");
const {
  getBucket,
  saveBufferToGridFS,
  deleteFromGridFS,
  randomFilename,
} = require("../utils/gridfs");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const getPagination = require("../utils/pagination");

const serializeFile = (file) => ({
  id: file._id,
  filename: file.filename,
  originalName: file.metadata?.originalName || file.filename,
  contentType: file.contentType,
  length: file.length,
  module: file.metadata?.module || null,
  resourceId: file.metadata?.resourceId || null,
  uploadedBy: file.metadata?.uploadedBy || null,
  uploadDate: file.uploadDate,
});

// Upload one or more files into GridFS
const uploadFiles = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) {
    throw new AppError("No files uploaded. Use the 'files' field in multipart form-data.", 400);
  }

  const { module, resourceId } = req.body;

  const saved = [];

  for (const file of req.files) {
    const filename = randomFilename(file.originalname);

    const result = await saveBufferToGridFS({
      buffer: file.buffer,
      filename,
      mimetype: file.mimetype,
      metadata: {
        originalName: file.originalname,
        module: module || null,
        resourceId: resourceId || null,
        uploadedBy: req.user._id.toString(),
      },
    });

    const doc = await getBucket()
      .find({ _id: new mongoose.Types.ObjectId(result.id) })
      .next();

    saved.push(serializeFile(doc));
  }

  res.status(201).json({
    success: true,
    message: `${saved.length} file(s) uploaded successfully`,
    count: saved.length,
    data: saved,
  });
});

// List files (filter by module / resourceId)
const listFiles = asyncHandler(async (req, res) => {
  const { module, resourceId } = req.query;
  const { page, limit, skip } = getPagination(req.query, 20);

  const query = {};

  if (module) query["metadata.module"] = module;
  if (resourceId) query["metadata.resourceId"] = resourceId;

  const files = await getBucket()
    .find(query)
    .sort({ uploadDate: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  res.status(200).json({
    success: true,
    count: files.length,
    pagination: { page, limit, total: files.length, pages: Math.ceil(files.length / limit) },
    data: files.map(serializeFile),
  });
});

// Download / stream a single file
const downloadFile = asyncHandler(async (req, res) => {
  const file = await getBucket()
    .find({ _id: new mongoose.Types.ObjectId(req.params.id) })
    .next();

  if (!file) {
    throw new AppError("File not found", 404);
  }

  res.set("Content-Type", file.contentType || "application/octet-stream");
  res.set(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(file.metadata?.originalName || file.filename)}"`
  );

  const downloadStream = getBucket().openDownloadStream(file._id);
  downloadStream.pipe(res);

  downloadStream.on("error", (err) => {
    res.status(500).json({ success: false, message: "Failed to stream file" });
  });
});

// Delete a file
const deleteFile = asyncHandler(async (req, res) => {
  const file = await getBucket()
    .find({ _id: new mongoose.Types.ObjectId(req.params.id) })
    .next();

  if (!file) {
    throw new AppError("File not found", 404);
  }

  await deleteFromGridFS(req.params.id);

  res.status(200).json({
    success: true,
    message: "File deleted successfully",
  });
});

module.exports = {
  uploadFiles,
  listFiles,
  downloadFile,
  deleteFile,
};
