import PageBuilder from "../models/PageBuilder.js";

const ALLOWED_STATUSES = new Set(["draft", "active", "inactive"]);

const requireWebsiteId = (value, res) => {
  const websiteId = value ? String(value).trim() : "";
  if (!websiteId) {
    res.status(400).json({
      statusCode: 400,
      message: "Validation failed",
      errors: { websiteId: "websiteId is required" },
    });
    return null;
  }
  return websiteId;
};

const parseStatusFilter = (status) => {
  if (!status) return null;
  const values = Array.isArray(status)
    ? status
    : String(status)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  const valid = values.filter((v) => ALLOWED_STATUSES.has(v));
  return valid.length > 0 ? { $in: valid } : null;
};

export const getPages = async (req, res) => {
  try {
    const websiteId = requireWebsiteId(req.query.websiteId, res);
    if (!websiteId) return;

    const filter = { websiteId };
    const statusFilter = parseStatusFilter(req.query.status);
    if (statusFilter) filter.status = statusFilter;

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
    const websiteId = requireWebsiteId(req.query.websiteId, res);
    if (!websiteId) return;

    const page = await PageBuilder.findOne({
      websiteId,
      slug: req.params.slug,
    });
    if (!page) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Page not found" });
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
    const { websiteId, name, slug, viewType, components } = req.body;

    const errors = {};
    if (!websiteId) errors.websiteId = "websiteId is required";
    if (!name) errors.name = "Name is required";
    if (!slug) errors.slug = "Slug is required";
    if (!viewType) errors.viewType = "View type is required";
    if (components && !Array.isArray(components)) {
      errors.components = "Components must be an array";
    }

    if (Object.keys(errors).length > 0) {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Validation failed", errors });
    }

    const existing = await PageBuilder.findOne({ websiteId, slug });
    if (existing) {
      return res.status(409).json({
        statusCode: 409,
        message: "Validation failed",
        errors: {
          slug: "A page with this slug already exists for this website",
        },
      });
    }

    const page = new PageBuilder(req.body);
    const savedPage = await page.save();
    res.status(201).json({
      statusCode: 201,
      message: "Page created successfully",
      data: {
        _id: savedPage._id,
        slug: savedPage.slug,
        websiteId: savedPage.websiteId,
      },
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

const collectUpdateErrors = ({ name, slug, viewType, components }) => {
  const errors = {};
  if (name !== undefined && !name) errors.name = "Name is required";
  if (slug !== undefined && !slug) errors.slug = "Slug is required";
  if (viewType !== undefined && !viewType)
    errors.viewType = "View type is required";
  if (components !== undefined && !Array.isArray(components)) {
    errors.components = "Components must be an array";
  }
  return errors;
};

export const updatePage = async (req, res) => {
  try {
    const websiteId = requireWebsiteId(
      req.body.websiteId ?? req.query.websiteId,
      res,
    );
    if (!websiteId) return;

    const { slug } = req.body;
    const errors = collectUpdateErrors(req.body);

    if (Object.keys(errors).length > 0) {
      return res
        .status(400)
        .json({ statusCode: 400, message: "Validation failed", errors });
    }

    if (slug && slug !== req.params.slug) {
      const conflict = await PageBuilder.findOne({ websiteId, slug });
      if (conflict) {
        return res.status(409).json({
          statusCode: 409,
          message: "Validation failed",
          errors: {
            slug: "A page with this slug already exists for this website",
          },
        });
      }
    }

    const page = await PageBuilder.findOneAndUpdate(
      { websiteId, slug: req.params.slug },
      { ...req.body, websiteId },
      { new: true, runValidators: true },
    );
    if (!page) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Page not found" });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Page updated successfully",
      data: { _id: page._id, slug: page.slug, websiteId: page.websiteId },
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const deletePage = async (req, res) => {
  try {
    const websiteId = requireWebsiteId(req.query.websiteId, res);
    if (!websiteId) return;

    const page = await PageBuilder.findOneAndDelete({
      _id: req.params.id,
      websiteId,
    });
    if (!page) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Page not found" });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Page deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};
