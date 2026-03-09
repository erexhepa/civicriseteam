# Civic Copilot Frontend

This directory is the **frontend** of the Civic Copilot monorepo. All commands below are run from this directory (`frontend/`). The chat UI calls the Python backend for LLM; see the repo root README and `backend/README.md`.

---

## Overview

- **Purpose**: Web UI for the Civic Rise chat (career & entrepreneurship copilot for Montgomery citizens). Users send messages; the frontend streams responses from the backend LLM API and optionally persists conversations in Convex.
- **Stack**: React 19, TanStack Start (SSR), TanStack Router, TanStack Store, Vite 7, Tailwind CSS 4. Optional: Convex (conversation persistence), Sentry (error monitoring).
- **Run locally**: Backend must be running (see repo root). Then from `frontend/`: install deps, copy `.env.example` to `.env`, set `VITE_API_URL`, then `yarn dev` (or `npm run dev`). Optionally set `VITE_CONVEX_URL` and run `npx convex dev` for conversation persistence.
- **Production**: Build with `yarn build`; set `VITE_API_URL` and optionally `VITE_CONVEX_URL` in the build environment. Deploy the built app (e.g. Netlify with Base directory = `frontend`). Deploy Convex with `npx convex deploy` if using Convex.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Tech Stack](#tech-stack)
  - [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Local Setup](#local-setup)
  - [Environment Variables](#environment-variables)
  - [Running in Development](#running-in-development)
  - [Running in Production](#running-in-production)
  - [Troubleshooting](#troubleshooting)
- [Convex (Optional)](#convex-optional)
- [Sentry (Optional)](#sentry-optional)
- [Styling](#styling)
- [Routing](#routing)
- [State Management](#state-management)
- [Learn More](#learn-more)

---

## Architecture

### Tech Stack

- **Framework**: React 19 with TanStack Start (Vite 7, SSR)
- **Routing**: TanStack Router v1.157+
- **State**: TanStack Store v0.9+ (local UI state); optional Convex for persistent conversations
- **Styling**: Tailwind CSS 4
- **AI**: LLM via backend API (provider-agnostic: Anthropic, OpenAI, etc.); streaming NDJSON
- **Deploy**: Netlify (TanStack Start plugin); backend deployed separately

### Prerequisites

- [Node.js](https://nodejs.org/) v22.12.0+ (recommended) or v20.9+
- Backend running with `LLM_PROVIDER` and `LLM_API_KEY` set (see repo root or `backend/README.md`)
- (Optional) [Convex](https://convex.dev) account for conversation persistence — see [Convex (Optional)](#convex-optional) and [convex/README.md](convex/README.md)

---

## Project Structure

```
frontend/
├── convex/                 # Convex schema and functions (optional) — see convex/README.md
│   ├── schema.ts           # conversations table
│   ├── conversations.ts    # list, create, addMessage, updateTitle, remove
│   └── _generated/         # Convex generated API (do not edit)
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI (ChatMessage, ChatInput, Sidebar, etc.)
│   ├── routes/            # TanStack Router (file-based); __root.tsx, index.tsx
│   ├── store/             # TanStack Store + Convex integration (store.ts, hooks.ts)
│   ├── utils/             # ai.ts (genAIResponse, getApiBase), etc.
│   ├── convex.tsx         # Convex client provider (reads VITE_CONVEX_URL)
│   ├── router.tsx         # getRouter(), routeTree
│   ├── client.tsx         # Client entry (Sentry, StartClient)
│   ├── ssr.tsx            # Server entry
│   └── styles.css         # Global + Tailwind
├── .env.example            # Example env vars
├── package.json
├── vite.config.js          # Vite + TanStack Start + Netlify plugin
└── README.md               # This file
```

**Key files**

- **src/convex.tsx**: Instantiates Convex client from `VITE_CONVEX_URL` (no trailing slash); wraps app in `ConvexProvider` or skips Convex if URL missing/invalid.
- **src/store/hooks.ts**: `useConversations()` uses Convex queries/mutations when Convex is available, otherwise local store only.
- **src/utils/ai.ts**: `genAIResponse()` POSTs to `${VITE_API_URL}/api/chat/stream` for streaming LLM responses.
- **src/routes/index.tsx**: Main chat page; handleSubmit → add message → processAIResponse (backend stream).

---

## Getting Started

### Local Setup

1. **From repo root**, then frontend:
   ```bash
   cd frontend
   yarn install
   # or: npm install
   ```

2. **Environment**: Copy `.env.example` to `.env` and set at least the backend URL:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`: set `VITE_API_URL` (e.g. `http://localhost:8000`). See [Environment Variables](#environment-variables).

3. **Start backend** (from repo root or backend dir): see root README / `backend/README.md`.

4. **Start frontend**:
   ```bash
   yarn dev
   # or: npm run dev
   ```
   App runs at [http://localhost:3000](http://localhost:3000) (or next available port).

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL (e.g. `http://localhost:8000`). No trailing slash. LLM provider and API key are configured on the backend. |
| `VITE_CONVEX_URL` | No | Convex deployment URL (e.g. `https://xxxx.convex.cloud`). **No trailing slash.** If missing or invalid, app uses local-only state. See [convex/README.md](convex/README.md). |
| `VITE_SENTRY_DSN` | No | Sentry DSN for error monitoring. If missing or placeholder, Sentry is not initialized. |
| `SENTRY_AUTH_TOKEN` | No | For Sentry source maps (build-time). |

Never commit `.env`; it is in `.gitignore`.

### Running in Development

- **Frontend only (no Convex)**:
  ```bash
  cd frontend
  yarn dev
  ```
  Chat works; conversations are in-memory only.

- **Frontend + Convex** (persist conversations):
  1. Set `VITE_CONVEX_URL` in `.env` (Cloud URL from Convex dashboard, no trailing slash).
  2. In one terminal: `cd frontend && npx convex dev` (keep running).
  3. In another: `cd frontend && yarn dev`.

See [convex/README.md](convex/README.md) for Convex setup, schema, and dev/prod details.

### Running in Production

1. **Build** (from `frontend/`):
   ```bash
   yarn build
   ```
   Set in build env: `VITE_API_URL`, and optionally `VITE_CONVEX_URL`, `VITE_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`.

2. **Deploy frontend**: Deploy the built output (e.g. Netlify). In Netlify, set **Base directory** to `frontend` so the root `netlify.toml` and frontend build are used correctly. Set the same env vars in the site’s environment.

3. **Deploy Convex** (if used): From `frontend/`, run `npx convex deploy` (or use your production Convex deployment); set `VITE_CONVEX_URL` in the frontend build/env to that deployment’s Cloud URL.

4. **Backend**: Deploy the Python backend separately and set `VITE_API_URL` to its URL.

### Troubleshooting

- **Node version**: Prefer Node v22.12.0+. Check with `node -v`. Use [nvm](https://github.com/nvm-sh/nvm): `nvm install 22 && nvm use 22`.
- **API / LLM**: Ensure the backend is running and `VITE_API_URL` matches it. LLM provider and API key are in the **backend** `.env` (`LLM_PROVIDER`, `LLM_API_KEY`).
- **Port**: If port 3000 is in use, Vite will use the next available port; check the terminal for the URL.
- **Convex**: WebSocket fails if URL has a trailing slash (double slash in path). Use `https://xxxx.convex.cloud` with no trailing slash. Full guide: [convex/README.md](convex/README.md).

---

## Convex (Optional)

Convex is used to **persist chat conversations** (titles and messages). Without it, the app uses only TanStack Store (in-memory); the chat still works, but conversations are lost on refresh.

- **Configuration**: Set `VITE_CONVEX_URL` in `.env` to your Convex Cloud URL (no trailing slash). If unset or invalid, the app runs without Convex.
- **Dev**: Run `npx convex dev` in `frontend/` while developing to push functions and use the dev deployment.
- **Production**: Run `npx convex deploy` and set `VITE_CONVEX_URL` in the frontend build/env to the production Cloud URL.

**Full documentation**: [convex/README.md](convex/README.md) — schema, functions, configuration, dev and production steps.

---

## Sentry (Optional)

Sentry is used for error monitoring. Initialization is skipped if `VITE_SENTRY_DSN` is missing or looks like a placeholder (e.g. `your-sentry-dsn-here`). To enable:

1. Create a project at [sentry.io](https://sentry.io) and get the DSN.
2. In `.env`: set `VITE_SENTRY_DSN` to the real DSN and, for source maps, `SENTRY_AUTH_TOKEN`.

---

## Styling

The project uses [Tailwind CSS](https://tailwindcss.com/) v4 (PostCSS and Vite plugin in `package.json` and config).

---

## Routing

Routing is file-based with [TanStack Router](https://tanstack.com/router). Routes live under `src/routes/` (e.g. `__root.tsx`, `index.tsx`). The root layout is in `__root.tsx`; use `<Outlet />` for child content. Use `<Link to="...">` for navigation. See [TanStack Router docs](https://tanstack.com/router/latest).

---

## State Management

- **TanStack Store** (`src/store/store.ts`): Global UI state (conversations list, current conversation id, loading, prompts, banner). Created with `createStore()` from `@tanstack/store`.
- **React hooks** (`src/store/hooks.ts`): `useAppState()` and `useConversations()` expose that state and actions. When Convex is available, `useConversations()` syncs with Convex (list, create, addMessage, updateTitle, remove); otherwise only local store is used.

Simple Store example (this project uses `createStore` from `@tanstack/store` v0.9+):

```tsx
import { useStore } from "@tanstack/react-store";
import { createStore } from "@tanstack/store";

const countStore = createStore(0);

function Counter() {
  const count = useStore(countStore);
  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>
        Increment - {count}
      </button>
    </div>
  );
}
```

See [TanStack Store documentation](https://tanstack.com/store/latest).

---

## Learn More

- Repo root README and [backend/README.md](../backend/README.md) for backend and monorepo setup.
- [convex/README.md](convex/README.md) for Convex setup, schema, and usage in this project.
- [TanStack](https://tanstack.com), [Convex](https://docs.convex.dev), [Netlify](https://docs.netlify.com).
