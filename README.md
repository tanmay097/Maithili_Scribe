# Medical Scribe

A local, fully free medical scribe. Record a doctor-patient conversation in the browser; the app transcribes it locally (Whisper) and extracts symptoms, remedies, and medications (Ollama).

## Setup

```bash
npm install
brew services start ollama
ollama pull llama3.2:3b
npm start
```

Open http://localhost:3000

## Stack

- Express backend (`server.js`)
- Local Whisper (`small` model) for transcription
- Ollama `llama3.2:3b` for extracting symptoms / remedies / medications
- Single-page UI in `public/index.html`

## Accuracy notes (Maithili / Indian languages)

This project is fully local — **free, unlimited, and accuracy never degrades with usage.** However, Maithili is an underexplored language for ASR:

- Whisper has no Maithili training; Maithili/Hindi mode on Devanagari audio typically yields ~60–80% word accuracy for clear speech
- Medical vocabulary (drug names, symptom terms) is often transcribed phonetically or incorrectly
- Extraction quality depends on transcript quality (garbage in, garbage out)

Level 1 tweaks applied:
- Whisper model upgraded `base` → `small`
- Hindi/Devanagari `initial_prompt` with common medical vocabulary to bias toward correct terms

To improve further:
- Switch to `--model medium` or `large` in `server.js` (slower, more accurate)
- Fine-tune Whisper on real Maithili audio (requires dataset + GPU + ML expertise)
- Consider the human-in-the-loop workflow: treat output as a draft and have the doctor confirm
