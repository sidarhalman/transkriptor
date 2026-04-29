# Transkriptor — 10 Adım Planı

## Adım 1 — .claude Beyin Dosyaları ✅
**Hedef:** Proje hafızası kurulsun  
**Dosyalar:** `.claude/brain.md`, `.claude/plan.md`  
**Devam:** `2. adımı uygula: Next.js frontend ve Express backend temel kurulumu`

---

## Adım 2 — Next.js + Express Temel Kurulum
**Hedef:** İki çalışan dev server  
**Dosyalar:**
- `frontend/package.json`, `frontend/next.config.js`, `frontend/tsconfig.json`
- `frontend/src/app/layout.tsx`, `frontend/src/app/page.tsx`
- `backend/package.json`, `backend/src/index.js`
- `.gitignore`

**Devam:** `3. adımı uygula: local storage klasör yapısı ve file upload endpoint`

---

## Adım 3 — Storage + Upload Endpoint
**Hedef:** Dosya yükleme çalışsın  
**Dosyalar:** `backend/src/routes/upload.js`, `backend/src/utils/storage.js`, `storage/` alt klasörleri  
**Notlar:** .mp3/.mp4/.m4a/.wav/.ogg, max 500MB, UUID adlandırma  
**Devam:** `4. adımı uygula: ffmpeg audio normalization servisi`

---

## Adım 4 — ffmpeg Audio Normalization
**Hedef:** Audio → 16kHz mono .wav  
**Dosyalar:** `backend/src/services/ffmpeg.js`, `backend/src/routes/upload.js` güncelle  
**Devam:** `5. adımı uygula: whisper.cpp kurulumu ve manuel test`

---

## Adım 5 — whisper.cpp Kurulum
**Hedef:** whisper.cpp M1'de çalışsın  
**Dosyalar:** `whisper/README.md`, `backend/src/config/whisper.js`  
**Notlar:** `brew install whisper-cpp`, model: ggml-base.en.bin  
**Devam:** `6. adımı uygula: Node'dan whisper.cpp çalıştırma servisi`

---

## Adım 6 — Whisper Node Servisi
**Hedef:** `transcribe(wavPath) → { text, segments }`  
**Dosyalar:** `backend/src/services/whisper.js`  
**Devam:** `7. adımı uygula: transcript job sistemi ve status endpoint`

---

## Adım 7 — Job Sistemi + Status Endpoint
**Hedef:** Upload → queued → processing → done akışı  
**Dosyalar:** `backend/src/services/jobManager.js`, `backend/src/routes/jobs.js`  
**Devam:** `8. adımı uygula: .txt ve .docx output üretimi`

---

## Adım 8 — TXT + DOCX Output
**Hedef:** Transkript → .txt ve .docx dosya  
**Dosyalar:** `backend/src/services/outputGenerator.js`, `backend/src/routes/output.js`  
**Devam:** `9. adımı uygula: PDF output üretimi`

---

## Adım 9 — PDF Output
**Hedef:** Transkript → .pdf dosya  
**Dosyalar:** `backend/src/services/outputGenerator.js` güncelle  
**Notlar:** pdf-lib kullan  
**Devam:** `10. adımı uygula: basit UI — upload, progress, download`

---

## Adım 10 — Basit UI
**Hedef:** Çalışan, işlevsel arayüz  
**Dosyalar:** `frontend/src/app/page.tsx`, `frontend/src/components/UploadZone.tsx`, `frontend/src/components/JobStatus.tsx`  
**Notlar:** Drag & drop, 2sn polling, .txt/.docx/.pdf indirme
