import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameLower: { type: String },
    description: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

tradeSchema.index({ nameLower: 1 }, { unique: true });

tradeSchema.pre("save", async function () {
  this.nameLower = this.name.toLowerCase();
});

export default mongoose.model("Trade", tradeSchema);
