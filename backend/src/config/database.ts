import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      dbName: "kram",
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("[MongoDB] Connection error:", error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log("[MongoDB] Disconnected successfully");
  } catch (error) {
    console.error("[MongoDB] Disconnect error:", error);
  }
}
