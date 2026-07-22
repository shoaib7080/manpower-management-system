import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  slotNumber: { type: Number, required: true },
  trade: { type: String, required: true },
  assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
status: { 
    type: String, 
    enum: ['UNASSIGNED', 'RESERVED', 'BOOKED', 'MOBILIZED'], 
    default: 'UNASSIGNED' 
  },
  
  mobDate: { type: Date },
  demobDate: { type: Date }
});

const jobOrderSchema = new mongoose.Schema({
  jobOrderNumber: { type: String, required: true, unique: true },
  siteName: { type: String, required: true },
  clientCategory: { type: String, enum: ['ADNOC Onshore', 'ADNOC Offshore', 'Internal Production', 'Other'], required: true },
  projectEngineer: { type: String, required: true },
  startDate: { type: Date, required: true },
  targetDemobDate: { type: Date }, // Default 90 days logic applied in controller
  
  // High-level requirements summary
  requirements: [{
    trade: { type: String, required: true },
    requiredQty: { type: Number, required: true }
  }],

  // Detailed Slot Allocations (Filled vs. Empty)
  slots: [slotSchema],

  status: { type: String, enum: ['Planned', 'Active', 'Completed'], default: 'Active' }
}, { timestamps: true });

export default mongoose.model('JobOrder', jobOrderSchema);
