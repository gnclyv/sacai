require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai'); 
const { getPool } = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { image, mediaType, hairType, lengthPreference, sessionId } = req.body;
    if (!image) return res.status(400).json({ error: 'Şəkil tələb olunur.' });

    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });
    
    // ... bura Gemini analiz funksiyanı əlavə et ...
    
    const sid = sessionId || crypto.randomUUID();
    res.json({ sessionId: sid, message: "Analiz uğurludur" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ai: !!process.env.GEMINI_API_KEY });
});

// Vercel-də xəta verməməsi üçün yalnız lokalda dinləmə
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✓ Server http://localhost:${PORT} ünvanında işləyir`);
  });
}

// Vercel Serverless üçün vacibdir
module.exports = app;
