const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const audit = require("../middleware/audit");
const upload = require("../middleware/upload");
const {
  uploadFiles,
  listFiles,
  downloadFile,
  deleteFile,
} = require("../controllers/fileController");

const router = express.Router();

router.use(protect);

// Read: all authenticated roles
router.get("/", listFiles);
router.get("/:id", downloadFile);

// Write: data-driven permission map
router.post(
  "/upload",
  requirePermission("files", "write"),
  upload.array("files", 5),
  audit("files", "create", "File"),
  uploadFiles
);
router.delete(
  "/:id",
  requirePermission("files", "delete"),
  audit("files", "delete", "File"),
  deleteFile
);

module.exports = router;
