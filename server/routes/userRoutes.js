const express = require("express");
const { protect, requirePermission } = require("../middleware/auth");
const validate = require("../middleware/validate");
const audit = require("../middleware/audit");
const {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const {
  createUserSchema,
  updateUserSchema,
} = require("../validators/userValidator");

const router = express.Router();

router.use(protect);

// Read: admin staff only
router.get("/", requirePermission("users", "read"), getUsers);
router.get("/:id", requirePermission("users", "read"), getUserById);

// Write: admin staff only
router.post(
  "/",
  requirePermission("users", "write"),
  validate(createUserSchema),
  audit("users", "create", "User"),
  createUser
);
router.put(
  "/:id",
  requirePermission("users", "write"),
  validate(updateUserSchema),
  audit("users", "update", "User"),
  updateUser
);
router.delete(
  "/:id",
  requirePermission("users", "delete"),
  audit("users", "delete", "User"),
  deleteUser
);

module.exports = router;
