# AI-Powered Email Assistant

An AI email reply generator that learns a user's writing style from their past emails and drafts context-aware replies. The project has three parts: a Spring Boot backend using Retrieval-Augmented Generation (RAG), a standalone React web app, and a Chrome extension that injects reply generation directly into Gmail.

## Features

- **Style-aware replies** — retrieves a user's own past emails from a vector store and uses them as writing samples so generated replies sound like the user, not a generic assistant.
- **Tone, length, and custom instructions** — optionally override the tone (formal/casual/friendly/professional), desired length (brief/standard/detailed), and add free-form instructions (e.g. "always sign off with X").
- **Graceful fallback** — if no past emails exist for a user yet, the pipeline falls back to neutral, zero-shot generation instead of failing.
- **Gmail integration** — a Chrome extension injects an "AI Reply" button into the Gmail compose toolbar, reads the current thread, and inserts the generated reply directly into the compose box.
- **Standalone web app** — a React UI for generating replies without installing the browser extension.

## Architecture

```
ai-email-assistant/           Spring Boot backend (REST API + RAG pipeline)
ai-email-assistant-frontend/  React + Vite web app
ai-email-assistant-ext/       Chrome extension (Manifest V3) for Gmail
```

### RAG pipeline

1. **Retrieve** — the incoming email is used as a semantic query against a MongoDB Atlas Vector Store, returning the top similar past emails for that user.
2. **Augment** — the retrieved samples are injected into a system prompt (style/tone/structure) alongside a user prompt containing the email to reply to.
3. **Generate** — the assembled prompt is sent to Gemini via Spring AI's `ChatClient`, returning a single reply in the user's own voice.

Past emails are embedded and stored ahead of time via the ingestion endpoints, using Google's `text-embedding-004` model (768-dimensional vectors).

## Tech stack

**Backend**
- Java 25, Spring Boot 4
- Spring AI (Google Gemini chat + embeddings, MongoDB Atlas Vector Store)
- MongoDB Atlas (Vector Search)

**Frontend**
- React 19, Vite, Tailwind CSS, MUI, Axios

**Chrome extension**
- Manifest V3, vanilla JS/CSS

## API

| Method | Endpoint                  | Description                                  |
|--------|---------------------------|-----------------------------------------------|
| POST   | `/api/email/generate`     | Generate a reply for a given email            |
| POST   | `/api/email/ingest`       | Store a single past email as a style sample   |
| POST   | `/api/email/ingest/batch` | Store multiple past emails in one request     |

## Getting started

### Prerequisites

- Java 25 and Maven
- Node.js 18+
- A MongoDB Atlas cluster with a Vector Search index (see below)
- A Google Gemini API key

### 1. Backend

Create `ai-email-assistant/.env` (or set environment variables) with:

```
GEMINI_KEY=your-gemini-api-key
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=email_assistant_db
```

In the Atlas UI, create a collection named `email_embeddings` and a Vector Search index named `vector_index`:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine" },
    { "type": "filter", "path": "metadata.userId" },
    { "type": "filter", "path": "metadata.emailType" }
  ]
}
```

Then run the backend:

```
cd ai-email-assistant
./mvnw spring-boot:run
```

The API starts on `http://localhost:8080`.

### 2. Frontend

```
cd ai-email-assistant-frontend
npm install
npm run dev
```

The web app runs on `http://localhost:5173`.

### 3. Chrome extension

1. Open `chrome://extensions`, enable Developer mode.
2. Click "Load unpacked" and select the `ai-email-assistant-ext` folder.
3. Open Gmail — an "AI Reply" button appears in the compose toolbar (requires the backend running on `localhost:8080`).

## License

Apache License 2.0 — see [LICENSE](LICENSE).
