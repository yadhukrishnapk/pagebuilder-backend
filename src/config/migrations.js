import PageBuilder from "../models/PageBuilder.js";

/**
 * One-time migrations run on every server start. Safe to re-run — each step
 * checks the current DB state before making changes.
 */

/**
 * Drop the legacy global-unique `slug_1` index so a slug can be reused across
 * websites. The Page model declares a compound unique `{ websiteId, slug }`
 * index which Mongoose will (re)build automatically once the old one is gone.
 */
const dropLegacySlugIndex = async () => {
  try {
    const indexes = await PageBuilder.collection.indexes();
    const legacy = indexes.find((i) => i.name === "slug_1");
    if (!legacy) return;
    // Only drop if it's the old single-field unique index on slug.
    const isLegacySlugOnly =
      legacy.unique === true &&
      Object.keys(legacy.key ?? {}).length === 1 &&
      legacy.key.slug === 1;
    if (!isLegacySlugOnly) return;
    await PageBuilder.collection.dropIndex("slug_1");
    console.log("[migration] Dropped legacy index 'slug_1' on pages");
  } catch (err) {
    if (err?.codeName === "IndexNotFound") return;
    console.error("[migration] Failed to drop 'slug_1':", err.message);
  }
};

/**
 * Backfill any rows that still don't have a websiteId so the compound unique
 * index can build. Rows without a websiteId are marked with a sentinel value
 * and logged — the frontend now always sends websiteId, so this is a one-shot
 * cleanup for pre-websiteId rows.
 */
const backfillMissingWebsiteId = async () => {
  try {
    const result = await PageBuilder.updateMany(
      { $or: [{ websiteId: { $exists: false } }, { websiteId: "" }] },
      { $set: { websiteId: "_legacy" } },
    );
    if (result.modifiedCount > 0) {
      console.log(
        `[migration] Backfilled websiteId="_legacy" on ${result.modifiedCount} page(s)`,
      );
    }
  } catch (err) {
    console.error("[migration] Failed to backfill websiteId:", err.message);
  }
};

/**
 * Ensure Mongoose-declared indexes are materialised on the collection.
 * Normally autoIndex handles this in dev — we call explicitly so the compound
 * `{ websiteId, slug }` index is guaranteed even if autoIndex is off.
 */
const syncIndexes = async () => {
  try {
    await PageBuilder.syncIndexes();
  } catch (err) {
    console.error("[migration] syncIndexes failed:", err.message);
  }
};

export const runMigrations = async () => {
  await dropLegacySlugIndex();
  await backfillMissingWebsiteId();
  await syncIndexes();
};
