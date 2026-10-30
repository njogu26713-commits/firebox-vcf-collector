import mongoose from "mongoose";
import { logger } from "./logger";

const MONGODB_URI = process.env["MONGODB_URI"];

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required but was not provided.");
}

let connectionPromise: Promise<void> | undefined;

export async function connectMongoDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  connectionPromise ??= mongoose
    .connect(MONGODB_URI as string)
    .then(() => {
      logger.info("Connected to MongoDB");
    })
    .catch((err) => {
      connectionPromise = undefined;
      logger.error({ err }, "Failed to connect to MongoDB");
      throw err;
    });

  return connectionPromise;
}

export { mongoose };
