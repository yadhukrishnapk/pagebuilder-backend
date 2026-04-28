const ALLOWED_LINK_TYPES = new Set(["page", "category", "url", "block"]);
const ALLOWED_ITEM_STATUSES = new Set(["active", "inactive"]);
const MAX_DEPTH = 3;

const isObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validateItem = (raw, depth, errors) => {
  if (!isObject(raw)) {
    errors.push("Each item must be an object");
    return null;
  }
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!id) errors.push("Each item must have an id");

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) errors.push(`Item "${id || "?"}" is missing a name`);

  if (!ALLOWED_LINK_TYPES.has(raw.linkType)) {
    errors.push(`Item "${name || id}" has an invalid linkType`);
  }
  // linkValue is intentionally NOT required at save time — items can be saved
  // as drafts with no target, and the storefront filters those out at render
  // time. The admin UI surfaces an "incomplete" indicator instead.

  const status = ALLOWED_ITEM_STATUSES.has(raw.status) ? raw.status : "active";

  if (depth > MAX_DEPTH) {
    errors.push(
      `Item "${name || id}" is nested deeper than the allowed limit (${MAX_DEPTH})`,
    );
  }

  const children = Array.isArray(raw.children)
    ? raw.children
        .map((child) => validateItem(child, depth + 1, errors))
        .filter(Boolean)
    : [];

  return {
    id,
    name,
    linkType: raw.linkType,
    linkValue:
      typeof raw.linkValue === "string" ? raw.linkValue.trim() : "",
    status,
    openInNewTab: !!raw.openInNewTab,
    megaBlockId: raw.megaBlockId ? String(raw.megaBlockId) : null,
    children,
  };
};

/**
 * Validates and normalises the recursive `items` tree on a menu payload.
 * Returns `{ errors: string[], items: NormalisedItem[] }`.
 */
export const validateMenuTree = (rawItems) => {
  const errors = [];
  if (rawItems === undefined) return { errors, items: undefined };
  if (!Array.isArray(rawItems)) {
    return { errors: ["items must be an array"], items: null };
  }
  const items = rawItems
    .map((item) => validateItem(item, 1, errors))
    .filter(Boolean);
  return { errors, items };
};

export const MENU_TREE_MAX_DEPTH = MAX_DEPTH;
