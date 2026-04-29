# Transkriptor — Architecture Reference

> This document is the single source of truth for the application's architecture.
> It is kept up to date with every significant change so that any AI assistant
> (or developer) can understand the full system by reading this file alone.

---

## What This App Does

Transkriptor is a **fully local, offline-first** audio transcription desktop web app
that runs on macOS Apple Silicon (M1/M2/M3).

A user:
1. Drops an audio file (lecture recording, meeting, etc.) onto the UI
2. Clicks **Transcribe** (plain) or **Transcribe & AI Cleanup** (OpenAI-enhanced)
3. Waits a few seconds while the file is processed locally
4. Downloads the result as `.txt`, `.docx`, or `.pdf`

Nothing leaves the machine except when the optional AI Cleanup feature is used,
which sends the transcript text to OpenAI for grammar/punctuation correction.

---

## Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Frontend | Next.js | 14 | App Router, TypeScript, Tailwind CSS |
| Backend | Express | 4 | Node.js REST API |
| Transcription | whisper-cli | 1.8.4 | whisper.cpp homebrew binary, M1 Metal GPU |
| Whisper model | ggml-base.en.bin | — | 141 MB, English-only |
| Audio conversion | ffmpeg | 7.x | Homebrew, converts to 16kHz mono WAV |
| AI Cleanup | OpenAI API | gpt-4o-mini | Optional, requires API key |
| DOCX generation | docx | 9.x | npm package |
| PDF generation | pdf-lib | — | npm package, Helvetica standard fonts |
| Storage | Local filesystem | — | `storage/` directory, git-ignored |

---

## Ports

| Service | Port |
|---------|------|
| Frontend (Next.js) | 3000 |
| Backend (Express) | 3001 |

Next.js rewrites `/api/*` → `http://localhost:3001/api/*` so the browser only
ever talks to port 3000.

---

## Repository Structure

```
transkriptor/
│
├── ARCHITECTURE.md          ← this file
├── README.md                ← setup instructions
├── .gitignore
│
├── .claude/
│   ├── brain.md             ← project memory (Turkish, for this codebase's AI context)
│   └── plan.md              ← changelog of completed steps
│
├── frontend/                ← Next.js 14 application
│   ├── package.json
│   ├── next.config.js       ← API proxy rewrite rules
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── app/
│       │   ├── layout.tsx   ← root layout, Tailwind globals
│       │   ├── page.tsx     ← main page, manages job list state
│       │   └── globals.css
│       └── components/
│           ├── UploadZone.tsx   ← drag-drop + file picker + upload buttons
│           └── JobStatus.tsx   ← per-job card with polling + download links
│
├── backend/                 ← Express REST API
│   ├── package.json         ← deps: express, cors, multer, uuid, docx, pdf-lib, openai
│   ├── .env                 ← local secrets (git-ignored)
│   ├── .env.example         ← template
│   └── src/
│       ├── index.js         ← server entry, mounts all routers
│       ├── config/
│       │   └── whisper.js   ← WHISPER_BINARY + WHISPER_MODEL paths from env
│       ├── utils/
│       │   └── storage.js   ← PATHS constants + initStorage()
│       ├── routes/
│       │   ├── upload.js    ← POST /api/upload
│       │   ├── jobs.js      ← GET /api/jobs, GET /api/jobs/:id
│       │   └── output.js    ← GET /api/output/:id/txt|docx|pdf
│       └── services/
│           ├── ffmpeg.js        ← convert(inputPath, jobId) → WAV
│           ├── whisper.js       ← transcribe(wavPath, jobId) → { text, txtPath }
│           ├── aiCleanup.js     ← cleanup(text) → corrected string via OpenAI
│           ├── jobManager.js    ← in-memory job store + full pipeline runner
│           └── outputGenerator.js ← generateDocx(job), generatePdf(job)
│
├── storage/                 ← runtime files, created on startup, git-ignored
│   ├── uploads/             ← original uploaded file (UUID-named)
│   ├── processed/           ← ffmpeg output: <jobId>.wav (16kHz mono PCM)
│   ├── transcripts/         ← whisper output: <jobId>.txt
│   └── outputs/             ← generated exports: <jobId>.docx, <jobId>.pdf
│
└── whisper/
    ├── README.md            ← model download instructions
    └── models/
        └── ggml-base.en.bin ← 141 MB model file (git-ignored)
```

---

## Data Flow

### Standard Transcription (`cleanup=false`)

```
Browser
  │  POST /api/upload  (multipart: audio file, cleanup=false)
  ▼
upload.js (multer)
  │  saves file to storage/uploads/<uuid>.<ext>
  │  creates job in jobManager  { status: 'queued', aiCleanup: false }
  │  responds immediately: { jobId }
  │  calls jobManager.run(jobId) — async, non-blocking
  ▼
jobManager.run()
  │  status → 'processing'
  ├─ ffmpeg.convert()
  │    spawn: ffmpeg -i <upload> -ar 16000 -ac 1 -f wav <processed>.wav
  │    saves: storage/processed/<jobId>.wav
  ├─ whisper.transcribe()
  │    spawn: whisper-cli -m <model> -f <processed>.wav -otxt -of <transcripts>/<jobId>
  │    reads: storage/transcripts/<jobId>.txt
  │    returns: { text, txtPath }
  │  status → 'done'  (text set, cleanedText: null)
  ▼
Browser polls GET /api/jobs/<jobId> every 2 seconds
  │  receives status='done'
  │  shows TXT / DOCX / PDF download buttons
  ▼
GET /api/output/<jobId>/docx  (lazy generation on first request)
  │  outputGenerator.generateDocx(job)
  │    content = job.cleanedText || job.text
  │    writes: storage/outputs/<jobId>.docx
  │  streams file to browser
```

