# Phase 12 — AI Innovation

## Objective

Add AI-powered features to earn the Innovation category (10pts). The grading criteria suggest semantic AI search for kudos or AI-powered monthly achievement summaries. This also aligns with the JD's emphasis on "AI-Assisted Workflow."

---

## What the Grading Requires

> AI Integration: Semantic AI Search for Kudos or an AI-powered summary of a user's monthly achievements

We implement **both** to maximize impact.

---

## Feature A: Semantic Search for Kudos

### What It Does

Instead of keyword-based search, users type natural language queries and get semantically relevant results.

Example: Searching "helped with deployment" returns kudos mentioning "shipped the release", "production rollout support", "deploy pipeline fix" — even without the exact word "deployment."

### How It Works

1. **On kudo creation**: Generate a vector embedding of the kudo message using an embeddings API
2. **Store embedding**: Save the vector in PostgreSQL using the `pgvector` extension
3. **On search**: Generate embedding of the search query, find nearest neighbors using cosine similarity

### Technical Components

**PostgreSQL pgvector extension:**
- Add migration: `CREATE EXTENSION vector`
- Add column to kudos table: `embedding VECTOR(1536)` (for OpenAI) or `VECTOR(384)` (for smaller models)
- Create index: `CREATE INDEX ON kudos USING ivfflat (embedding vector_cosine_ops)`

**Embedding generation:**
- Option 1: OpenAI `text-embedding-3-small` (1536 dimensions, cheap)
- Option 2: Cloudflare Workers AI `@cf/baai/bge-small-en-v1.5` (384 dimensions, free)
- Generate embedding asynchronously after kudo creation (event handler from Phase 11)

**Search endpoint:**
- `GET /api/kudos/search?q=helped with deployment`
- Generate embedding of query
- Query: `SELECT * FROM kudos ORDER BY embedding <=> query_embedding LIMIT 10`
- Return kudos ranked by semantic similarity

### Backfill

- Migration script to generate embeddings for existing kudos
- Run as a one-time background task

---

## Feature B: AI Monthly Achievement Summary

### What It Does

Generate a professional summary of a user's monthly achievements based on kudos received.

Example output:
> "In January 2026, you received 12 kudos totaling 380 points. Your strongest area was Teamwork (7 kudos), with colleagues particularly appreciating your collaboration on the payment integration project. You were recognized 3 times for Innovation, highlighting your creative approach to solving the caching problem."

### How It Works

1. Collect all kudos received by user in the given month
2. Format as context for an LLM prompt
3. Send to AI model (OpenAI GPT-4o-mini or similar)
4. Cache the result in Redis (past months don't change)
5. Return formatted summary

### Endpoint

- `GET /api/users/me/ai-summary?month=2026-01`
- Response: `{ month, summary, generatedAt, kudosCount, totalPoints }`
- Cache key: `ai-summary:{userId}:{month}`
- Cache TTL: 7 days (past months are immutable)

### Prompt Design

```
You are an HR assistant. Summarize this employee's recognition for {month}.

Kudos received:
- From {sender}: "{message}" (Core Value: {value}, {points} pts)
- From {sender}: "{message}" (Core Value: {value}, {points} pts)
...

Write a professional, encouraging 3-4 sentence summary highlighting:
1. Total kudos and points received
2. Most recognized core value
3. Specific achievements mentioned by colleagues
```

---

## Frontend Implementation

### Search Bar (Feed Page)

- Search input at top of feed page
- Debounced input (300ms) triggers search
- Results replace feed content during active search
- Clear button to return to normal feed
- "Powered by AI" subtle label

### AI Summary (Profile Page)

- "Monthly AI Summary" section on user profile
- Month selector dropdown
- "Generate Summary" button (first time) or cached result
- Loading state while AI generates
- Formatted text display with highlight callouts

---

## Graceful Degradation

This is critical — AI features must not break the app:

- If AI API key is not configured → hide AI features entirely
- If AI service is down → show "AI features temporarily unavailable"
- If embedding generation fails → kudo is still created (search just won't include it)
- Feature flags: `ENABLE_AI_SEARCH=true`, `ENABLE_AI_SUMMARY=true`

---

## Cost Management

- Use cheaper models: `text-embedding-3-small` for embeddings, `gpt-4o-mini` for summaries
- Cache AI summaries aggressively (past months are immutable)
- Rate limit AI endpoints: 5 requests per minute per user
- Set max token limits on summary generation
- Log API usage for monitoring

---

## Tests

**Unit Tests (with mocked AI responses)**:
- Search service: embedding generation, similarity query
- Summary service: prompt construction, response parsing
- Graceful degradation: AI unavailable → proper fallback

**Integration Tests**:
- Search endpoint returns relevant results with pre-computed embeddings
- Summary endpoint returns formatted text
- Missing API key → AI features hidden (not error)

---

## Expected Output

- Semantic search finds relevant kudos by meaning
- AI summary generates professional monthly recap
- Features degrade gracefully without API key
- Cached results for performance
- Rate limiting on AI endpoints

## Grading Points

- **Innovation** (complete): AI integration = full 10 points

## Next

→ Phase 13: DevOps & Deployment
