// xAI Grok Vision API-yə şəkil göndərib təhlil alan ortaq funksiya

async function analyzeFaceAndSuggest({ base64Image, mediaType, hairType, lengthPreference }) {
  if (!process.env.XAI_API_KEY) {
    throw new Error('XAI_API_KEY təyin olunmayıb (mühit dəyişənlərinə baxın).');
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

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.XAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'grok-4.5',
      max_tokens: 1200,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64Image}` } }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`xAI API xətası (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Modeldən mətn cavabı alınmadı.');

  const cleaned = rawText.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

module.exports = { analyzeFaceAndSuggest };
