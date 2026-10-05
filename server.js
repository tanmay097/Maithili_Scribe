require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));
app.use(express.json());

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const filePath = req.file.path + '.webm';
    fs.renameSync(req.file.path, filePath);
    const outDir = 'uploads/out_' + Date.now();
    fs.mkdirSync(outDir, { recursive: true });
    const language = (req.body.language || 'auto').trim();
    const args = [filePath, '--model', 'small', '--output_format', 'txt', '--output_dir', outDir];
    if (language && language !== 'auto') args.push('--language', language);
    args.push('--initial_prompt', 'रोगी चिकित्सक परामर्श: लक्षण, बिमारी, दवाई, बुखार, दर्द, खांसी, सर्दी, मधुमेह, रक्तचाप');
    await new Promise((resolve, reject) => {
      execFile('whisper', args, (err) =>
        err ? reject(err) : resolve()
      );
    });
    const txtFile = fs.readdirSync(outDir).find(f => f.endsWith('.txt'));
    const transcript = fs.readFileSync(path.join(outDir, txtFile), 'utf8').trim();
    fs.rmSync(filePath, { force: true });
    fs.rmSync(outDir, { recursive: true, force: true });
    res.json({ transcript });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Transcription failed: ' + err.message });
  }
});

app.post('/api/extract', async (req, res) => {
  try {
    const { transcript } = req.body;
    const r = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        format: 'json',
        stream: false,
        messages: [
          {
            role: 'system',
            content:
              'You are a medical scribe. The transcript may be in Hindi, Maithili, or another Indian language. Understand it, and extract and return JSON with exactly three keys: "symptoms" (array of strings), "remedies" (array of strings), "medications" (array of strings). Write the extracted items in English. If a section has nothing, return an empty array. Only include items explicitly mentioned.',
          },
          { role: 'user', content: transcript },
        ],
      }),
    });
    const data = await r.json();
    res.json(JSON.parse(data.message.content));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Extraction failed: ' + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Medical Scribe running at http://localhost:${PORT}`));
