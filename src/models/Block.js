import mongoose from "mongoose";

const blockSchema = new mongoose.Schema(
  {
    storeIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Store", index: true },
    ],
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "draft",
    },
    publishAt: { type: Date, default: null },
    expireAt: { type: Date, default: null },
    components: [mongoose.Schema.Types.Mixed],
  },
  { timestamps: true },
);

export default mongoose.model("Block", blockSchema);
