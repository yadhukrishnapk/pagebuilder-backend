import PageBuilder from "../models/PageBuilder.js";

export const getPages = async (req, res) => {
  try {
    const filter = {};
    const { status } = req.query;
    if (status) {
      const allowed = new Set(["draft", "active", "inactive"]);
      const values = Array.isArray(status)
        ? status
        : String(status).split(",").map((s) => s.trim()).filter(Boolean);
      const valid = values.filter((v) => allowed.has(v));
      if (valid.length > 0) filter.status = { $in: valid };
    }

    const pages = await PageBuilder.find(filter)
      .select("-components")
      .sort({ createdAt: -1 });
    res.status(200).json({
      statusCode: 200,
      message: "Pages fetched successfully",
      data: pages,
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const getPageBySlug = async (req, res) => {
  try {
    const page = await PageBuilder.findOne({ slug: req.params.slug });
    if (!page) {
      return res.status(404).json({ statusCode: 404, message: "Page not found" });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Page fetched successfully",
      data: page,
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const createPage = async (req, res) => {
  try {
    const { name, slug, viewType, components } = req.body;

    const errors = {};
    if (!name) errors.name = "Name is required";
    if (!slug) errors.slug = "Slug is required";
    if (!viewType) errors.viewType = "View type is required";
    if (components && !Array.isArray(components)) {
      errors.components = "Components must be an array";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ statusCode: 400, message: "Validation failed", errors });
    }

    const existing = await PageBuilder.findOne({ slug });
    if (existing) {
      return res.status(409).json({
        statusCode: 409,
        message: "Validation failed",
        errors: { slug: "A page with this slug already exists" },
      });
    }

    const page = new PageBuilder(req.body);
    const savedPage = await page.save();
    res.status(201).json({
      statusCode: 201,
      message: "Page created successfully",
      data: { _id: savedPage._id, slug: savedPage.slug },
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const updatePage = async (req, res) => {
  try {
    const { name, slug, viewType, components } = req.body;

    const errors = {};
    if (name !== undefined && !name) errors.name = "Name is required";
    if (slug !== undefined && !slug) errors.slug = "Slug is required";
    if (viewType !== undefined && !viewType) errors.viewType = "View type is required";
    if (components !== undefined && !Array.isArray(components)) {
      errors.components = "Components must be an array";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ statusCode: 400, message: "Validation failed", errors });
    }

    // If slug is being changed, check it isn't taken by another page
    if (slug && slug !== req.params.slug) {
      const conflict = await PageBuilder.findOne({ slug });
      if (conflict) {
        return res.status(409).json({
          statusCode: 409,
          message: "Validation failed",
          errors: { slug: "A page with this slug already exists" },
        });
      }
    }

    const page = await PageBuilder.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true, runValidators: true }
    );
    if (!page) {
      return res.status(404).json({ statusCode: 404, message: "Page not found" });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Page updated successfully",
      data: { _id: page._id, slug: page.slug },
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const deletePage = async (req, res) => {
  try {
    const page = await PageBuilder.findByIdAndDelete(req.params.id);
    if (!page) {
      return res.status(404).json({ statusCode: 404, message: "Page not found" });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Page deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};
