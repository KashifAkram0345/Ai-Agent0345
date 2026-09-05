# NOVA — Personal AI Agent

NOVA is a production-ready personal AI workspace built with Next.js, TypeScript, MongoDB/Mongoose, Google OAuth, and OpenRouter. It keeps conversations private in your own database and defaults to OpenRouter’s free model router.

## Environment

Copy `.env.example` to `.env.local` and add these values through Replit Secrets in a deployed Replit app:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Your MongoDB connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | OAuth redirect registered in Google Cloud |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OPENROUTER_MODEL` | OpenRouter model ID, defaults to `openrouter/free` |
| `NEXTAUTH_SECRET` | Long random secret for encrypted auth tokens |
| `NEXTAUTH_URL` | Public app URL in production |

The Google callback URL must be `https://YOUR_DOMAIN/api/auth/callback/google`. For local development it is `http://localhost:3000/api/auth/callback/google`.

## Run

```bash
npm install
npm run dev
```

Check the service configuration at `GET /api/health`. A healthy response requires MongoDB, OpenRouter, and all authentication secrets to be available. `openrouter/free` automatically routes to an available free model; free model availability can change on OpenRouter.

## Safety

The agent has three allowlisted tools: arithmetic, current date/time, and recent conversation history. It does not expose shell execution, arbitrary code execution, or database actions to the model. API routes require an authenticated session, validate MongoDB IDs, cap message sizes, and apply a per-user rate limit.

## Deploy

The app is compatible with Replit or Vercel. Ensure the deployment can reach MongoDB and OpenRouter, add `OPENROUTER_API_KEY` as a server-side environment secret, and register the deployment URL as the Google OAuth callback before testing sign-in.