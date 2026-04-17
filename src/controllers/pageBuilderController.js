import PageBuilder from "../models/PageBuilder.js";

export const getPages = async (req, res) => {
  try {
    const pages = await PageBuilder.find().select("-components");
    res.status(200).json({
      statusCode: 200,
      message: "Pages fetched successfully",
      data: pages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPageBySlug = async (req, res) => {
  try {
    const page = await PageBuilder.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Page fetched successfully",
      data: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPage = async (req, res) => {
  try {
    const { name, slug, viewType, components } = req.body;

    if (!name || !slug || !viewType) {
      return res.status(400).json({
        statusCode: 400,
        message: "Validation failed",
        errors: {
          ...(!name && { name: "Name is required" }),
          ...(!slug && { slug: "Slug is required" }),
          ...(!viewType && { viewType: "View type is required" }),
        },
      });
    }

    if (components && !Array.isArray(components)) {
      return res.status(400).json({
        statusCode: 400,
        message: "Validation failed",
        errors: { components: "Components must be an array" },
      });
    }

    const existing = await PageBuilder.findOne({ slug });
    if (existing) {
      return res.status(409).json({
        statusCode: 409,
        message: "A page with this slug already exists",
      });
    }

    const page = new PageBuilder(req.body);
    const savedPage = await page.save();
    res.status(201).json({
      statusCode: 201,
      message: "Page created successfully",
      data: savedPage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePage = async (req, res) => {
  try {
    const page = await PageBuilder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Page updated successfully",
      data: page,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
