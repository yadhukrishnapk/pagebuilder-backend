import PageBuilder from "../models/PageBuilder.js";
import Store from "../models/Store.js";

/**
 * One-time migrations run on every server start. Safe to re-run — each step
 * checks the current DB state before making changes.
 */

const dropIndexIfExists = async (model, name) => {
  try {
    const indexes = await model.collection.indexes();
    if (!indexes.some((i) => i.name === name)) return;
    await model.collection.dropIndex(name);
    console.log(`[migration] Dropped index '${name}' on ${model.modelName}`);
  } catch (err) {
    if (err?.codeName === "IndexNotFound") return;
    console.error(
      `[migration] Failed to drop '${name}' on ${model.modelName}:`,
      err.message,
    );
  }
};

/**
 * Drop legacy indexes that were created when pages were scoped by websiteId.
 * The Page schema now uses storeIds (many-to-many) and slug is no longer
 * uniquely scoped to a website.
 */
const dropLegacyPageIndexes = async () => {
  await dropIndexIfExists(PageBuilder, "slug_1");
  await dropIndexIfExists(PageBuilder, "websiteId_1_slug_1");
  await dropIndexIfExists(PageBuilder, "websiteId_1");
};

const buildDefaultStoreCode = (websiteId) =>
  `default_${String(websiteId).replaceAll(/[^a-zA-Z0-9_-]/g, "_")}`.slice(0, 80);

/**
 * Find or create a default Store for a given legacy websiteId.
 */
const ensureDefaultStore = async (websiteId, cache) => {
  if (cache.has(websiteId)) return cache.get(websiteId);

  const code = buildDefaultStoreCode(websiteId);
  let store = await Store.findOne({ websiteId, code });
  if (!store) {
    try {
      store = await Store.create({
        websiteId,
        name: "Default Store",
        code,
        status: true,
        position: 0,
      });
      console.log(
        `[migration] Created default Store for websiteId='${websiteId}' (code='${code}')`,
      );
    } catch (err) {
      if (err?.code === 11000) {
        store = await Store.findOne({ websiteId, code });
      } else {
        throw err;
      }
    }
  }

  cache.set(websiteId, store._id);
  return store._id;
};

/**
 * Migrate any pages that still carry the legacy `websiteId` field. For each
 * distinct websiteId we create (or reuse) a default Store under that website
 * and remap the page's `storeIds` to point at it. Then unset the legacy field.
 */
const migrateWebsiteIdToStoreIds = async () => {
  const collection = PageBuilder.collection;
  const cursor = collection.find({
    websiteId: { $exists: true, $nin: [null, ""] },
  });

  const cache = new Map();
  let migrated = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const websiteId = String(doc.websiteId).trim();
    if (!websiteId || websiteId === "_legacy") {
      await collection.updateOne(
        { _id: doc._id },
        { $unset: { websiteId: "" } },
      );
      continue;
    }

    const storeId = await ensureDefaultStore(websiteId, cache);
    const hasStoreIds = Array.isArray(doc.storeIds) && doc.storeIds.length > 0;
    const update = { $unset: { websiteId: "" } };
    if (!hasStoreIds) update.$set = { storeIds: [storeId] };

    await collection.updateOne({ _id: doc._id }, update);
    migrated += 1;
  }

  if (migrated > 0) {
    console.log(
      `[migration] Migrated ${migrated} page(s) from websiteId → storeIds`,
    );
  }
};

/**
 * Ensure Mongoose-declared indexes are materialised on the collection.
 */
const syncIndexes = async () => {
  try {
    await PageBuilder.syncIndexes();
    await Store.syncIndexes();
  } catch (err) {
    console.error("[migration] syncIndexes failed:", err.message);
  }
};

export const runMigrations = async () => {
  await dropLegacyPageIndexes();
  await migrateWebsiteIdToStoreIds();
  await syncIndexes();
};
