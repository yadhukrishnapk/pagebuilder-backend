import mongoose from "mongoose";

const pageSchema = new mongoose.Schema(
  {
    websiteId: { type: String, required: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    viewType: {
      type: String,
      enum: ["desktop", "mobile"],
      default: "desktop",
    },
    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "draft",
    },
    components: [mongoose.Schema.Types.Mixed],
  },
  { timestamps: true },
);

pageSchema.index({ websiteId: 1, slug: 1 }, { unique: true });

export default mongoose.model("Page", pageSchema);
