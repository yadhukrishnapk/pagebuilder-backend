import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  id: String,
  name: String,
  slug: String,
  description: String,
  image: String,
  bannerImage: String,
  icon: String,
  productCount: Number,
  featured: Boolean
}, { timestamps: true });

export default mongoose.model("Category", categorySchema, "category");