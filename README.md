# Güzgü — Süni Zəka Saç Modeli Tövsiyəçisi

Şəkil yüklə, süni zəka üz formanı analiz etsin və sənə uyğun saç modellərini təklif etsin.
Nəticələr Neon (neon.tech) Postgres bazasında saxlanılır.

## Texnologiyalar
- **Backend:** Node.js + Express
- **AI:** xAI Grok API (vision — şəkil analizi, model: `grok-4.5`)
- **Baza:** Neon Postgres (serverless)
- **Frontend:** Vanilla HTML/CSS/JS (build alətinə ehtiyac yoxdur)

## Qurulum

### 1. Asılılıqları quraşdır
```bash
npm install
```

### 2. Neon bazası yarat
1. [neon.tech](https://neon.tech) saytında pulsuz hesab aç.
2. Yeni bir layihə (project) yarat.
3. Dashboard-da **Connection string**-i kopyala (formatı: `postgresql://user:pass@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`).

### 3. xAI (Grok) API açarı al
1. [console.x.ai](https://console.x.ai) saytına daxil ol / qeydiyyatdan keç.
2. Yeni API açarı yarat (bəzi hesablara pulsuz sınaq krediti verilir).

### 4. `.env` faylını hazırla
```bash
cp .env.example .env
```
Sonra `.env` faylını açıb `XAI_API_KEY` və `DATABASE_URL` sahələrini öz məlumatlarınla doldur.

### 5. Baza cədvəlini yarat
```bash
npm run db:init
```
Bu, Neon bazasında `analyses` cədvəlini yaradacaq (`db/schema.sql` faylına əsasən).
İstəsən, eyni SQL-i birbaşa Neon-un SQL Editor-ində də işlədə bilərsən.

### 6. Serveri işə sal
```bash
npm start
```
Sayt `http://localhost:3000` ünvanında açılacaq.

## Layihə strukturu
```
hairstyle-ai/
├── server.js            # Express server + Claude API + Neon inteqrasiyası
├── db/
│   ├── schema.sql        # Postgres cədvəl sxemi
│   └── init.js            # Sxemi Neon bazasında yaratmaq üçün skript
├── public/
│   ├── index.html         # Sayfa strukturu
│   ├── style.css           # Dizayn ("Güzgü" atelye konsepti)
│   └── script.js            # Yükləmə, API çağırışları, nəticə render
├── .env.example
└── package.json
```

## Necə işləyir
1. İstifadəçi güzgü-formalı çərçivəyə şəkil yükləyir (sürükləyib buraxma və ya klikləmə ilə).
2. "Analiz et" düyməsinə basdıqda şəkil base64 formatında `/api/analyze` endpoint-inə göndərilir.
3. Server xAI-nin Grok modelinin vision imkanından istifadə edərək üz formasını təyin edir və 4 saç modeli təklif edir (JSON formatında).
4. Nəticə istifadəçiyə göstərilir və eyni zamanda Neon bazasındakı `analyses` cədvəlinə yazılır.
5. Hər brauzer sessiyası unikal `sessionId` ilə izlənir ki, istifadəçi öz keçmiş nəticələrini görə bilsin.

## Qeydlər
- Şəkillər fayl sistemində saxlanılmır — yalnız analiz nəticəsi (üz forması, təkliflər) bazaya yazılır.
- Prodakşna keçirərkən (məsələn Render, Railway, Fly.io) mühit dəyişənlərini (`XAI_API_KEY`, `DATABASE_URL`) həmin platformanın panelində təyin et.
- Model adını (`server.js` içində `model: 'grok-4.5'`) istəyinə görə dəyişə bilərsən (məs. daha ucuz `grok-4-fast-reasoning`).
- xAI-nin API-si OpenAI ilə uyğun formatdadır, ona görə də istəsən eyni kodu `openai` npm paketi ilə də çağıra bilərsən (`baseURL: "https://api.x.ai/v1"`).
