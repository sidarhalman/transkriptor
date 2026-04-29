# Transkriptor

Local audio transcription app for macOS Apple Silicon (M1/M2/M3).  
Upload a lecture recording → get a transcript as `.txt`, `.docx`, or `.pdf`. Everything runs offline.

---

## Requirements

- macOS Apple Silicon (M1/M2/M3)
- [Homebrew](https://brew.sh)
- Node.js 18+
- ffmpeg
- whisper-cpp

---

## Installation

### 1. Clone the repo

```bash
git clone <repo-url>
cd transkriptor
```

### 2. Install system dependencies

```bash
brew install ffmpeg
brew install whisper-cpp
```

### 3. Download the Whisper model

```bash
mkdir -p whisper/models
curl -L "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin" \
  -o whisper/models/ggml-base.en.bin
```

> The model is ~141MB and handles English audio. For better accuracy see [Other Models](#other-models).

### 4. Install backend dependencies

```bash
cd backend
npm install
cp .env.example .env
cd ..
```

### 5. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

---

## Running

Open two terminals:

```bash
# Terminal 1 — backend (port 3001)
cd backend
npm run dev
```

```bash
# Terminal 2 — frontend (port 3000)
cd frontend
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## Usage

1. Drag & drop an audio file onto the upload zone (or click to select)
2. Click **Transcribe**
3. Wait for the status to change to **Done** (~1–5s per minute of audio on M1)
4. Download the transcript as **TXT**, **DOCX**, or **PDF**

**Supported formats:** mp3, mp4, m4a, wav, ogg

---

## Project Structure

```
transkriptor/
├── frontend/          Next.js 14 app (port 3000)
├── backend/           Express API (port 3001)
├── storage/           Runtime files (auto-created, gitignored)
│   ├── uploads/       Original uploaded files
│   ├── processed/     ffmpeg output (16kHz mono WAV)
│   ├── transcripts/   Whisper output (.txt)
│   └── outputs/       Final exports (.docx, .pdf)
└── whisper/
    └── models/        Whisper model files (.bin)
```

---

## Other Models

| Model | Size | Notes |
|-------|------|-------|
| `ggml-base.en.bin` | 141 MB | Default — fast, good quality |
| `ggml-small.en.bin` | 488 MB | Better accuracy |
| `ggml-medium.en.bin` | 1.5 GB | High accuracy, slower |

Download from [huggingface.co/ggerganov/whisper.cpp](https://huggingface.co/ggerganov/whisper.cpp/tree/main) and place in `whisper/models/`.

To switch models, update `WHISPER_MODEL` in `backend/.env`:

```env
WHISPER_MODEL=../whisper/models/ggml-small.en.bin
```
