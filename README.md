# NOVA — Personal AI Agent

NOVA is a production-ready personal AI workspace built with Next.js, TypeScript, MongoDB/Mongoose, and OpenRouter. It uses an anonymous browser session to keep conversations separate without requiring a third-party login, and defaults to OpenRouter’s free model router.

## Environment

Copy `.env.example` to `.env.local` and add these values through Replit Secrets in a deployed Replit app:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Your MongoDB connection string |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OPENROUTER_MODEL` | OpenRouter model ID, defaults to `openrouter/free` |
| `OPENROUTER_SITE_URL` | Optional public app URL sent as OpenRouter request metadata |

An anonymous session cookie is created automatically for each browser. No OAuth credentials are required.

## Run

```bash
npm install
npm run dev
```

Check the service configuration at `GET /api/health`. A healthy response requires MongoDB and OpenRouter to be available. `openrouter/free` automatically routes to an available free model; free model availability can change on OpenRouter.

## Safety

The agent has three allowlisted tools: arithmetic, current date/time, and recent conversation history. It does not expose shell execution, arbitrary code execution, or database actions to the model. API routes require an anonymous browser session, validate MongoDB IDs, cap message sizes, and apply a per-user rate limit.

## Deploy

The app is compatible with Replit or Vercel. Ensure the deployment can reach MongoDB and OpenRouter, then add `OPENROUTER_API_KEY` as a server-side environment secret.