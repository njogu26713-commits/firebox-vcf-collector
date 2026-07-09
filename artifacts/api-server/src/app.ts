import path from "path";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import MongoStore from "connect-mongo";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Restrict CORS to explicitly allowed origins only.
// Same-origin requests (no Origin header) are always permitted.
// Set ALLOWED_ORIGINS as a comma-separated list of origins in the environment
// (e.g. "https://myapp.up.railway.app") to enable cross-origin access.
const allowedOrigins = new Set<string>([
  // Explicit list from env (comma-separated, e.g. production Railway domain)
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
    : []),
  // Automatically allow the Replit dev domain in development
  ...(process.env.REPLIT_DEV_DOMAIN
    ? [`https://${process.env.REPLIT_DEV_DOMAIN}`]
    : []),
  // Automatically allow the Railway public domain (set by Railway for all deployments)
  ...(process.env.RAILWAY_PUBLIC_DOMAIN
    ? [`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`]
    : []),
]);

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Same-origin requests have no Origin header — always allow.
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required but was not provided.");
}
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required but was not provided.");
}

app.set("trust proxy", 1);
app.use(
  session({
    name: "connect.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGODB_URI, collectionName: "sessions" }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    },
  }),
);

app.use("/api", router);

// In production, serve the built Vite frontend as static files.
if (process.env.NODE_ENV === "production") {
  const frontendDist = path.resolve(
    process.cwd(),
    "../firebox-dashboard/dist/public",
  );
  app.use(express.static(frontendDist));
  app.use((_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
