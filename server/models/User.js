const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLE_LIST } = require("../config/roles");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: ROLE_LIST,
      default: "Student",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationTokenExpiresAt: {
      type: Date,
      select: false,
    },

    refreshToken: {
      type: String,
      select: false,
    },

    refreshTokenExpiresAt: {
      type: Date,
      select: false,
    },

    // Login lockout
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lockedUntil: {
      type: Date,
      default: null,
    },

    // Password lifecycle
    passwordHistory: {
      type: [String],
      select: false,
      default: [],
    },

    passwordChangedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving; stamp when the password last changed
userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = new Date();
  }
});

// Compare a plaintext password against the stored hash
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Check a candidate password against the current hash + recent history
userSchema.methods.isPasswordReused = async function (candidate) {
  if (this.password && (await bcrypt.compare(candidate, this.password))) {
    return true;
  }
  for (const hash of this.passwordHistory || []) {
    if (await bcrypt.compare(candidate, hash)) {
      return true;
    }
  }
  return false;
};

// Rotate the password: archive the current hash, then set the new one.
// `this.password` must hold the CURRENT hash (select "+password").
userSchema.methods.setNewPassword = function (plainPassword, historyLength) {
  const history = this.passwordHistory || [];
  if (this.password) {
    history.push(this.password);
  }
  this.passwordHistory = history.slice(-(historyLength || 5));
  this.password = plainPassword;
  this.passwordChangedAt = new Date();
};

module.exports = mongoose.model("User", userSchema);
