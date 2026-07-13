// Bu fayl YALNIZ lokal inkişaf (npm start) üçündür.
// Vercel-də /api qovluğundakı serverless funksiyalar işlədilir, bu fayl yox.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { analyzeFaceAndSuggest } = require('./lib/grok');
const { getPool } = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.static('public'));

app.post('/api/analyze', async (req, res) => {
  try {
    const { image, mediaType, hairType, lengthPreference, sessionId } = req.body;

    if (!image || !mediaType) {
      return res.status(400).json({ error: 'Şəkil (base64) və mediaType tələb olunur.' });
    }

    const result = await analyzeFaceAndSuggest({
      base64Image: image,
      mediaType,
      hairType,
      lengthPreference
    });

    const sid = sessionId || crypto.randomUUID();

    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO analyses (session_id, face_shape, hair_type, length_preference, suggestions)
           VALUES ($1, $2, $3, $4, $5)`,
          [sid, result.face_shape, hairType || null, lengthPreference || null, JSON.stringify(result.suggestions)]
        );
      } catch (dbErr) {
        console.error('Baza yazma xətası (nəticə yenə də qaytarılır):', dbErr.message);
      }
    }

    res.json({ sessionId: sid, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Naməlum xəta baş verdi.' });
  }
});

app.get('/api/history', async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: 'Baza qoşulu deyil.' });

  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'sessionId tələb olunur.' });

  try {
    const { rows } = await pool.query(
      `SELECT id, face_shape, hair_type, length_preference, suggestions, created_at
       FROM analyses WHERE session_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [sessionId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, db: !!getPool(), ai: !!process.env.XAI_API_KEY });
});

app.listen(PORT, () => {
  console.log(`✓ Hairstyle AI server http://localhost:${PORT} ünvanında işləyir`);
});
