const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const previewImg = document.getElementById('preview-img');
const placeholder = document.getElementById('mirror-placeholder');
const scanLine = document.getElementById('scan-line');
const mirrorCaption = document.getElementById('mirror-caption');
const analyzeBtn = document.getElementById('analyze-btn');
const analyzeBtnText = document.getElementById('analyze-btn-text');
const resultsSection = document.getElementById('results');
const cardsEl = document.getElementById('cards');
const faceShapeTitle = document.getElementById('face-shape-title');
const faceShapeNote = document.getElementById('face-shape-note');
const historySection = document.getElementById('history-section');
const historyList = document.getElementById('history-list');

const SESSION_KEY = 'hairstyle_ai_session_id';
let sessionId = localStorage.getItem(SESSION_KEY);
let currentImage = null; // { base64, mediaType }

// Vercel-dəki Backend-in tam linkini bura qeyd edirik
const API_BASE_URL = 'https://sacai-gamma.vercel.app';

function getSessionId() {
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

// --- Upload interactions ---
dropzone.addEventListener('click', () => fileInput.click());

['dragover', 'dragenter'].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  })
);
['dragleave', 'drop'].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
  })
);
dropzone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files?.[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  if (!file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    const base64 = dataUrl.split(',')[1];
    currentImage = { base64, mediaType: file.type };

    previewImg.src = dataUrl;
    previewImg.classList.add('visible');
    placeholder.classList.add('hidden');
    mirrorCaption.textContent = 'şəkil yükləndi';

    analyzeBtn.disabled = false;
    analyzeBtnText.textContent = 'Analiz et';
  };
  reader.readAsDataURL(file);
}

// --- Analyze ---
analyzeBtn.addEventListener('click', async () => {
  if (!currentImage) return;

  const hairType = document.getElementById('hairType').value;
  const lengthPreference = document.getElementById('lengthPreference').value;

  analyzeBtn.disabled = true;
  analyzeBtnText.textContent = 'Analiz olunur…';
  scanLine.classList.add('active');
  mirrorCaption.textContent = 'süni zəka baxır…';

  try {
    // DOĞRU: Vercel linki + endpoint istifadə olunur
    const res = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: currentImage.base64,
        mediaType: currentImage.mediaType,
        hairType,
        lengthPreference,
        sessionId: getSessionId()
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Xəta baş verdi');

    renderResults(data);
    loadHistory();
    mirrorCaption.textContent = 'nəticə hazırdır';
  } catch (err) {
    console.error(err);
    mirrorCaption.textContent = 'xəta: ' + err.message;
    alert('Analiz zamanı xəta: ' + err.message);
  } finally {
    scanLine.classList.remove('active');
    analyzeBtn.disabled = false;
    analyzeBtnText.textContent = 'Yenidən analiz et';
  }
});

function renderResults(data) {
  resultsSection.hidden = false;
  faceShapeTitle.textContent = data.face_shape || 'Nəticə';
  faceShapeNote.textContent = data.face_shape_note || '';

  cardsEl.innerHTML = '';
  (data.suggestions || []).forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = String(i + 1).padStart(2, '0');
    card.innerHTML = `
      <h3>${escapeHtml(s.name || '')}</h3>
      <p>${escapeHtml(s.why || '')}</p>
      <span class="tag">${escapeHtml(s.maintenance || '')}</span>
    `;
    cardsEl.appendChild(card);
  });

  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadHistory() {
  try {
    // DOĞRU: Vercel linki ilə tarixçəyə müraciət
    const res = await fetch(`${API_BASE_URL}/api/history/${getSessionId()}`);
    if (!res.ok) return;
    const rows = await res.json();
    if (!rows.length) return;

    historySection.hidden = false;
    historyList.innerHTML = '';
    rows.forEach((row) => {
      const div = document.createElement('div');
      div.className = 'history-item';
      const date = new Date(row.created_at).toLocaleString('az-AZ');
      
      // Əgər Cloudinary URL varsa, kiçik bir şəkil ikonası/mətn göstərə bilərik. 
      // Sadəlik üçün əvvəlki strukturunu saxladım.
      div.innerHTML = `<strong>${escapeHtml(row.face_shape)}</strong><span>${date}</span>`;
      historyList.appendChild(div);
    });
  } catch (err) {
    // sessiz uğursuzluq - tarixçə vacib deyil
    console.error('Tarixçə yüklənərkən xəta:', err);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// İlkin yükləmədə tarixçəni göstər
loadHistory();
