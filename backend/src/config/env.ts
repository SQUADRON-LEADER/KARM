import dotenv from "dotenv";
import path from "path";

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kram",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "kram_super_secret_access_jwt_key_2026_change_in_production",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "kram_super_secret_refresh_jwt_key_2026_change_in_production",
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
};

// Fail clearly if production environment lacks critical secrets
if (env.NODE_ENV === "production") {
  const missing: string[] = [];
  if (!process.env.JWT_ACCESS_SECRET) missing.push("JWT_ACCESS_SECRET");
  if (!process.env.JWT_REFRESH_SECRET) missing.push("JWT_REFRESH_SECRET");
  if (!process.env.MONGODB_URI) missing.push("MONGODB_URI");

  if (missing.length > 0) {
    throw new Error(`CRITICAL: Missing required production environment variables: ${missing.join(", ")}`);
  }
}
