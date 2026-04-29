# Transkriptor — Değişiklik Geçmişi

## ✅ Adım 1 — .claude Beyin Dosyaları
`.claude/brain.md`, `.claude/plan.md` oluşturuldu.

## ✅ Adım 2 — Next.js + Express Temel Kurulum
`frontend/` (Next.js 14, TS, Tailwind, port 3000) + `backend/` (Express, port 3001) kuruldu.

## ✅ Adım 3 — Storage + Upload Endpoint
`storage/{uploads,processed,transcripts,outputs}/` klasörleri, `POST /api/upload` (multer, UUID adlandırma, tip filtresi).

## ✅ Adım 4 — ffmpeg Audio Normalization
`backend/src/services/ffmpeg.js` — upload sonrası arka planda 16kHz mono WAV üretir.

## ✅ Adım 5 — whisper.cpp Kurulum
`brew install whisper-cpp` (binary: `whisper-cli`), `ggml-base.en.bin` modeli indirildi.

## ✅ Adım 6 — Whisper Node Servisi
`backend/src/services/whisper.js` — `transcribe(wavPath, jobId) → { text, txtPath }`, `-otxt -of` ile dosyaya yazar.

## ✅ Adım 7 — Job Sistemi + Status Endpoint
`backend/src/services/jobManager.js` (in-memory Map, pipeline: ffmpeg→whisper), `GET /api/jobs`, `GET /api/jobs/:id`.

## ✅ Adım 8 — TXT + DOCX Output
`backend/src/services/outputGenerator.js` (generateDocx), `GET /api/output/:id/docx`, `/txt`.

## ✅ Adım 9 — PDF Output
`generatePdf` eklendi (pdf-lib, Helvetica, satır kırma, çok sayfa desteği), `GET /api/output/:id/pdf`.

## ✅ Adım 10 — UI
`UploadZone` (drag&drop, file picker), `JobStatus` (2sn polling, durum badge, indirme butonları), `page.tsx`.

---

## ✅ Sonraki Değişiklikler

### Upload Boyut Limiti Kaldırıldı
`backend/src/routes/upload.js` — `limits: { fileSize }` satırı silindi. Lokal uygulama, disk alanı kullanıcıya ait.

### UI İngilizce Yapıldı
`UploadZone.tsx`, `JobStatus.tsx`, `page.tsx` içindeki tüm Türkçe string'ler İngilizceye çevrildi.

### OpenAI AI Cleanup Özelliği
- `backend/src/services/aiCleanup.js` — `cleanup(text)` → OpenAI `gpt-4o-mini` ile transkript düzeltme
- `jobManager.js` — `aiCleanup: bool`, `cleanedText: string|null` alanları; `run()` içinde whisper sonrası opsiyonel cleanup adımı
- `upload.js` — `req.body.cleanup === 'true'` flag'i okunur
- `outputGenerator.js` — `cleanedText || text` önceliği
- `UploadZone.tsx` — "Transcribe" (mavi) + "Transcribe & AI Cleanup" (mor) iki buton
- `JobStatus.tsx` — `cleanedText` varsa "AI Cleaned" badge gösterir
- `backend/.env` — `OPENAI_API_KEY=` satırı eklendi
