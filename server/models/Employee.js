import mongoose from "mongoose";
import { EMPLOYEE_STATUS, TRADES } from "../config/constants.js";

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    trade: { type: String, required: true, trim: true, index: true },
    specialization: { type: String, trim: true, default: null },
    dob: { type: Date },
    emiratesId: {
      type: String,
      unique: true,
      sparse: true,
      // Coerce empty strings to null so the sparse unique index
      // doesn't treat multiple blank emiratesIds as duplicates.
      set: (v) => (v && v.trim() ? v.trim() : null),
    },
    passportNumber: { type: String },

    // HSE & Safety Certifications
    trainings: {
      hseInductionExpiry: { type: Date },
      adnocInductionExpiry: { type: Date },
      h2sExpiry: { type: Date },
      medicalExpiry: { type: Date },
      tbosietExpiry: { type: Date },
      seaSurvivalExpiry: { type: Date },
    },

    documents: {
      hsePassport: {
        available: { type: Boolean, default: false },
        number: { type: String, default: null },
        expiry: { type: Date, default: null },
      },
      cicpaPass: {
        available: { type: Boolean, default: false },
        number: { type: String, default: null },
        expiry: { type: Date, default: null },
      },
    },

    // Specialization Certifications
    certifications: [
      {
        name: { type: String, required: true, trim: true },
        certificateNumber: { type: String, trim: true, default: null },
        issueDate: { type: Date, default: null },
        expiryDate: { type: Date, default: null },
        fileUrl: { type: String, default: null },
        filePublicId: { type: String, default: null },
        fileName: { type: String, default: null },
      },
    ],

    // Operational Status
    status: {
      type: String,
      enum: Object.values(EMPLOYEE_STATUS),
      default: EMPLOYEE_STATUS.AVAILABLE,
      index: true,
    },

    // Current Site Deployment Reference
    currentAssignment: {
      jobOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobOrder",
        default: null,
      },
      siteName: { type: String, default: null },
      mobDate: { type: Date, default: null },
      targetDemobDate: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

export default mongoose.model("Employee", employeeSchema);
