import mongoose from "mongoose";
import { TRADES } from "../config/constants.js";

const specializationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameLower: { type: String },
    trade: { type: String, required: true, enum: TRADES },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

specializationSchema.index({ nameLower: 1 }, { unique: true });

specializationSchema.pre("save", async function () {
  this.nameLower = this.name.toLowerCase();
  next();
});

export default mongoose.model("Specialization", specializationSchema);
