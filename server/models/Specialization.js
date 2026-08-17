import mongoose from "mongoose";
import { TRADES } from "../config/constants.js";

const specializationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameLower: { type: String },
    trades: {
      type: [{ type: String, trim: true }],
      required: true,
      validate: (arr) => Array.isArray(arr) && arr.length > 0,
    },
    certifications: {
      type: [{ type: String, trim: true }],
      default: [],
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

specializationSchema.index({ nameLower: 1 }, { unique: true });

specializationSchema.pre("save", async function () {
  this.nameLower = this.name.toLowerCase();
});

export default mongoose.model("Specialization", specializationSchema);
