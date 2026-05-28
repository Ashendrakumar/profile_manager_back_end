const getPaginationParams = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (page < 1 || limit < 1) {
    throw new Error("Invalid pagination parameters");
  }

  if (limit > 100) {
    throw new Error("Limit cannot exceed 100");
  }

  return { page, limit, skip };
};

const buildPaginationResponse = (data, page, limit, total) => {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

const getSortParams = (req, allowedFields) => {
  const sort = req.query.sort || "-createdAt";
  const sortObj = {};
  const fields = sort.split(",");

  fields.forEach((field) => {
    const cleanField = field.startsWith("-") ? field.substring(1) : field;
    if (!allowedFields.includes(cleanField)) {
      throw new Error(`Invalid sort field: ${cleanField}`);
    }
    sortObj[cleanField] = field.startsWith("-") ? -1 : 1;
  });

  return sortObj;
};

export { getPaginationParams, buildPaginationResponse, getSortParams };
