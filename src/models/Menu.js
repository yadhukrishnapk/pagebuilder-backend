import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    storeIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Store", index: true },
    ],
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true, index: true },
    location: {
      type: String,
      enum: ["header", "footer", "mobile", "custom"],
      default: "header",
    },
    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "draft",
    },
    publishAt: { type: Date, default: null },
    expireAt: { type: Date, default: null },
    // Recursive item tree validated in the controller — kept as Mixed because
    // Mongoose self-referential subschemas don't pair cleanly with array-of-self.
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model("Menu", menuSchema);
