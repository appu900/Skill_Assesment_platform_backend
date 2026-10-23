// ** opt-in pagination: only applied when the client sends ?page=, so existing callers keep getting full lists
const getPagination = (query = {}) => {
  if (query.page === undefined) {
    return null;
  }
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  return { skip: (page - 1) * limit, limit };
};

const applyPagination = (mongooseQuery, pagination) =>
  pagination ? mongooseQuery.skip(pagination.skip).limit(pagination.limit) : mongooseQuery;

export { getPagination, applyPagination };
