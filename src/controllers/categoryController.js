import Category from "../models/Category.js";

export const getCategories = async (req, res) => {
  try {
    const { limit, featured, ids, sort } = req.query;

    const filter = {};
    if (ids) {
      const idList = String(ids).split(",").map((s) => s.trim()).filter(Boolean);
      if (idList.length) filter.id = { $in: idList };
    }
    if (featured === "true") filter.featured = true;

    let sortOption = { createdAt: -1 };
    switch (sort) {
      case "name-asc": sortOption = { name: 1 }; break;
      case "name-desc": sortOption = { name: -1 }; break;
      case "popular": sortOption = { productCount: -1 }; break;
      case "oldest": sortOption = { createdAt: 1 }; break;
      case "newest":
      default: sortOption = { createdAt: -1 };
    }

    let query = Category.find(filter).sort(sortOption);
    const parsedLimit = Number(limit);
    if (Number.isFinite(parsedLimit) && parsedLimit > 0) query = query.limit(parsedLimit);

    const categories = await query.exec();

    if (ids) {
      const order = String(ids).split(",").map((s) => s.trim());
      categories.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    }

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
