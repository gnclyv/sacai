const { getPool } = require('../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Yalnız GET dəstəklənir.' });
    return;
  }

  const sessionId = req.query.sessionId;
  if (!sessionId) {
    res.status(400).json({ error: 'sessionId tələb olunur.' });
    return;
  }

  const pool = getPool();
  if (!pool) {
    res.status(503).json({ error: 'Baza qoşulu deyil.' });
    return;
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, face_shape, hair_type, length_preference, suggestions, created_at
       FROM analyses WHERE session_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [sessionId]
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
