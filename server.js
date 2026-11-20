const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const PASSWORD = process.env.PANEL_PASSWORD || '';
const BUILTIN_DIR = path.join(__dirname, 'audio'); // nagrania dołączone do apki; wgrane z panelu mają pierwszeństwo
const EXTS = ['.mp3', '.wav', '.m4a', '.ogg', '.opus', '.aac', '.flac', '.webm'];
const cues = require('./cues.json');
const ids = new Set(cues.map(c => c.id));

fs.mkdirSync(DATA_DIR, { recursive: true });
const app = express();

if (PASSWORD) {
  app.use((req, res, next) => {
    const h = req.headers.authorization || '';
    const pass = h.startsWith('Basic ') ? Buffer.from(h.slice(6), 'base64').toString().split(':').slice(1).join(':') : null;
    if (pass === PASSWORD) return next();
    res.set('WWW-Authenticate', 'Basic realm="Panel"').status(401).send('Podaj hasło');
  });
}

const pad = id => String(id).padStart(2, '0');
function findIn(dir, id) {
  for (const e of EXTS) {
    const p = path.join(dir, pad(id) + e);
    if (fs.existsSync(p)) return p;
  }
  return null;
}
const findFile = id => findIn(DATA_DIR, id) || findIn(BUILTIN_DIR, id);
function removeFile(id) { let p; while ((p = findIn(DATA_DIR, id))) fs.unlinkSync(p); }

app.get('/api/cues', (req, res) => {
  res.json(cues.map(c => {
    const f = findFile(c.id);
    return { ...c, hasAudio: !!f, v: f ? Math.round(fs.statSync(f).mtimeMs) : 0 };
  }));
});

app.get('/audio/:id', (req, res) => {
  const f = findFile(Number(req.params.id));
  if (!f) return res.status(404).end();
  res.set('Cache-Control', 'no-cache').sendFile(f);
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024, files: 40 } });
// Jeden plik z ?id=N trafia do tej komendy; bez id numer bierzemy z początku nazwy pliku (np. 07_film.mp3).
app.post('/api/upload', upload.array('files'), (req, res) => {
  const forced = req.query.id ? Number(req.query.id) : null;
  const saved = [], skipped = [];
  for (const f of req.files || []) {
    const name = Buffer.from(f.originalname, 'latin1').toString('utf8');
    const ext = path.extname(name).toLowerCase();
    const m = name.match(/^\D*(\d{1,2})/);
    const id = forced || (m ? Number(m[1]) : null);
    if (!EXTS.includes(ext)) { skipped.push(`${name} (format ${ext || '?'} nieobsługiwany)`); continue; }
    if (!ids.has(id)) { skipped.push(`${name} (brak numeru 1–${cues.length} na początku nazwy)`); continue; }
    removeFile(id);
    fs.writeFileSync(path.join(DATA_DIR, pad(id) + ext), f.buffer);
    saved.push(id);
  }
  res.json({ saved, skipped });
});

app.delete('/api/audio/:id', (req, res) => { removeFile(Number(req.params.id)); res.json({ ok: true }); });

app.use(express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => console.log(`Panel działa na porcie ${PORT}, pliki w ${DATA_DIR}`));
