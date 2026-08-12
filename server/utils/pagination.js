const getPagination = (query, defaultLimit = 10) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || defaultLimit, 1),
    100
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

module.exports = getPagination;
