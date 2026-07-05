import jwt from "jsonwebtoken";
import "dotenv/config";

const JWT_SECRET = process.env.MCP_JWT_SECRET || process.env.JWT_SECRET;
const TOKEN_EXPIRY = "2h";

if (!JWT_SECRET) {
  console.error(
    "[jwtService] WARNING: JWT_SECRET is not set. Set JWT_SECRET or MCP_JWT_SECRET in your environment.",
  );
}

class JwtService {
  constructor({ secret = JWT_SECRET, expiresIn = TOKEN_EXPIRY } = {}) {
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  /**
   * Sign a new authToken for a user.
   * @param {{ userId: string, role?: string }} claims
   * @param {string} [expiresIn] - override the default expiry
   */
  sign({ userId, role }, expiresIn = this.expiresIn) {
    if (!this.secret) {
      throw new Error("Server misconfiguration: JWT_SECRET is not set");
    }
    return jwt.sign({ userId, role }, this.secret, { expiresIn });
  }

  /**
   * Verify a token, returning the decoded payload. Throws on failure —
   * use this directly when you want to catch the error yourself.
   */
  verify(authToken) {
    return jwt.verify(authToken, this.secret);
  }

  /**
   * Verify an authToken and return the payload it grants access to.
   * Throws friendly, tool-facing error messages — mirrors the original
   * requireAuth() behavior so existing catch blocks / errorResult() calls
   * keep working unchanged.
   */
  requireAuth(authToken) {
    if (!authToken) {
      throw new Error(
        "Not logged in. Call the 'login' tool first with your email and password to get an authToken.",
      );
    }
    try {
      return this.verify(authToken); // { userId, role, iat, exp }
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new Error(
          "Your session has expired. Call 'login' again to get a new authToken.",
        );
      }
      throw new Error(
        "Invalid authToken. Call 'login' again to get a new one.",
      );
    }
  }

  /** Decode without verifying — useful for logging/debugging expired tokens. */
  decode(authToken) {
    return jwt.decode(authToken);
  }
}

// Shared singleton — import this everywhere in the MCP server.
export const jwtService = new JwtService();

export default JwtService;
