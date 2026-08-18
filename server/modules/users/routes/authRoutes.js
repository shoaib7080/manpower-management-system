import express from "express";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import {
  deleteUser,
  getUsers,
  loginUser,
  registerUser,
  updateUser,
} from "../controllers/authController.js";
import {
  protect,
  requireSuperAdmin,
} from "../../../core/middleware/authMiddleware.js";

const router = express.Router();

// ─── Security: Rate Limiter for login ────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
});

// ─── Security: Input Validation for login ────────────────────────────────────
const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("A valid email address is required.")
    .normalizeEmail(),
  body("password")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Password is required."),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Invalid input.",
      errors: errors.array().map((e) => e.msg),
    });
  }
  next();
};

// ─── Routes ──────────────────────────────────────────────────────────────────

// Public login route — rate limited + validated
router.post("/login", loginLimiter, loginValidation, handleValidationErrors, loginUser);

// All routes below require: valid JWT + active account + superAdmin status
router.post("/register", protect, requireSuperAdmin, registerUser);
router.get("/users",     protect, requireSuperAdmin, getUsers);
router.delete("/users/:id", protect, requireSuperAdmin, deleteUser);
router.put("/users/:id",    protect, requireSuperAdmin, updateUser);

export default router;
