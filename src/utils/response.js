class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
  }
}

const sendResponse = (res, statusCode, data, message = "Success") => {
  return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
};

const sendError = (res, statusCode, message = "Error", errors = []) => {
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
  });
};

export { ApiResponse, ApiError, sendResponse, sendError };
