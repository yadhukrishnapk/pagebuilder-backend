import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    websiteId: { type: String, required: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    status: { type: Boolean, default: true },
    position: { type: Number, default: 0 },
  },
  { timestamps: true },
);

storeSchema.index({ websiteId: 1, code: 1 }, { unique: true });

export default mongoose.model("Store", storeSchema);
