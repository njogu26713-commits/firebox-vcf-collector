import mongoose from "mongoose";
import { logger } from "./logger";

const MONGODB_URI = process.env["MONGODB_URI"];

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required but was not provided.");
}

export async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI as string);
    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.error({ err }, "Failed to connect to MongoDB");
    process.exit(1);
  }
}

export { mongoose };
