// Google Gemini Vision API-yə şəkil göndərib təhlil alan ortaq funksiya

async function analyzeFaceAndSuggest({ base64Image, mediaType, hairType, lengthPreference }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY təyin olunmayıb (mühit dəyişənlərinə baxın).');
  }

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

  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mediaType, data: base64Image } }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API xətası (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Modeldən mətn cavabı alınmadı.');

  const cleaned = rawText.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

module.exports = { analyzeFaceAndSuggest };
