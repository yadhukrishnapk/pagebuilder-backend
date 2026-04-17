import mongoose from "mongoose";

const pageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  viewType: { type: String, enum: ["desktop", "mobile"], default: "desktop" },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  components: [mongoose.Schema.Types.Mixed]
}, { timestamps: true });

export default mongoose.model("Page", pageSchema);
