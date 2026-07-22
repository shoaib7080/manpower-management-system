import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  trade: { 
    type: String, 
    required: true, 
    enum: ['Supervisor', 'Foreman', 'Fabricator', 'Welder', 'Fitter', 'Rigger', 'Helper', 'Other'],
    index: true 
  },
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
    enum: ['Available', 'Reserved', 'Mobilized', 'Vacation', 'Halted'], 
    default: 'Available',
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
