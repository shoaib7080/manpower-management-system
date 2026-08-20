import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false,
      default: null,
    },
    employeeName: { type: String, required: true },
    previousStatus: { type: String },
    newStatus: { type: String, required: true },
    previousSite: { type: String, default: "None / Bench" },
    newSite: { type: String, required: true },
    mobDate: { type: Date },
    demobDate: { type: Date },

    // Enforced Mandatory Audit Fields
    reasonForChange: { type: String, required: true },
    authorizedBy: { type: String, required: true },

    updatedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export default mongoose.model("AuditLog", auditLogSchema);
