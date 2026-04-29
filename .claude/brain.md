# Transkriptor — Proje Hafızası

## Amaç
MacBook Air M1'de tamamen lokal çalışan ders ses kaydı transkripsiyon uygulaması.
Audio → whisper.cpp → transcript → .txt / .docx / .pdf

## Teknolojiler
- Frontend: Next.js 14, TypeScript, Tailwind CSS — port 3000
- Backend: Node.js, Express — port 3001
- Transcription: whisper.cpp binary (M1 native)
- Audio dönüştürme: ffmpeg (homebrew)
- DOCX: docx (npm)
- PDF: pdf-lib (npm)
- Storage: local file system

## Mimari
```
Kullanıcı → Next.js UI → Express API → ffmpeg → whisper.cpp → output
```
- AI modeli Node içinde çalışmaz; Node, whisper.cpp binary'yi child_process.spawn ile çalıştırır
- Tüm dosyalar storage/ klasöründe tutulur, cloud'a hiçbir şey gitmez
- Job sistemi in-memory Map ile yönetilir (restart'ta sıfırlanır)

## Klasör Yapısı
```
transkriptor/
├── .claude/brain.md        ← bu dosya
├── .claude/plan.md         ← 10 adım planı
├── frontend/               ← Next.js app
├── backend/                ← Express API
├── storage/                ← runtime dosyalar (gitignore)
│   ├── uploads/            ← ham audio
│   ├── processed/          ← ffmpeg çıktısı (.wav 16kHz mono)
│   ├── transcripts/        ← whisper çıktısı (.txt)
│   └── outputs/            ← final çıktılar (.docx, .pdf)
└── whisper/                ← binary + modeller
    └── models/
```

## Önemli Kurallar
- Kabul edilen dosya tipleri: .mp3, .mp4, .m4a, .wav, .ogg
- Max upload boyutu: 500MB
- Dosyalar UUID ile adlandırılır
- ffmpeg çıktısı: 16kHz, mono, .wav
- whisper modeli: ggml-base.en.bin (İngilizce, ~142MB)
- Kod içinde Türkçe yorum yok
- Uzun log yerine sade tek satır log

## API Endpoint'leri
- POST /api/upload → { jobId }
- GET  /api/jobs/:id → { id, status, progress }
- GET  /api/jobs → tüm joblar
- GET  /api/output/:jobId/txt
- GET  /api/output/:jobId/docx
- GET  /api/output/:jobId/pdf

## Komutlar
```bash
cd backend && npm run dev   # Express sunucu (port 3001)
cd frontend && npm run dev  # Next.js (port 3000)
```

## Tamamlanan Adımlar
- [x] Adım 1 — .claude beyin dosyaları
- [x] Adım 2 — Next.js + Express kurulum
- [x] Adım 3 — Storage + upload endpoint
- [x] Adım 4 — ffmpeg servisi
- [x] Adım 5 — whisper.cpp kurulum
- [x] Adım 6 — whisper Node servisi
- [x] Adım 7 — job sistemi
- [x] Adım 8 — TXT + DOCX output
- [x] Adım 9 — PDF output
- [x] Adım 10 — UI
