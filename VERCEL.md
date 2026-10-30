# Deploying Firebox on Vercel

This repository is configured for Vercel as a Vite frontend plus one Express Vercel Function.

## Vercel project settings

Import the repository into Vercel with the repository root as the project root. The checked-in `vercel.json` supplies the build command and frontend output directory, so no custom framework override is required.

Add these environment variables in the Vercel project settings for Preview and Production:

- `MONGODB_URI`: the MongoDB connection string.
- `SESSION_SECRET`: a long random value used to sign session cookies.
- `NODE_ENV`: `production`.
- `ALLOWED_ORIGINS`: optional; set this only when the API is called from an additional origin, as a comma-separated list.

Vercel supplies the public URL and does not require a manually configured `PORT`.

## Runtime layout

- `artifacts/firebox-dashboard/dist/public` is the Vite build output served by Vercel's CDN.
- `api/index.ts` is the single serverless entrypoint for the Express API.
- `/api/*` requests are routed to the Express app.
- Other routes fall back to `index.html` for the client-side SPA router.

The MongoDB connection is cached across warm function invocations to avoid opening a new connection for every request.

## Deploy

Connect the GitHub repository at [vercel.com/new](https://vercel.com/new), add the environment variables, and deploy. After deployment, test the site and an API route such as `/api/auth/me`.
