import express from "express";
import { ROLE_LEVELS } from "../config/constants.js";
import {
  deleteUser,
  getUsers,
  loginUser,
  registerUser,
  updateUser,
} from "../controllers/authController.js";
import { protect, requireLevel } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public login route
router.post("/login", loginUser);

// Protected user creation route (Strictly Level 1 Admin)
router.post(
  "/register",
  protect,
  requireLevel(ROLE_LEVELS.ADMIN),
  registerUser,
);

router.get("/users", protect, requireLevel(ROLE_LEVELS.ADMIN), getUsers);

router.delete(
  "/users/:id",
  protect,
  requireLevel(ROLE_LEVELS.ADMIN),
  deleteUser,
);

router.put("/users/:id", protect, requireLevel(ROLE_LEVELS.ADMIN), updateUser);

export default router;
