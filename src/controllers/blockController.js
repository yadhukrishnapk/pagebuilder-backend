import mongoose from "mongoose";
import Block from "../models/Block.js";
import Store from "../models/Store.js";
import { validateSchedule } from "../utils/scheduleValidation.js";

const ALLOWED_STATUSES = new Set(["draft", "active", "inactive"]);

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const sendValidation = (res, errors) =>
  res
    .status(400)
    .json({ statusCode: 400, message: "Validation failed", errors });

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

const normalizeStoreIds = async (rawStoreIds) => {
  if (rawStoreIds === undefined) return { ids: undefined, error: null };
  if (!Array.isArray(rawStoreIds)) {
    return { ids: null, error: "storeIds must be an array" };
  }
  if (rawStoreIds.length === 0) {
    return { ids: null, error: "Select at least one store" };
  }
  const invalid = rawStoreIds.find((id) => !isValidObjectId(id));
  if (invalid) return { ids: null, error: "Invalid store id provided" };

  const ids = rawStoreIds.map((id) => new mongoose.Types.ObjectId(id));
  const count = await Store.countDocuments({ _id: { $in: ids } });
  if (count !== ids.length) {
    return { ids: null, error: "One or more stores no longer exist" };
  }
  return { ids, error: null };
};

const collectErrors = ({ name, code, components }, isCreate) => {
  const errors = {};
  if (isCreate) {
    if (!name) errors.name = "Name is required";
    if (!code) errors.code = "Code is required";
  } else {
    if (name !== undefined && !name) errors.name = "Name is required";
    if (code !== undefined && !code) errors.code = "Code is required";
  }
  if (components !== undefined && !Array.isArray(components)) {
    errors.components = "Components must be an array";
  }
  return errors;
};

export const getBlocks = async (req, res) => {
  try {
    const filter = {};

    if (req.query.storeId) {
      if (!isValidObjectId(req.query.storeId)) {
        return sendValidation(res, { storeId: "Invalid store id" });
      }
      filter.storeIds = new mongoose.Types.ObjectId(req.query.storeId);
    }

    const statusFilter = parseStatusFilter(req.query.status);
    if (statusFilter) filter.status = statusFilter;

    const blocks = await Block.find(filter)
      .select("-components")
      .populate({ path: "storeIds", select: "name code websiteId" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      statusCode: 200,
      message: "Blocks fetched successfully",
      data: blocks,
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const getBlockById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Block not found" });
    }
    const block = await Block.findById(req.params.id).populate({
      path: "storeIds",
      select: "name code websiteId",
    });
    if (!block) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Block not found" });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Block fetched successfully",
      data: block,
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const getBlockByCode = async (req, res) => {
  try {
    const block = await Block.findOne({ code: req.params.code }).populate({
      path: "storeIds",
      select: "name code websiteId",
    });
    if (!block) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Block not found" });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Block fetched successfully",
      data: block,
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const createBlock = async (req, res) => {
  try {
    const errors = collectErrors(req.body, true);
    const { ids: storeIds, error: storeError } = await normalizeStoreIds(
      req.body.storeIds,
    );
    if (storeError) errors.storeIds = storeError;

    const schedule = validateSchedule(req.body);
    Object.assign(errors, schedule.errors);

    if (Object.keys(errors).length > 0) return sendValidation(res, errors);

    const existing = await Block.findOne({ code: req.body.code });
    if (existing) {
      return res.status(409).json({
        statusCode: 409,
        message: "Validation failed",
        errors: { code: "A block with this code already exists" },
      });
    }

    const block = await Block.create({
      ...req.body,
      storeIds,
      ...schedule.normalized,
    });
    res.status(201).json({
      statusCode: 201,
      message: "Block created successfully",
      data: { _id: block._id, code: block.code, storeIds: block.storeIds },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        statusCode: 409,
        message: "Validation failed",
        errors: { code: "A block with this code already exists" },
      });
    }
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const updateBlock = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Block not found" });
    }
    const errors = collectErrors(req.body, false);

    let storeIds;
    if (req.body.storeIds !== undefined) {
      const result = await normalizeStoreIds(req.body.storeIds);
      if (result.error) errors.storeIds = result.error;
      else storeIds = result.ids;
    }

    const schedule = validateSchedule(req.body);
    Object.assign(errors, schedule.errors);

    if (Object.keys(errors).length > 0) return sendValidation(res, errors);

    if (req.body.code) {
      const conflict = await Block.findOne({
        code: req.body.code,
        _id: { $ne: req.params.id },
      });
      if (conflict) {
        return res.status(409).json({
          statusCode: 409,
          message: "Validation failed",
          errors: { code: "A block with this code already exists" },
        });
      }
    }

    const update = { ...req.body, ...schedule.normalized };
    if (storeIds !== undefined) update.storeIds = storeIds;

    const block = await Block.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!block) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Block not found" });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Block updated successfully",
      data: { _id: block._id, code: block.code, storeIds: block.storeIds },
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const deleteBlock = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Block not found" });
    }
    const block = await Block.findByIdAndDelete(req.params.id);
    if (!block) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Block not found" });
    }
    res
      .status(200)
      .json({ statusCode: 200, message: "Block deleted successfully" });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};
