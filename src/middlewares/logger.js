import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logsDir = path.join(__dirname, "../../logs");

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(
  path.join(logsDir, "access.log"),
  { flags: "a" },
);

const errorLogStream = fs.createWriteStream(
  path.join(logsDir, "error.log"),
  { flags: "a" },
);

// Combined format for all requests
const requestLogger = morgan("combined", { stream: accessLogStream });

// Error logging - only log 4xx and 5xx responses
const errorLogger = morgan("combined", {
  stream: errorLogStream,
  skip: (req, res) => res.statusCode < 400,
});

export { requestLogger, errorLogger };
