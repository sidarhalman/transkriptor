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
2. Clicks **Transcribe**
3. Waits a few seconds while the file is processed locally
4. Downloads the result as `.txt`, `.docx`, or `.pdf`
5. Optionally copies the ChatGPT cleanup prompt shown on the page and manually pastes transcript into ChatGPT

Nothing leaves the machine. Everything runs locally.

---

## Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Frontend | Next.js | 14 | App Router, TypeScript, Tailwind CSS |
| Backend | Express | 4 | Node.js REST API |
| Transcription | whisper-cli | 1.8.4 | whisper.cpp homebrew binary, M1 Metal GPU |
| Whisper model | ggml-base.en.bin | — | 141 MB, English-only |
| Audio conversion | ffmpeg | 7.x | Homebrew, converts to 16kHz mono WAV |
| AI Cleanup | OpenAI API | gpt-4o-mini | Disabled — code preserved in `aiCleanup.js`, not called |
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

### AI Cleanup (disabled)

`aiCleanup.js` contains the full OpenAI cleanup implementation but it is not called.
The `if (job.aiCleanup)` block in `jobManager.run()` is commented out.
To re-enable: uncomment the block and the `require('./aiCleanup')` import.

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
  aiCleanup: boolean;             // reserved — cleanup is currently disabled
  cleanedText: string | null;     // reserved — always null (cleanup disabled)
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
  - `cleanup` (string) — accepted but ignored; AI cleanup is currently disabled
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
- Content: raw whisper `text`
- Cached: file is generated once and reused

### `GET /api/output/:id/pdf`
- Requires: job status = `'done'`
- Returns: PDF as `.pdf` download
- Content: raw whisper `text`
- Cached: file is generated once and reused

---

## Frontend Components

### `page.tsx`
- Client component
- State: `jobs: Array<{ jobId, filename }>`
- Renders `<UploadZone>`, `<PromptPanel>`, and a list of `<JobStatus>` cards
- Prepends new jobs to top of list on upload

### `UploadZone.tsx`
- Client component
- Props: `onUpload(jobId: string, filename: string) => void`
- State: `selected` (File), `uploading` (bool), `dragging` (bool), `error` (string)
- Single **Transcribe** button (blue)
- Accepted formats validated client-side by extension

### `PromptPanel` (inline in `page.tsx`)
- Static component — no props
- Displays the ChatGPT cleanup prompt from `aiCleanup.js` in a read-only textarea
- "Copy" button copies the full prompt to clipboard
- Always visible on the page; not dependent on job state

### `JobStatus.tsx`
- Client component
- Props: `jobId: string`, `filename: string`
- Polls `GET /api/jobs/:id` every 2 seconds while status is `queued` or `processing`
- Stops polling when status is `done` or `error`
- Shows:
  - Status badge (gray/yellow/green/red)
  - Download buttons (TXT / DOCX / PDF) when done
  - Transcript preview (2 lines of raw whisper text) when done

---

## Environment Variables

File: `backend/.env` (git-ignored, copy from `.env.example`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Express server port |
| `WHISPER_BINARY` | No | `whisper-cli` | Path or name of whisper binary |
| `WHISPER_MODEL` | No | `../whisper/models/ggml-base.en.bin` | Path to GGML model file |
| `OPENAI_API_KEY` | No (cleanup disabled) | — | OpenAI secret key — needed only if cleanup is re-enabled |

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| whisper.cpp via `child_process.spawn`, not a Node binding | Avoids native addon compilation; binary works out-of-the-box on M1 |
| In-memory job store (Map) | Simplest possible state; persistence not needed for local tool |
| ffmpeg converts to 16kHz mono WAV before whisper | whisper.cpp requires exactly this format for best accuracy |
| Output files are generated lazily on first download | Avoids generating files that are never downloaded |
| No upload size limit | Local app — user controls their own disk; large lecture recordings (2-3h) can exceed 500MB |
| Next.js rewrites `/api/*` to backend | Single origin in browser; no CORS issues in production-like setup |
| AI cleanup code kept but disabled | Preserves the implementation for easy re-enable; avoids API costs during normal use |
| Cleanup prompt shown in UI as copyable text | User can manually paste transcript + prompt into ChatGPT without touching the code |

---

## Known Limitations & Future Improvements

- Job store resets on server restart (no persistence)
- Only English transcription (`-l en` hardcoded in whisper service)
- Single whisper job runs at a time (no queue worker, concurrent jobs overlap)
- TXT download always returns original whisper text, not cleaned version
- No authentication (local-only tool, not intended for multi-user)
