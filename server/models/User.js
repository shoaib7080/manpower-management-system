import mongoose from "mongoose";
import { ROLE_LEVELS } from "../config/constants.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // Reverse Numeric Level (1 = Admin, 2 = Engineer, 3 = Supervisor)
    level: {
      type: Number,
      required: true,
      default: ROLE_LEVELS.FIELD_USER,
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
