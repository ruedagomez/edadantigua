// ════════════════════════════════════════════════════════
//  LUCAS ESTUDIA — Motor compartido (flashcards, temas, exámenes)
// ════════════════════════════════════════════════════════

// ── SELECTOR DE TEMA (dentro de una asignatura) ─────────────
function selectTema(id, el) {
  document.querySelectorAll('.tema-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('tema-' + id);
  if (panel) panel.classList.add('active');
  document.querySelectorAll('.tema-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
}

// ── FLASHCARDS (retrieval practice) ─────────────────────────
function renderFlashcards(data, containerId) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = data.map((f, i) => `
    <div class="flashcard" onclick="this.classList.toggle('revealed')">
      <div class="fc-badge">Tarjeta ${i + 1}</div>
      <div class="fc-q">${f.q}</div>
      <div class="fc-a">✅ ${f.a}</div>
      <div class="fc-hint">👆 Toca para ver la respuesta</div>
    </div>`).join('');
}

// ── MOTOR DE EXÁMENES ────────────────────────────────────────
// Cada página rellena EXAMS[id] = {questions:[{q,opts,c,fb}, ...]}
// antes de llamar a initExams().
const EXAMS = {};
const examState = {};

// Escapa un texto para insertarlo con seguridad dentro de un literal JS
// de comillas simples que a su vez vive dentro de un atributo HTML con
// comillas dobles (el patrón onclick="fn('...')" de más abajo).
function jsAttrEscape(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;');
}

function renderExam(examId) {
  const exam = EXAMS[examId];
  if (!exam) return;
  const letters = ['A', 'B', 'C', 'D'];
  const c = document.getElementById('q-' + examId);
  if (!c) return;
  c.innerHTML = exam.questions.map((q, qi) => `
    <div class="q-card" id="qcard-${examId}-${qi}">
      <div class="q-num">Pregunta ${qi + 1} de ${exam.questions.length}</div>
      <div class="q-text">${q.q}</div>
      <div class="q-options">
        ${q.opts.map((opt, oi) => `
          <button class="q-opt" id="opt-${examId}-${qi}-${oi}"
            onclick="answerQ('${examId}',${qi},${oi},${q.c},'${jsAttrEscape(q.fb)}')"
            data-qi="${qi}" data-oi="${oi}">
            <span class="opt-letter">${letters[oi]}</span>${opt}
          </button>`).join('')}
      </div>
      <div class="q-feedback" id="fb-${examId}-${qi}"></div>
    </div>`).join('');
}

function answerQ(examId, qi, oi, correct, fb) {
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`opt-${examId}-${qi}-${i}`);
    if (btn) btn.disabled = true;
  }
  const chosen = document.getElementById(`opt-${examId}-${qi}-${oi}`);
  const correctBtn = document.getElementById(`opt-${examId}-${qi}-${correct}`);
  const fbEl = document.getElementById(`fb-${examId}-${qi}`);
  const card = document.getElementById(`qcard-${examId}-${qi}`);

  const isCorrect = oi === correct;
  if (isCorrect) {
    chosen.classList.add('correct');
    examState[examId].correct++;
  } else {
    chosen.classList.add('wrong');
    correctBtn.classList.add('correct');
  }
  fbEl.textContent = (isCorrect ? '✅ ' : '💡 ') + fb;
  fbEl.className = 'q-feedback show ' + (isCorrect ? 'correct' : 'wrong');
  card.classList.add('answered');

  examState[examId].answered++;
  const total = EXAMS[examId].questions.length;
  const pct = Math.round(examState[examId].answered / total * 100);
  document.getElementById(`prog-${examId}`).style.width = pct + '%';
  document.getElementById(`prog-${examId}-lbl`).textContent = `${examState[examId].answered}/${total}`;
}

