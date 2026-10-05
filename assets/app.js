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
