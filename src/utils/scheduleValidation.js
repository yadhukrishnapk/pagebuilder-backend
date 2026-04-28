const parseDate = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

/**
 * Validate `publishAt` / `expireAt` on the request body. Returns:
 *   { errors: { ... }, normalized: { publishAt?, expireAt? } }
 *
 * Either field may be omitted; passing an empty string clears the value
 * (returns null). `expireAt` must be strictly after `publishAt` if both set.
 */
export const validateSchedule = (body) => {
  const errors = {};
  const normalized = {};

  if ("publishAt" in body) {
    const parsed = parseDate(body.publishAt);
    if (parsed === undefined) errors.publishAt = "Invalid publish date";
    else normalized.publishAt = parsed;
  }

  if ("expireAt" in body) {
    const parsed = parseDate(body.expireAt);
    if (parsed === undefined) errors.expireAt = "Invalid expire date";
    else normalized.expireAt = parsed;
  }

  if (
    normalized.publishAt &&
    normalized.expireAt &&
    normalized.expireAt.getTime() <= normalized.publishAt.getTime()
  ) {
    errors.expireAt = "Expire date must be after publish date";
  }

  return { errors, normalized };
};
