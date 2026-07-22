import mongoose from 'mongoose';
import { EMPLOYEE_STATUS, TRADES } from '../config/constants.js';

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  trade: { type: String, required: true, enum: TRADES, index: true },
  dob: { type: Date },
  emiratesId: { type: String, unique: true, sparse: true },
  passportNumber: { type: String },
  
  // ADNOC & Safety Certifications
  trainings: {
    adnocInductionExpiry: { type: Date },
    h2sExpiry: { type: Date },
    medicalExpiry: { type: Date },
    seaSurvivalExpiry: { type: Date }
  },

  // Operational Status
  status: { 
    type: String, 
    enum: Object.values(EMPLOYEE_STATUS),
    default: EMPLOYEE_STATUS.AVAILABLE,
    index: true 
  },

  // Current Site Deployment Reference
  currentAssignment: {
    jobOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobOrder', default: null },
    siteName: { type: String, default: null },
    mobDate: { type: Date, default: null },
    targetDemobDate: { type: Date, default: null }
  }
}, { timestamps: true });

export default mongoose.model('Employee', employeeSchema);
