import app from "../artifacts/api-server/src/app";
import { connectMongoDB } from "../artifacts/api-server/src/lib/mongodb";

let databaseConnection: Promise<void> | undefined;

function ensureDatabaseConnection(): Promise<void> {
  databaseConnection ??= connectMongoDB();
  return databaseConnection;
}

export default async function handler(
  request: Parameters<typeof app>[0],
  response: Parameters<typeof app>[1],
): Promise<void> {
  await ensureDatabaseConnection();
  app(request, response);
}
