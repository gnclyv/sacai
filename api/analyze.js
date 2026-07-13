const crypto = require('crypto');
const { analyzeFaceAndSuggest } = require('../lib/grok');
const { getPool } = require('../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Yalnız POST dəstəklənir.' });
    return;
  }

  try {
    const { image, mediaType, hairType, lengthPreference, sessionId } = req.body || {};

    if (!image || !mediaType) {
      res.status(400).json({ error: 'Şəkil (base64) və mediaType tələb olunur.' });
      return;
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

    res.status(200).json({ sessionId: sid, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Naməlum xəta baş verdi.' });
  }
};
