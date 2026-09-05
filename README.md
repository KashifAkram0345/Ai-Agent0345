# NOVA — Personal AI Agent

NOVA is a production-ready personal AI workspace built with Next.js, TypeScript, MongoDB/Mongoose, Google OAuth, and Ollama. It keeps conversations private in your own database and never uses a paid AI API.

## Environment

Copy `.env.example` to `.env.local` and add these values through Replit Secrets in a deployed Replit app:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Your MongoDB connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | OAuth redirect registered in Google Cloud |
| `OLLAMA_BASE_URL` | Local or remote Ollama-compatible endpoint |
| `OLLAMA_MODEL` | Ollama model name, defaults to `llama3.2` |
| `NEXTAUTH_SECRET` | Long random secret for encrypted auth tokens |
| `NEXTAUTH_URL` | Public app URL in production |

The Google callback URL must be `https://YOUR_DOMAIN/api/auth/callback/google`. For local development it is `http://localhost:3000/api/auth/callback/google`.

## Run

```bash
npm install
npm run dev
```

Check the service configuration at `GET /api/health`. A healthy response requires MongoDB, Ollama, and all authentication secrets to be available. Install `llama3.2` on the Ollama host with `ollama pull llama3.2`.

## Safety

The agent has three allowlisted tools: arithmetic, current date/time, and recent conversation history. It does not expose shell execution, arbitrary code execution, or database actions to the model. API routes require an authenticated session, validate MongoDB IDs, cap message sizes, and apply a per-user rate limit.

## Deploy

The app is compatible with Replit or Vercel. Ensure the deployment can reach both MongoDB and the Ollama endpoint, and register the deployment URL as the Google OAuth callback before testing sign-in.