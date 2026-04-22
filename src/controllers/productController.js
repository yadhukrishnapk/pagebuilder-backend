import Product from "../models/Product.js";

export const getProducts = async (req, res) => {
  try {
    const { limit, category, subCategory, brand, sort, ids, featured } = req.query;

    const filter = {};

    if (ids) {
      const idList = String(ids).split(",").map((s) => s.trim()).filter(Boolean);
      if (idList.length) filter.$or = [{ id: { $in: idList } }, { _id: { $in: idList.filter(mongoIdLike) } }];
    }
    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (brand) filter.brand = brand;
    if (featured === "newArrival") filter.isNewArrival = true;
    if (featured === "trending") filter.isTrending = true;
    if (featured === "bestSeller") filter.isBestSeller = true;

    let sortOption = { createdAt: -1 };
    switch (sort) {
      case "price-asc": sortOption = { finalPrice: 1 }; break;
      case "price-desc": sortOption = { finalPrice: -1 }; break;
      case "rating": sortOption = { rating: -1 }; break;
      case "oldest": sortOption = { createdAt: 1 }; break;
      case "newest":
      default: sortOption = { createdAt: -1 };
    }

    let query = Product.find(filter).sort(sortOption);
    const parsedLimit = Number(limit);
    if (Number.isFinite(parsedLimit) && parsedLimit > 0) query = query.limit(parsedLimit);

    const products = await query.exec();

    if (ids) {
      const order = String(ids).split(",").map((s) => s.trim());
      products.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductFilters = async (_req, res) => {
  try {
    const [categories, brands] = await Promise.all([
      Product.distinct("category"),
      Product.distinct("brand"),
    ]);
    res.json({
      categories: categories.filter(Boolean).sort(),
      brands: brands.filter(Boolean).sort(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function mongoIdLike(s) {
  return /^[a-fA-F0-9]{24}$/.test(s);
}
