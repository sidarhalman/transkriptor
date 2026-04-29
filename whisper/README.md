# whisper.cpp Kurulum

## Gereksinimler
- macOS Apple Silicon (M1/M2/M3)
- Homebrew

## Kurulum

```bash
brew install whisper-cpp
```

Binary adı: `whisper-cli`  
Konum: `/opt/homebrew/bin/whisper-cli`

## Model İndirme

```bash
mkdir -p models
curl -L "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin" \
  -o models/ggml-base.en.bin
```

| Model | Boyut | Dil | Not |
|-------|-------|-----|-----|
| ggml-base.en.bin | ~141MB | İngilizce | Varsayılan |
| ggml-small.en.bin | ~488MB | İngilizce | Daha iyi kalite |
| ggml-medium.en.bin | ~1.5GB | İngilizce | Yüksek kalite |

## Manuel Test

```bash
whisper-cli \
  -m models/ggml-base.en.bin \
  -f /path/to/audio.wav \
  --no-timestamps \
  -l en
```

## Notlar
- Giriş formatı: 16kHz, mono, WAV (ffmpeg servisi otomatik dönüştürür)
- GPU: Metal (Apple Silicon) otomatik kullanılır
- `WHISPER_BINARY` ve `WHISPER_MODEL` env değişkenleriyle override edilebilir
