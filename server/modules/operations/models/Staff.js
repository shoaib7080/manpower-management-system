import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    nameLower: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

staffSchema.index({ nameLower: 1 }, { unique: true });

staffSchema.pre("save", function () {
  this.nameLower = this.name.toLowerCase();
});

export default mongoose.model("Staff", staffSchema);
