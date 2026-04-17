import mongoose from "mongoose";

const colorSchema = new mongoose.Schema({
  name: String,
  hex: String
}, { _id: false });

const productSchema = new mongoose.Schema({
  id: String,
  title: String,
  slug: String,
  description: String,
  category: String,
  subCategory: String,
  brand: String,
  price: Number,
  discountPercentage: Number,
  finalPrice: Number,
  currency: String,
  sizes: [String],
  colors: [colorSchema],
  stock: Number,
  rating: Number,
  reviewsCount: Number,
  thumbnail: String,
  isNewArrival: Boolean,
  isTrending: Boolean,
  isBestSeller: Boolean
}, { timestamps: true });

export default mongoose.model("Product", productSchema, "products");