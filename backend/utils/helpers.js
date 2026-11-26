// Escape user text so it can be safely used inside a MongoDB regex.
export const escapeRegex = (text = "") => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Reads ?page=&limit= from the query string with safe defaults.
export const getPagination = (query, defaultLimit = 10) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

export const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.max(Math.ceil(total / limit), 1),
});
