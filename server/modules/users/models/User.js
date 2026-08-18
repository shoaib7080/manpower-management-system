import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // Unified RBAC permissions matrix.
    // Scale: 0 = no access, 1 = viewer, 2 = operator, 3 = module admin.
    // superAdmin bypasses all module-level checks entirely.
    permissions: {
      operations: { type: Number, default: 1, min: 0, max: 3 },
      finance:    { type: Number, default: 0, min: 0, max: 3 },
      superAdmin: { type: Boolean, default: false },
    },

    // Soft delete / suspension flag.
    // Suspended users are blocked at login — their data & audit trail are preserved.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