function submitExam(examId) {
  const total = EXAMS[examId].questions.length;
  const correct = examState[examId].correct;
  const pct = Math.round(correct / total * 100);
  const nota = (correct / total * 10).toFixed(1);
  let msg;
  if (pct >= 90) msg = `🏆 ¡SOBRESALIENTE! ${nota}/10 — ¡Lucas, eres un crack! Ese 10 es tuyo.`;
  else if (pct >= 70) msg = `⭐ ¡Notable! ${nota}/10 — Muy bien, repasa los que fallaste y sube a sobresaliente.`;
  else if (pct >= 50) msg = `😊 Aprobado justo: ${nota}/10 — Hay que repasar más. Vuelve al estudio.`;
  else msg = `💪 ${nota}/10 — Vuelve al bloque de estudio y repasa todo. ¡Tú puedes!`;

  document.getElementById(`score-${examId}-num`).textContent = correct;
  const totalEl = document.getElementById(`score-${examId}-total`);
  if (totalEl) totalEl.textContent = total;
  document.getElementById(`score-${examId}-msg`).textContent = msg;
  document.getElementById(`score-${examId}-bar`).style.width = pct + '%';
  document.getElementById(`score-${examId}`).classList.add('show');
  document.getElementById(`score-${examId}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetExam(examId) {
  examState[examId] = { answered: 0, correct: 0 };
  document.getElementById(`score-${examId}`).classList.remove('show');
  document.getElementById(`prog-${examId}`).style.width = '0%';
  document.getElementById(`prog-${examId}-lbl`).textContent = `0/${EXAMS[examId].questions.length}`;
  renderExam(examId);
}

function selectExamTab(groupId, examId, el) {
  document.querySelectorAll(`.exam-tab[data-group="${groupId}"]`).forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  document.querySelectorAll(`.exam-panel[data-group="${groupId}"]`).forEach(p => p.classList.remove('active'));
  document.getElementById('exam-' + examId).classList.add('active');
}

// ── INICIALIZA TODOS LOS EXÁMENES REGISTRADOS EN EXAMS ──────
function initExams() {
  Object.keys(EXAMS).forEach(id => {
    examState[id] = { answered: 0, correct: 0 };
    renderExam(id);
  });
}

// ════════════════════════════════════════════════════════
//  PRÁCTICA INTERACTIVA — introducir valores, elegir,
//  arrastrar y soltar, clasificar
// ════════════════════════════════════════════════════════

const PRACTICE_DATA = {};

function normalizeAnswer(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/\./g, '')   // quita puntos de miles
    .replace(/,/g, '.')   // coma decimal -> punto
    .replace(/\s+/g, ''); // quita todos los espacios
}

function checkInputAnswer(given, accepted) {
  const g = normalizeAnswer(given);
  const list = Array.isArray(accepted) ? accepted : [accepted];
  return list.some(a => normalizeAnswer(a) === g);
}

// ── INPUT PRACTICE (respuesta corta: número o palabra) ──────
function renderInputPractice(containerId, items) {
  const c = document.getElementById(containerId);
  if (!c) return;
  PRACTICE_DATA[containerId] = items;
  c.innerHTML = items.map((it, i) => `
    <div class="prac-card" id="prac-${containerId}-${i}">
      <div class="prac-q">${it.q}</div>
      <div class="prac-input-row">
        <input type="text" inputmode="${it.numeric === false ? 'text' : 'numeric'}"
          class="prac-input" id="prac-in-${containerId}-${i}"
          placeholder="${it.placeholder || 'Tu respuesta'}" autocomplete="off">
        <button class="prac-check-btn" id="prac-btn-${containerId}-${i}"
          onclick="checkPracticeInput('${containerId}',${i})">Comprobar</button>
      </div>
      <div class="prac-feedback" id="prac-fb-${containerId}-${i}"></div>
    </div>`).join('');
  items.forEach((it, i) => {
    const inp = document.getElementById(`prac-in-${containerId}-${i}`);
    if (inp) inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); checkPracticeInput(containerId, i); }
    });
  });
}

function checkPracticeInput(containerId, i) {
  const it = PRACTICE_DATA[containerId][i];
  const inp = document.getElementById(`prac-in-${containerId}-${i}`);
  const fb = document.getElementById(`prac-fb-${containerId}-${i}`);
  const card = document.getElementById(`prac-${containerId}-${i}`);
  const val = inp.value;
  if (!val.trim()) {
    fb.textContent = '✏️ Escribe una respuesta primero.';
    fb.className = 'prac-feedback show warn';
    return;
  }
  const ok = checkInputAnswer(val, it.a);
  if (ok) {
    fb.textContent = '✅ ' + (it.fb || '¡Correcto!');
    fb.className = 'prac-feedback show correct';
    card.classList.add('prac-correct');
    card.classList.remove('prac-wrong');
    inp.disabled = true;
    document.getElementById(`prac-btn-${containerId}-${i}`).disabled = true;
  } else {
    const shown = Array.isArray(it.a) ? it.a[0] : it.a;
    fb.textContent = `💡 Casi. La respuesta correcta es ${shown}. ${it.fb || ''}`;
    fb.className = 'prac-feedback show wrong';
    card.classList.add('prac-wrong');
  }
}

// ── CHOICE PRACTICE (opción múltiple, sin cronómetro, con reintento) ──
function renderChoicePractice(containerId, items) {
  const c = document.getElementById(containerId);
  if (!c) return;
  PRACTICE_DATA[containerId + '-c'] = items;
  const letters = ['A', 'B', 'C', 'D'];
  c.innerHTML = items.map((it, i) => `
    <div class="prac-card" id="prac-${containerId}-${i}">
      <div class="prac-q">${it.q}</div>
      <div class="q-options">
        ${it.opts.map((opt, oi) => `
          <button class="q-opt" id="pchoice-${containerId}-${i}-${oi}"
            onclick="answerChoicePractice('${containerId}',${i},${oi})">
            <span class="opt-letter">${letters[oi]}</span>${opt}
          </button>`).join('')}
      </div>
      <div class="prac-feedback" id="prac-fb-${containerId}-${i}"></div>
    </div>`).join('');
}

function answerChoicePractice(containerId, i, oi) {
  const it = PRACTICE_DATA[containerId + '-c'][i];
  const fb = document.getElementById(`prac-fb-${containerId}-${i}`);
  const chosen = document.getElementById(`pchoice-${containerId}-${i}-${oi}`);
  if (oi === it.c) {
    chosen.classList.add('correct');
    it.opts.forEach((_, k) => {
      const b = document.getElementById(`pchoice-${containerId}-${i}-${k}`);
      if (b) b.disabled = true;
    });
    fb.textContent = '✅ ' + (it.fb || '¡Correcto!');
    fb.className = 'prac-feedback show correct';
  } else {
    chosen.classList.add('wrong');
    chosen.disabled = true;
    fb.textContent = '💡 Esa no es. Prueba otra opción.';
    fb.className = 'prac-feedback show wrong';
  }
}

// ── ARRASTRAR Y SOLTAR (motor común vía Pointer Events) ──────
// Funciona igual con ratón y con dedo (táctil), a diferencia del
// Drag&Drop HTML5 nativo, que no funciona bien en tablets/móviles.
let DRAG_STATE = null;
const DRAG_CONFIG = {};
const DRAG_KIND = {};

function initDragItem(el) {
  el.addEventListener('pointerdown', e => {
    if (el.classList.contains('placed-locked')) return;
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    DRAG_STATE = {
      el,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      originParent: el.parentElement,
      originNext: el.nextSibling,
    };
    el.classList.add('dragging');
    el.style.width = rect.width + 'px';
    document.body.appendChild(el);
    el.style.position = 'fixed';
    el.style.zIndex = 1000;
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
    moveDragEl(e);
  });
  el.addEventListener('pointermove', e => {
    if (DRAG_STATE && DRAG_STATE.el === el) moveDragEl(e);
  });
  el.addEventListener('pointerup', e => {
    if (DRAG_STATE && DRAG_STATE.el === el) endDrag(e);
  });
  el.addEventListener('pointercancel', e => {
    if (DRAG_STATE && DRAG_STATE.el === el) endDrag(e);
  });
}

function moveDragEl(e) {
  const { el, offsetX, offsetY } = DRAG_STATE;
  el.style.left = (e.clientX - offsetX) + 'px';
  el.style.top = (e.clientY - offsetY) + 'px';
}

function endDrag(e) {
  const { el, originParent, originNext } = DRAG_STATE;
  el.style.position = '';
  el.style.left = '';
  el.style.top = '';
  el.style.zIndex = '';
  el.style.width = '';
  el.classList.remove('dragging');
  el.style.visibility = 'hidden';
  const dropEl = document.elementFromPoint(e.clientX, e.clientY);
  el.style.visibility = '';
  const zone = dropEl ? dropEl.closest('.drop-zone') : null;

  if (zone) {
    const target = zone.querySelector('.bucket-chips') || zone;
    if (zone.dataset.mode !== 'multi') {
      const existing = target.querySelector('.drag-chip');
      if (existing && existing !== el) {
        const bank = document.getElementById(zone.dataset.bank);
        if (bank) bank.appendChild(existing);
      }
    }
    target.appendChild(el);
  } else {
    originParent.insertBefore(el, originNext);
  }
  DRAG_STATE = null;
}

function resetDrag(containerId) {
  const kind = DRAG_KIND[containerId];
  const config = DRAG_CONFIG[containerId];
  if (kind === 'order') renderDragOrder(containerId, config);
  else if (kind === 'match') renderDragMatch(containerId, config);
  else if (kind === 'classify') renderDragClassify(containerId, config);
}

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Ordenar: arrastra fichas a huecos en secuencia.
// config = {items:[{id,label}], correctOrder:[ids...]}
function renderDragOrder(containerId, config) {
  const c = document.getElementById(containerId);
  if (!c) return;
  DRAG_CONFIG[containerId] = config;
  DRAG_KIND[containerId] = 'order';
  const bankId = containerId + '-bank';
  c.innerHTML = `
    <div class="drag-bank" id="${bankId}">
      ${shuffled(config.items).map(it => `<div class="drag-chip" data-id="${it.id}">${it.label}</div>`).join('')}
    </div>
    <div class="drag-slots">
      ${config.correctOrder.map((_, i) => `<div class="drop-zone drag-slot" data-slot="${i}" data-bank="${bankId}"><span class="slot-num">${i + 1}</span></div>`).join('')}
    </div>
    <div class="drag-actions">
      <button class="prac-check-btn" onclick="checkDragOrder('${containerId}')">Comprobar orden</button>
      <button class="reset-btn" onclick="resetDrag('${containerId}')">🔄 Reiniciar</button>
    </div>
    <div class="prac-feedback" id="prac-fb-${containerId}"></div>`;
  c.querySelectorAll('.drag-chip').forEach(initDragItem);
}

function checkDragOrder(containerId) {
  const config = DRAG_CONFIG[containerId];
  const slots = document.querySelectorAll(`#${containerId} .drag-slot`);
  const fb = document.getElementById(`prac-fb-${containerId}`);
  let allFilled = true, allCorrect = true;
  slots.forEach((slot, i) => {
    const chip = slot.querySelector('.drag-chip');
    slot.classList.remove('zone-correct', 'zone-wrong');
    if (!chip) { allFilled = false; return; }
    if (chip.dataset.id === config.correctOrder[i]) slot.classList.add('zone-correct');
    else { slot.classList.add('zone-wrong'); allCorrect = false; }
  });
  if (!allFilled) {
    fb.textContent = '✏️ Coloca todas las fichas en los huecos antes de comprobar.';
    fb.className = 'prac-feedback show warn';
    return;
  }
  if (allCorrect) {
    fb.textContent = '✅ ¡Perfecto! Orden correcto.';
    fb.className = 'prac-feedback show correct';
  } else {
    fb.textContent = '💡 Alguna ficha está mal colocada (en rojo). Arrástrala a otro hueco y comprueba de nuevo.';
    fb.className = 'prac-feedback show wrong';
  }
}

// Emparejar: arrastra fichas de la derecha sobre su pareja de la izquierda.
// config = {pairs:[{id,left,right}]}
function renderDragMatch(containerId, config) {
  const c = document.getElementById(containerId);
  if (!c) return;
  DRAG_CONFIG[containerId] = config;
  DRAG_KIND[containerId] = 'match';
  const bankId = containerId + '-bank';
  c.innerHTML = `
    <div class="drag-match-grid">
      <div class="drag-match-left">
        ${config.pairs.map(p => `<div class="drop-zone drag-matchzone" data-accept="${p.id}" data-bank="${bankId}"><span class="match-left-label">${p.left}</span></div>`).join('')}
      </div>
      <div class="drag-bank drag-bank-vert" id="${bankId}">
        ${shuffled(config.pairs).map(p => `<div class="drag-chip" data-id="${p.id}">${p.right}</div>`).join('')}
      </div>
    </div>
    <div class="drag-actions">
      <button class="prac-check-btn" onclick="checkDragMatch('${containerId}')">Comprobar parejas</button>
      <button class="reset-btn" onclick="resetDrag('${containerId}')">🔄 Reiniciar</button>
    </div>
    <div class="prac-feedback" id="prac-fb-${containerId}"></div>`;
  c.querySelectorAll('.drag-chip').forEach(initDragItem);
}

function checkDragMatch(containerId) {
  const zones = document.querySelectorAll(`#${containerId} .drag-matchzone`);
  const fb = document.getElementById(`prac-fb-${containerId}`);
  let allFilled = true, allCorrect = true;
  zones.forEach(zone => {
    const chip = zone.querySelector('.drag-chip');
    zone.classList.remove('zone-correct', 'zone-wrong');
    if (!chip) { allFilled = false; return; }
    if (chip.dataset.id === zone.dataset.accept) zone.classList.add('zone-correct');
    else { zone.classList.add('zone-wrong'); allCorrect = false; }
  });
  if (!allFilled) {
    fb.textContent = '✏️ Empareja todas las fichas antes de comprobar.';
    fb.className = 'prac-feedback show warn';
    return;
  }
  if (allCorrect) {
    fb.textContent = '✅ ¡Todas las parejas correctas!';
    fb.className = 'prac-feedback show correct';
  } else {
    fb.textContent = '💡 Alguna pareja está mal (en rojo). Corrígela y comprueba otra vez.';
    fb.className = 'prac-feedback show wrong';
  }
}

// Clasificar: arrastra fichas a su grupo (2 o más cubos).
// config = {items:[{id,label,bucket}], buckets:[{id,label,icon}]}
function renderDragClassify(containerId, config) {
  const c = document.getElementById(containerId);
  if (!c) return;
  DRAG_CONFIG[containerId] = config;
  DRAG_KIND[containerId] = 'classify';
  const bankId = containerId + '-bank';
  c.innerHTML = `
    <div class="drag-bank" id="${bankId}">
      ${shuffled(config.items).map(it => `<div class="drag-chip" data-id="${it.id}" data-bucket="${it.bucket}">${it.label}</div>`).join('')}
    </div>
    <div class="drag-buckets">
      ${config.buckets.map(b => `<div class="drop-zone drag-bucket" data-mode="multi" data-accept="${b.id}" data-bank="${bankId}"><div class="bucket-title">${b.icon || ''} ${b.label}</div><div class="bucket-chips"></div></div>`).join('')}
    </div>
    <div class="drag-actions">
      <button class="prac-check-btn" onclick="checkDragClassify('${containerId}')">Comprobar clasificación</button>
      <button class="reset-btn" onclick="resetDrag('${containerId}')">🔄 Reiniciar</button>
    </div>
    <div class="prac-feedback" id="prac-fb-${containerId}"></div>`;
  c.querySelectorAll('.drag-chip').forEach(initDragItem);
}

function checkDragClassify(containerId) {
  const bank = document.getElementById(containerId + '-bank');
  const buckets = document.querySelectorAll(`#${containerId} .drag-bucket`);
  const fb = document.getElementById(`prac-fb-${containerId}`);
  const allFilled = bank.children.length === 0;
  let allCorrect = true;
  buckets.forEach(b => {
    const box = b.querySelector('.bucket-chips');
    box.querySelectorAll('.drag-chip').forEach(chip => {
      if (chip.dataset.bucket === b.dataset.accept) {
        chip.classList.add('chip-correct'); chip.classList.remove('chip-wrong');
      } else {
        chip.classList.add('chip-wrong'); chip.classList.remove('chip-correct');
        allCorrect = false;
      }
    });
  });
  if (!allFilled) {
    fb.textContent = '✏️ Coloca todas las fichas en un grupo antes de comprobar.';
    fb.className = 'prac-feedback show warn';
    return;
  }
  if (allCorrect) {
    fb.textContent = '✅ ¡Clasificación correcta!';
    fb.className = 'prac-feedback show correct';
  } else {
    fb.textContent = '💡 Alguna ficha está en el grupo equivocado (en rojo). Muévela y comprueba otra vez.';
    fb.className = 'prac-feedback show wrong';
  }
}
