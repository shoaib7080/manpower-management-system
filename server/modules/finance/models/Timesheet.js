// server/modules/finance/models/Timesheet.js
import mongoose from "mongoose";

const timesheetSchema = new mongoose.Schema(
  {
    jobOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobOrder",
      required: true,
    },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    records: [
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
          default: null,
        },
        employeeName: { type: String, required: true },
        trade: { type: String, required: true },
        isExternal: { type: Boolean, default: false },
        days: [
          {
            dayNumber: { type: Number, required: true },
            selected: { type: Boolean, default: true },
            standardHours: { type: Number, default: 8 },
            overtimeHours: { type: Number, default: 0 },
          },
        ],
      },
    ],
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "APPROVED"],
      default: "DRAFT",
    },
    approvedBy: { type: String },
  },
  { timestamps: true },
);

timesheetSchema.index({ jobOrderId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("Timesheet", timesheetSchema);
