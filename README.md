# Civic Copilot (Civic Rise Team)

Monorepo: **frontend** (React) and **backend** (Python FastAPI with LLM agents).

## Structure

- **frontend/** – React app (TanStack Router, Convex, Vite). Chat UI calls the backend for AI.
- **backend/** – FastAPI app (SOLID layout). Endpoints consume LLM agent services (provider-agnostic: Anthropic, OpenAI, etc.).

## Run locally

### Backend (Python)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Set LLM_PROVIDER and LLM_API_KEY in .env (see backend/.env.example)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health: http://localhost:8000/health  
- API: http://localhost:8000/api/chat/stream (POST)

### Frontend (React)

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000 (default) and optionally VITE_CONVEX_URL
npm run dev
```

- App: http://localhost:3000

### Optional: Convex (conversation storage)

From `frontend/`:

```bash
npx convex dev
```

Set `VITE_CONVEX_URL` in `frontend/.env` with the Convex deployment URL.

## Deploy

- **Frontend:** Netlify. In Netlify (Site settings → Build & deploy → Build settings), set **Base directory** = `frontend`. Set `VITE_API_URL` to your backend URL.
- **Backend:** Deploy the `backend/` app to any Python host (Railway, Render, Fly.io, etc.). Set `LLM_PROVIDER` and `LLM_API_KEY` (and CORS origins).

See **frontend/README.md** for full frontend docs and **backend/README.md** for backend setup.
