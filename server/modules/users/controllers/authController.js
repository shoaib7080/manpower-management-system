import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Helper: Sign JWT — payload is minimal (just id).
// Permissions are always fetched fresh from DB in the protect middleware,
// so there is no risk of stale permission data in a long-lived token.
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please enter both email and password." });
    }

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Block suspended accounts before issuing a token
    if (!user.isActive) {
      return res.status(403).json({
        message: "Account suspended. Contact your administrator.",
      });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      permissions: user.permissions,
      isActive: user.isActive,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Protected (SuperAdmin only)
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, permissions } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields." });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    // A non-superAdmin user cannot be created with superAdmin: true,
    // even if the caller is a superAdmin (belt-and-suspenders guard).
    const requestedPerms = permissions || {};
    const safePermissions = {
      operations: requestedPerms.operations ?? 1,
      finance:    requestedPerms.finance    ?? 0,
      superAdmin: requestedPerms.superAdmin === true && req.user?.permissions?.superAdmin === true
        ? true
        : false,
    };

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      permissions: safePermissions,
    });

    res.status(201).json({
      message: `User ${user.name} created successfully.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        permissions: user.permissions,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (for Superadmin Dashboard)
// @route   GET /api/auth/users
// @access  Protected (SuperAdmin only)
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: 1 });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Hard delete a user (preserved from Phase 1; Phase 5 adds soft delete)
// @route   DELETE /api/auth/users/:id
// @access  Protected (SuperAdmin only)
export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account." });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    res.status(200).json({ message: `User ${user.name} deleted.` });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile, permissions, or active status
// @route   PUT /api/auth/users/:id
// @access  Protected (SuperAdmin only)
export const updateUser = async (req, res, next) => {
  try {
    const { name, email, password, permissions, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (name) user.name = name;
    if (email) user.email = email;

    // Merge permission updates — only supplied keys are overwritten
    if (permissions && typeof permissions === "object") {
      if (permissions.operations !== undefined)
        user.permissions.operations = permissions.operations;
      if (permissions.finance !== undefined)
        user.permissions.finance = permissions.finance;
      // Only a superAdmin can grant/revoke superAdmin status on another user
      if (
        permissions.superAdmin !== undefined &&
        req.user?.permissions?.superAdmin === true
      ) {
        user.permissions.superAdmin = permissions.superAdmin;
      }
    }

    // Toggle active status (soft delete / reinstate)
    if (isActive !== undefined) user.isActive = isActive;

    if (password) {
      user.password = await bcrypt.hash(password, await bcrypt.genSalt(10));
    }

    const updated = await user.save();
    res.status(200).json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      permissions: updated.permissions,
      isActive: updated.isActive,
    });
  } catch (error) {
    next(error);
  }
};
