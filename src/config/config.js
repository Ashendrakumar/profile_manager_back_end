import dotenv from "dotenv";
dotenv.config();

const config = {
  port: process.env.PORT || 10000,
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  encryptionKey: process.env.ENCRYPTION_KEY,
  portfolioUrl: process.env.PORTFOLIO_URL,
  baseUrl:
    process.env.BASE_URL || `http://localhost:${process.env.PORT || 10000}`,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  emailHost: process.env.EMAIL_HOST,
  emailPort: process.env.EMAIL_PORT,
  emailService: process.env.EMAIL_SERVICE,
  emailSecure: process.env.EMAIL_SECURE,
  brevoApiKey: process.env.BREVO_API_KEY,
  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ||
    `http://localhost:${process.env.PORT || 10000}/api/users/auth/google/callback`,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  // File storage. Defaults to local disk so dev works with no extra setup;
  // set STORAGE_DRIVER=r2 in production to use Cloudflare R2 (free blob store,
  // S3-compatible, no egress fees). Uploaded files survive redeploys, unlike
  // the ephemeral disk on hosts such as Render.
  storage: {
    driver: (process.env.STORAGE_DRIVER || "local").toLowerCase(), // "local" | "r2"
    r2: {
      accountId: process.env.R2_ACCOUNT_ID,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucket: process.env.R2_BUCKET,
      // Optional explicit endpoint; otherwise derived from the account id.
      endpoint: process.env.R2_ENDPOINT,
      // Public base URL for the bucket (r2.dev public URL or a custom domain),
      // e.g. https://pub-xxxxxxxx.r2.dev — used to build download links.
      publicUrl: (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, ""),
    },
  },
};

export default config;
