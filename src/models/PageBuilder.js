import mongoose from "mongoose";

const pageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  viewType: { type: String, enum: ["desktop", "mobile"], default: "desktop" },
  status: { type: String, enum: ["draft", "active", "inactive"], default: "draft" },
  components: [mongoose.Schema.Types.Mixed]
}, { timestamps: true });

export default mongoose.model("Page", pageSchema);
