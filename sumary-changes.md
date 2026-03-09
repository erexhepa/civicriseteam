# RAG Summary Changes

This file summarizes the Netlify-native RAG changes made in this project so they can be replicated in another environment.

## Overview

The app was updated to use a Netlify-only RAG setup based on:

- Netlify Functions for indexing/retrieval/status
- Netlify Blobs for storing indexed chunks
- Existing AI server logic updated to retrieve context before generating answers
- Small admin UI to trigger indexing and monitor index freshness

## New/Updated Architecture

1. Indexing flow
- A scheduled function fetches a list of source URLs.
- HTML is cleaned and split into text chunks.
- Chunks are stored in Netlify Blobs with keys like `chunk:<id>`.
- Index metadata is saved under `meta:index`.

2. Retrieval flow
- User query is scored against stored chunks.
- Top matching chunks are returned.
- Retrieved chunks are injected into model context as verified sources.

3. Admin operations
- A route `/rag-admin` was added.
- Button to trigger re-indexing on demand.
- Status panel showing:
  - last indexed timestamp
  - indexed source count
  - indexed chunk count
- Manual "Refresh Status" button to poll status without re-indexing.

## Files Added or Changed

### Core RAG logic
- `src/server/rag.ts`
  - `indexSourcesFromUrls(...)`
  - `retrieveFromRag(...)`
  - `getRagIndexStatus(...)`

### Netlify Functions
- `netlify/functions/crawl-city-sources.ts`
  - Uses `NETLIFY_RAG_SOURCE_URLS` and writes to Blobs.
- `netlify/functions/retrieve-context.ts`
  - Returns top chunks for query/mode/zip context.
- `netlify/functions/rag-index-status.ts`
  - Returns index freshness and counts.

### AI integration
- `src/utils/ai.ts`
  - Calls `retrieveFromRag(...)` before model generation.
  - Adds retrieved context into the system prompt.
  - Uses retrieval output as citations fallback.

### UI and navigation
- `src/routes/rag-admin.tsx`
  - Re-index action + status panel + refresh status.
- `src/components/Sidebar.tsx`
  - Added `RAG Admin` link.
- `src/routes/dispatcher.tsx`
  - Added `RAG Admin` button.

### Config
- `netlify.toml`
  - Functions directory set.
  - Scheduled indexing for `crawl-city-sources` (hourly).
- `.env.example`
  - Added Netlify-native RAG variables.

## Environment Variables

Use these variables:

- `NETLIFY_RAG_SOURCE_URLS`
  - Comma-separated URLs to index.
- `NETLIFY_RAG_STORE`
  - Optional Blob store name (default `civic-rag`).
- `NETLIFY_RAG_TOP_K`
  - Optional retrieval top-k (default `5`).
- `ANTHROPIC_API_KEY`
  - Required for LLM response generation.

Example:

```env
NETLIFY_RAG_SOURCE_URLS=https://www.montgomeryal.gov/,https://www.montgomeryal.gov/services
NETLIFY_RAG_STORE=civic-rag
NETLIFY_RAG_TOP_K=5
ANTHROPIC_API_KEY=your-key
```

## Replication Checklist

1. Install dependency:
- `@netlify/blobs`

2. Add `src/server/rag.ts` with indexing/retrieval/status helpers.

3. Add Netlify functions:
- `crawl-city-sources`
- `retrieve-context`
- `rag-index-status`

4. Wire AI layer to call retrieval before completion.

5. Add `/rag-admin` route with:
- Re-index button
- Refresh status button
- Last indexed info

6. Add navigation link(s) to admin page.

7. Configure scheduler in `netlify.toml`.

8. Set environment variables.

9. Run and verify build:
- `npm run build`

## Notes

- Retrieval is currently lexical scoring over chunk text with optional mode/ZIP boosts.
- This is practical for MVP/hackathon scale.
- For larger scale, you can later extend `src/server/rag.ts` to hybrid/vector retrieval while keeping the same function interfaces.
