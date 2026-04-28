import mongoose from "mongoose";
import Store from "../models/Store.js";
import Page from "../models/PageBuilder.js";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const sendValidation = (res, errors) =>
  res
    .status(400)
    .json({ statusCode: 400, message: "Validation failed", errors });

const collectStoreErrors = ({ websiteId, name, code }, isCreate) => {
  const errors = {};
  if (isCreate) {
    if (!websiteId) errors.websiteId = "websiteId is required";
    if (!name) errors.name = "Name is required";
    if (!code) errors.code = "Code is required";
    return errors;
  }
  if (websiteId !== undefined && !websiteId)
    errors.websiteId = "websiteId is required";
  if (name !== undefined && !name) errors.name = "Name is required";
  if (code !== undefined && !code) errors.code = "Code is required";
  return errors;
};

export const getStores = async (req, res) => {
  try {
    const filter = {};
    if (req.query.websiteId) filter.websiteId = String(req.query.websiteId);
    const stores = await Store.find(filter).sort({
      websiteId: 1,
      position: 1,
      createdAt: 1,
    });
    res.status(200).json({
      statusCode: 200,
      message: "Stores fetched successfully",
      data: stores,
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const getStoreById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Store not found" });
    }
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Store not found" });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Store fetched successfully",
      data: store,
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const createStore = async (req, res) => {
  try {
    const errors = collectStoreErrors(req.body, true);
    if (Object.keys(errors).length > 0) return sendValidation(res, errors);

    const { websiteId, code } = req.body;
    const existing = await Store.findOne({ websiteId, code });
    if (existing) {
      return res.status(409).json({
        statusCode: 409,
        message: "Validation failed",
        errors: {
          code: "A store with this code already exists for this website",
        },
      });
    }

    const store = await Store.create(req.body);
    res.status(201).json({
      statusCode: 201,
      message: "Store created successfully",
      data: store,
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const updateStore = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Store not found" });
    }
    const errors = collectStoreErrors(req.body, false);
    if (Object.keys(errors).length > 0) return sendValidation(res, errors);

    const store = await Store.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!store) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Store not found" });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Store updated successfully",
      data: store,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        statusCode: 409,
        message: "Validation failed",
        errors: {
          code: "A store with this code already exists for this website",
        },
      });
    }
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

const DEFAULT_STORE_CODE = "default";
const DEFAULT_STORE_NAME = "Default Store";

export const ensureDefaultStores = async (req, res) => {
  try {
    const websites = Array.isArray(req.body?.websites) ? req.body.websites : [];
    if (websites.length === 0) {
      return res.status(200).json({
        statusCode: 200,
        message: "No websites provided",
        data: { stores: [] },
      });
    }

    for (const website of websites) {
      const websiteId = String(website?.id ?? website?.websiteId ?? "").trim();
      if (!websiteId) continue;
      const existing = await Store.findOne({
        websiteId,
        code: DEFAULT_STORE_CODE,
      });
      if (existing) continue;
      try {
        await Store.create({
          websiteId,
          name: DEFAULT_STORE_NAME,
          code: DEFAULT_STORE_CODE,
          status: true,
          position: 0,
        });
      } catch (err) {
        if (err?.code !== 11000) throw err;
      }
    }

    const websiteIds = websites
      .map((website) => String(website?.id ?? website?.websiteId ?? "").trim())
      .filter(Boolean);
    const stores = await Store.find({ websiteId: { $in: websiteIds } });

    res.status(200).json({
      statusCode: 200,
      message: "Default stores ensured",
      data: stores,
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const deleteStore = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Store not found" });
    }
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Store not found" });
    }
    await Page.updateMany(
      { storeIds: store._id },
      { $pull: { storeIds: store._id } },
    );
    res
      .status(200)
      .json({ statusCode: 200, message: "Store deleted successfully" });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};
