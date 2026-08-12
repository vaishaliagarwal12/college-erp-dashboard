const User = require("../models/User");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const getPagination = require("../utils/pagination");
const escapeRegex = require("../utils/escapeRegex");
const { ROLES } = require("../config/roles");

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Get All Users (search, filter, pagination)
const getUsers = asyncHandler(async (req, res) => {
  const { search = "", role, status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const query = {};

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [{ name: regex }, { email: regex }];
  }

  if (role) query.role = role;
  if (status) query.status = status;

  const [total, users] = await Promise.all([
    User.countDocuments(query),
    User.find(query)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    data: users.map(toPublicUser),
  });
});

// Create User (account only; no profile link)
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, status } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new AppError("User already exists", 409);
  }

  const user = await User.create({ name, email, password, role, status });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: toPublicUser(user),
  });
});

// Get User By ID
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({ success: true, data: toPublicUser(user) });
});

// Update User (name, role, status)
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // A SuperAdmin can only be modified by another SuperAdmin
  if (user.role === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
    throw new AppError("Only a SuperAdmin can modify SuperAdmin accounts", 403);
  }

  // Prevent self-demotion / self-deactivation
  if (
    String(user._id) === String(req.user._id) &&
    (req.body.role || req.body.status)
  ) {
    throw new AppError("You cannot change your own role or status", 400);
  }

  const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: "after",
    runValidators: true,
  });

  // Sync status to linked profile (Student/Faculty) if it exists
  if (req.body.status) {
    await Promise.all([
      Student.updateOne({ user: user._id }, { status: req.body.status }),
      Faculty.updateOne({ user: user._id }, { status: req.body.status }),
    ]);
  }

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: toPublicUser(updated),
  });
});

// Delete User (also removes linked Student/Faculty profile)
const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw new AppError("You cannot delete your own account", 400);
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
    throw new AppError("Only a SuperAdmin can delete SuperAdmin accounts", 403);
  }

  await Promise.all([
    Student.deleteOne({ user: user._id }),
    Faculty.deleteOne({ user: user._id }),
    User.deleteOne({ _id: user._id }),
  ]);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

module.exports = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
};
