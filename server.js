require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.static('public'));

// --- Neon Postgres bağlantısı ---
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

if (!pool) {
  console.warn('Xəbərdarlıq: DATABASE_URL təyin olunmayıb. Tarixçə funksiyası işləməyəcək.');
}

// --- Kömekçi: Google Gemini API-yə şəkil göndərib təhlil al ---
async function analyzeFaceAndSuggest({ base64Image, mediaType, hairType, lengthPreference }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY təyin olunmayıb (.env faylına baxın).');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Gemini 1.5 Flash həm sürətlidir, həm də vizual analizləri (multimodal) dəstəkləyir
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json', // Sərt JSON formatı tələb edirik
    }
  });

  const prompt = `Sən peşəkar bir bərbər/stilistsən. Əlavə olunan şəkildəki insanın üz formasını analiz et
(oval, dəyirmi, kvadrat, ürək-formalı, uzunsov, almaz və s.).
İstifadəçinin saç tipi: ${hairType || 'qeyd olunmayıb'}.
İstədiyi uzunluq: ${lengthPreference || 'qeyd olunmayıb'}.

Yalnız aşağıdaki JSON formatında cavab ver, başqa heç bir mətn, izah və ya kod bloku işarəsi əlavə etmə:
{
  "face_shape": "üz formasının adı (Azərbaycan dilində)",
  "face_shape_note": "üz forması haqqında 1 cümləlik qısa izah",
  "suggestions": [
    {
      "name": "saç modelinin adı",
      "why": "bu modelin niyə uyğun olduğuna dair 1-2 cümlə",
      "maintenance": "aşağı / orta / yüksək baxım tələb edir"
    }
  ]
}
"suggestions" massivində tam olaraq 4 model təklif et.`;

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mediaType
    }
  };

  // Modelə həm mətni, həm də şəkli göndəririk
  const result = await model.generateContent([prompt, imagePart]);
  const rawText = result.response.text();

  if (!rawText) throw new Error('Modeldən mətn cavabı alınmadı.');

  // Əlavə təhlükəsizlik üçün regex yenə də qala bilər, amma Gemini onsuz da təmiz JSON qaytaracaq
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// --- API: şəkli analiz et və nəticəni qaytar + bazaya yaz ---
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

// --- API: bir sessiyanın keçmiş nəticələri ---
app.get('/api/history/:sessionId', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Baza qoşulu deyil.' });
  try {
    const { rows } = await pool.query(
      `SELECT id, face_shape, hair_type, length_preference, suggestions, created_at
       FROM analyses WHERE session_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.params.sessionId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, db: !!pool, ai: !!process.env.GEMINI_API_KEY });
});

app.listen(PORT, () => {
  console.log(`✓ Hairstyle AI server http://localhost:${PORT} ünvanında işləyir`);
});