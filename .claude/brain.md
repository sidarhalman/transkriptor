# Transkriptor — Proje Hafızası

## Amaç
MacBook Air M1'de tamamen lokal çalışan ders ses kaydı transkripsiyon uygulaması.
Audio → ffmpeg → whisper.cpp → .txt / .docx / .pdf

## Teknolojiler
- Frontend: Next.js 14, TypeScript, Tailwind CSS — port 3000
- Backend: Node.js, Express — port 3001
- Transcription: whisper.cpp binary (`whisper-cli`, homebrew, M1 native)
- Audio dönüştürme: ffmpeg (homebrew)
- AI Cleanup: OpenAI gpt-4o-mini — KOD VAR ama DEVRE DIŞI (jobManager'da yorum satırı)
- DOCX: docx (npm)
- PDF: pdf-lib (npm)
- Storage: local file system

## Mimari
```
Kullanıcı → Next.js UI → Express API → ffmpeg → whisper-cli → output
```
- whisper.cpp Node içinde çalışmaz; `child_process.spawn` ile binary çağrılır
- AI Cleanup devre dışı; kullanıcı transcript'i indirip ChatGPT'ye manuel verir
- UI'da prompt paneli var; cleanup promptu kopyalanabilir textarea ile gösterilir
- Tüm dosyalar `storage/` klasöründe tutulur, cloud'a hiçbir şey gitmiyor
- Job sistemi in-memory Map ile yönetilir (restart'ta sıfırlanır)

## Klasör Yapısı
```
transkriptor/
├── .claude/brain.md        ← bu dosya
├── .claude/plan.md         ← tamamlanan adımlar
├── ARCHITECTURE.md         ← uygulama mimarisi (AI-readable)
├── README.md               ← kurulum talimatları
├── frontend/               ← Next.js app
├── backend/                ← Express API
├── storage/                ← runtime dosyalar (gitignore)
│   ├── uploads/            ← ham audio (UUID adlı)
│   ├── processed/          ← ffmpeg çıktısı (.wav 16kHz mono)
│   ├── transcripts/        ← whisper çıktısı (.txt)
│   └── outputs/            ← final çıktılar (.docx, .pdf)
└── whisper/
    └── models/             ← ggml-*.bin model dosyaları
```

## Önemli Kurallar
- Kabul edilen dosya tipleri: .mp3, .mp4, .m4a, .wav, .ogg
- Upload boyut limiti yok (lokal uygulama)
- Dosyalar UUID ile adlandırılır
- ffmpeg çıktısı: 16kHz, mono, .wav (whisper için zorunlu)
- whisper modeli: ggml-base.en.bin (İngilizce, ~141MB)
- Kod içinde yorum yok
- Sade tek satır log

## Job Modeli
```js
{
  id: string,           // UUID
  status: 'queued' | 'processing' | 'done' | 'error',
  originalName: string, // orijinal dosya adı
  uploadPath: string,   // storage/uploads/<id>.ext
  processedPath: string | null, // storage/processed/<id>.wav
  transcriptPath: string | null, // storage/transcripts/<id>.txt
  text: string | null,          // ham whisper çıktısı
  aiCleanup: boolean,           // AI cleanup istendi mi
  cleanedText: string | null,   // OpenAI düzeltilmiş metin
  error: string | null,
  createdAt: ISO string,
  updatedAt: ISO string,
}
```

## API Endpoint'leri
- `POST /api/upload`           body: `audio` (file), `cleanup` ('true'/'false') → `{ jobId }`
- `GET  /api/jobs/:id`         → job objesi
- `GET  /api/jobs`             → job listesi (yeniden eskiye)
- `GET  /api/output/:id/txt`   → .txt indir (ham transkript)
- `GET  /api/output/:id/docx`  → .docx indir (ham whisper text)
- `GET  /api/output/:id/pdf`   → .pdf indir (ham whisper text)

## Environment Variables
```
PORT=3001
WHISPER_BINARY=whisper-cli
WHISPER_MODEL=../whisper/models/ggml-base.en.bin
OPENAI_API_KEY=sk-...     ← AI cleanup için zorunlu
```

## Komutlar
```bash
cd backend && npm run dev   # Express sunucu (port 3001)
cd frontend && npm run dev  # Next.js (port 3000)
```

## Tamamlanan Adımlar
- [x] Adım 1  — .claude beyin dosyaları
- [x] Adım 2  — Next.js + Express kurulum
- [x] Adım 3  — Storage + upload endpoint
- [x] Adım 4  — ffmpeg servisi
- [x] Adım 5  — whisper.cpp kurulum
- [x] Adım 6  — whisper Node servisi
- [x] Adım 7  — job sistemi
- [x] Adım 8  — TXT + DOCX output
- [x] Adım 9  — PDF output
- [x] Adım 10 — UI
- [x] Sonrası — Upload boyut limiti kaldırıldı
- [x] Sonrası — UI tamamen İngilizce yapıldı
- [x] Sonrası — OpenAI AI Cleanup özelliği eklendi
- [x] Sonrası — AI Cleanup devre dışı bırakıldı (kod korundu, yorum satırı yapıldı)
- [x] Sonrası — UI'a ChatGPT prompt paneli eklendi (kopyalanabilir textarea)