### AI Cleanup Transcription (`cleanup=true`)

Same as above, with one extra step between whisper and status='done':

```
  ├─ whisper.transcribe() → { text }
  ├─ aiCleanup.cleanup(text)
  │    POST OpenAI /v1/chat/completions  (gpt-4o-mini)
  │    system prompt: fix grammar/punctuation, keep meaning, return only transcript
  │    returns: cleanedText string
  │  job.cleanedText = cleanedText
  │  status → 'done'
  ▼
DOCX/PDF use cleanedText; TXT still serves original whisper output
JobStatus card shows "AI Cleaned" purple badge
```

---

## Job Model

All jobs live in a `Map<string, Job>` in `jobManager.js`.
The map is in-memory — it resets on server restart.

```typescript
interface Job {
  id: string;              // UUID, matches filename prefix in storage/
  status: 'queued' | 'processing' | 'done' | 'error';
  originalName: string;    // e.g. "lecture-week3.mp3"
  uploadPath: string;      // absolute path: storage/uploads/<id>.mp3
  processedPath: string | null;   // storage/processed/<id>.wav
  transcriptPath: string | null;  // storage/transcripts/<id>.txt
  text: string | null;            // raw whisper output
  aiCleanup: boolean;             // was AI cleanup requested?
  cleanedText: string | null;     // OpenAI-corrected transcript (null if not requested)
  error: string | null;           // error message if status='error'
  createdAt: string;              // ISO timestamp
  updatedAt: string;              // ISO timestamp
}
```

---

## API Reference

### `POST /api/upload`
- Content-Type: `multipart/form-data`
- Fields:
  - `audio` (file) — accepted: `.mp3 .mp4 .m4a .wav .ogg`; no size limit
  - `cleanup` (string) — `'true'` to enable AI cleanup, anything else = disabled
- Response: `{ jobId: string }`
- Side effect: immediately starts the processing pipeline asynchronously

### `GET /api/jobs/:id`
- Response: full Job object (see Job Model above)

### `GET /api/jobs`
- Response: `Job[]` sorted newest-first

### `GET /api/output/:id/txt`
- Requires: job status = `'done'`
- Returns: raw whisper transcript as `.txt` download
- Note: always the original whisper text, not the cleaned version

### `GET /api/output/:id/docx`
- Requires: job status = `'done'`
- Returns: Word document as `.docx` download
- Content: `cleanedText` if present, otherwise `text`
- Cached: file is generated once and reused

### `GET /api/output/:id/pdf`
- Requires: job status = `'done'`
- Returns: PDF as `.pdf` download
- Content: `cleanedText` if present, otherwise `text`
- Cached: file is generated once and reused

---

## Frontend Components

### `page.tsx`
- Client component
- State: `jobs: Array<{ jobId, filename }>`
- Renders `<UploadZone>` and a list of `<JobStatus>` cards
- Prepends new jobs to top of list on upload

### `UploadZone.tsx`
- Client component
- Props: `onUpload(jobId: string, filename: string) => void`
- State: `selected` (File), `uploading` (bool), `dragging` (bool), `error` (string)
- Two buttons:
  - **Transcribe** (blue) — calls `handleUpload(false)`
  - **Transcribe & AI Cleanup** (purple) — calls `handleUpload(true)`
- Accepted formats validated client-side by extension

### `JobStatus.tsx`
- Client component
- Props: `jobId: string`, `filename: string`
- Polls `GET /api/jobs/:id` every 2 seconds while status is `queued` or `processing`
- Stops polling when status is `done` or `error`
- Shows:
  - Status badge (gray/yellow/green/red)
  - "AI Cleaned" purple badge when `cleanedText` is present
  - Download buttons (TXT / DOCX / PDF) when done
  - Transcript preview (last 2 lines, cleaned if available)

---

## Environment Variables

File: `backend/.env` (git-ignored, copy from `.env.example`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Express server port |
| `WHISPER_BINARY` | No | `whisper-cli` | Path or name of whisper binary |
| `WHISPER_MODEL` | No | `../whisper/models/ggml-base.en.bin` | Path to GGML model file |
| `OPENAI_API_KEY` | For AI Cleanup | — | OpenAI secret key (`sk-...`) |

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| whisper.cpp via `child_process.spawn`, not a Node binding | Avoids native addon compilation; binary works out-of-the-box on M1 |
| In-memory job store (Map) | Simplest possible state; persistence not needed for local tool |
| ffmpeg converts to 16kHz mono WAV before whisper | whisper.cpp requires exactly this format for best accuracy |
| Output files are generated lazily on first download | Avoids generating files that are never downloaded |
| `cleanedText` stored separately from `text` | Preserves original transcript; TXT download always gives raw whisper output |
| No upload size limit | Local app — user controls their own disk; large lecture recordings (2-3h) can exceed 500MB |
| Next.js rewrites `/api/*` to backend | Single origin in browser; no CORS issues in production-like setup |
| AI cleanup is optional and flag-based | Users who don't have/want an API key can still use the full app |

---

## Known Limitations & Future Improvements

- Job store resets on server restart (no persistence)
- Only English transcription (`-l en` hardcoded in whisper service)
- Single whisper job runs at a time (no queue worker, concurrent jobs overlap)
- TXT download always returns original whisper text, not cleaned version
- No authentication (local-only tool, not intended for multi-user)
