const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const SETS_DIR = path.join(__dirname, 'sets');
const EXTS = ['.mp3', '.wav', '.m4a', '.ogg', '.opus', '.aac', '.flac', '.webm'];

// Każdy podkatalog sets/<nazwa> to osobny zestaw: cues.json, meta.json i audio/ z dołączonymi nagraniami.
const sets = {};
for (const name of fs.readdirSync(SETS_DIR).sort()) {
  const dir = path.join(SETS_DIR, name);
  if (!fs.existsSync(path.join(dir, 'cues.json'))) continue;
  const meta = fs.existsSync(path.join(dir, 'meta.json')) ? require(path.join(dir, 'meta.json')) : {};
  const cues = require(path.join(dir, 'cues.json'));
  sets[name] = { name, label: meta.label || name, title: meta.title || name, cues, ids: new Set(cues.map(c => c.id)),
    builtin: path.join(dir, 'audio'), uploads: path.join(DATA_DIR, name) };
  fs.mkdirSync(sets[name].uploads, { recursive: true });
}

const app = express();
const pad = id => String(id).padStart(2, '0');
function findIn(dir, id) {
  for (const e of EXTS) {
    const p = path.join(dir, pad(id) + e);
    if (fs.existsSync(p)) return p;
  }
  return null;
}
// Nagranie wgrane z panelu ma pierwszeństwo przed dołączonym do apki.
const findFile = (s, id) => findIn(s.uploads, id) || findIn(s.builtin, id);
function removeFile(s, id) { let p; while ((p = findIn(s.uploads, id))) fs.unlinkSync(p); }

app.param('set', (req, res, next, name) => {
  if (!Object.prototype.hasOwnProperty.call(sets, name)) return res.status(404).json({ error: 'Nie ma takiego zestawu' });
  req.set_ = sets[name]; next();
});

app.get('/api/sets', (req, res) => res.json(Object.values(sets).map(s => ({ name: s.name, label: s.label, title: s.title, count: s.cues.length }))));

app.get('/api/:set/cues', (req, res) => {
  const s = req.set_;
  res.json(s.cues.map(c => {
    const f = findFile(s, c.id);
    return { ...c, hasAudio: !!f, v: f ? Math.round(fs.statSync(f).mtimeMs) : 0 };
  }));
});

app.get('/audio/:set/:id', (req, res) => {
  const f = findFile(req.set_, Number(req.params.id));
  if (!f) return res.status(404).end();
  res.set('Cache-Control', 'no-cache').sendFile(f);
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024, files: 40 } });
// Jeden plik z ?id=N trafia do tej komendy; bez id numer bierzemy z początku nazwy pliku (np. 07_film.mp3).
app.post('/api/:set/upload', upload.array('files'), (req, res) => {
  const s = req.set_;
  const forced = req.query.id ? Number(req.query.id) : null;
  const saved = [], skipped = [];
  for (const f of req.files || []) {
    const name = Buffer.from(f.originalname, 'latin1').toString('utf8');
    const ext = path.extname(name).toLowerCase();
    const m = name.match(/^\D*(\d{1,2})/);
    const id = forced || (m ? Number(m[1]) : null);
    if (!EXTS.includes(ext)) { skipped.push(`${name} (format ${ext || '?'} nieobsługiwany)`); continue; }
    if (!s.ids.has(id)) { skipped.push(`${name} (brak numeru 1–${s.cues.length} na początku nazwy)`); continue; }
    removeFile(s, id);
    fs.writeFileSync(path.join(s.uploads, pad(id) + ext), f.buffer);
    saved.push(id);
  }
  res.json({ saved, skipped });
});

app.delete('/api/:set/audio/:id', (req, res) => { removeFile(req.set_, Number(req.params.id)); res.json({ ok: true }); });

app.use(express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => console.log(`Panel działa na porcie ${PORT}, zestawy: ${Object.keys(sets).join(', ')}`));
