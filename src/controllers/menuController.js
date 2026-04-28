import mongoose from "mongoose";
import Menu from "../models/Menu.js";
import Store from "../models/Store.js";
import { validateSchedule } from "../utils/scheduleValidation.js";
import { validateMenuTree } from "../utils/menuTreeValidation.js";

const ALLOWED_STATUSES = new Set(["draft", "active", "inactive"]);
const ALLOWED_LOCATIONS = new Set(["header", "footer", "mobile", "custom"]);

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

const collectMetaErrors = ({ name, code, location }, isCreate) => {
  const errors = {};
  if (isCreate) {
    if (!name) errors.name = "Name is required";
    if (!code) errors.code = "Code is required";
  } else {
    if (name !== undefined && !name) errors.name = "Name is required";
    if (code !== undefined && !code) errors.code = "Code is required";
  }
  if (location !== undefined && !ALLOWED_LOCATIONS.has(location)) {
    errors.location = "Invalid location";
  }
  return errors;
};

const applyTreeValidation = (body, errors) => {
  if (!("items" in body)) return undefined;
  const result = validateMenuTree(body.items);
  if (result.errors.length > 0) {
    errors.items = result.errors.join("; ");
    return undefined;
  }
  return result.items;
};

export const getMenus = async (req, res) => {
  try {
    const filter = {};
    if (req.query.storeId) {
      if (!isValidObjectId(req.query.storeId)) {
        return sendValidation(res, { storeId: "Invalid store id" });
      }
      filter.storeIds = new mongoose.Types.ObjectId(req.query.storeId);
    }
    if (req.query.location && ALLOWED_LOCATIONS.has(req.query.location)) {
      filter.location = req.query.location;
    }
    const statusFilter = parseStatusFilter(req.query.status);
    if (statusFilter) filter.status = statusFilter;

    const menus = await Menu.find(filter)
      .select("-items")
      .populate({ path: "storeIds", select: "name code websiteId" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      statusCode: 200,
      message: "Menus fetched successfully",
      data: menus,
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const getMenuById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Menu not found" });
    }
    const menu = await Menu.findById(req.params.id).populate({
      path: "storeIds",
      select: "name code websiteId",
    });
    if (!menu) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Menu not found" });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Menu fetched successfully",
      data: menu,
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const getMenuByCode = async (req, res) => {
  try {
    const menu = await Menu.findOne({ code: req.params.code }).populate({
      path: "storeIds",
      select: "name code websiteId",
    });
    if (!menu) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Menu not found" });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Menu fetched successfully",
      data: menu,
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const createMenu = async (req, res) => {
  try {
    const errors = collectMetaErrors(req.body, true);
    const { ids: storeIds, error: storeError } = await normalizeStoreIds(
      req.body.storeIds,
    );
    if (storeError) errors.storeIds = storeError;

    const schedule = validateSchedule(req.body);
    Object.assign(errors, schedule.errors);

    const items = applyTreeValidation(req.body, errors);

    if (Object.keys(errors).length > 0) return sendValidation(res, errors);

    const existing = await Menu.findOne({ code: req.body.code });
    if (existing) {
      return res.status(409).json({
        statusCode: 409,
        message: "Validation failed",
        errors: { code: "A menu with this code already exists" },
      });
    }

    const menu = await Menu.create({
      ...req.body,
      storeIds,
      ...schedule.normalized,
      ...(items !== undefined ? { items } : {}),
    });
    res.status(201).json({
      statusCode: 201,
      message: "Menu created successfully",
      data: { _id: menu._id, code: menu.code, storeIds: menu.storeIds },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        statusCode: 409,
        message: "Validation failed",
        errors: { code: "A menu with this code already exists" },
      });
    }
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const updateMenu = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Menu not found" });
    }
    const errors = collectMetaErrors(req.body, false);

    let storeIds;
    if (req.body.storeIds !== undefined) {
      const result = await normalizeStoreIds(req.body.storeIds);
      if (result.error) errors.storeIds = result.error;
      else storeIds = result.ids;
    }

    const schedule = validateSchedule(req.body);
    Object.assign(errors, schedule.errors);

    const items = applyTreeValidation(req.body, errors);

    if (Object.keys(errors).length > 0) return sendValidation(res, errors);

    if (req.body.code) {
      const conflict = await Menu.findOne({
        code: req.body.code,
        _id: { $ne: req.params.id },
      });
      if (conflict) {
        return res.status(409).json({
          statusCode: 409,
          message: "Validation failed",
          errors: { code: "A menu with this code already exists" },
        });
      }
    }

    const update = { ...req.body, ...schedule.normalized };
    if (storeIds !== undefined) update.storeIds = storeIds;
    if (items !== undefined) update.items = items;

    const menu = await Menu.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!menu) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Menu not found" });
    }
    res.status(200).json({
      statusCode: 200,
      message: "Menu updated successfully",
      data: { _id: menu._id, code: menu.code, storeIds: menu.storeIds },
    });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};

export const deleteMenu = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Menu not found" });
    }
    const menu = await Menu.findByIdAndDelete(req.params.id);
    if (!menu) {
      return res
        .status(404)
        .json({ statusCode: 404, message: "Menu not found" });
    }
    res
      .status(200)
      .json({ statusCode: 200, message: "Menu deleted successfully" });
  } catch (error) {
    res.status(500).json({ statusCode: 500, message: error.message });
  }
};
