import { requireAuth, setupNavigation } from '../utils/authGuard.js';
import { assessmentApi } from '../api/assessmentApi.js';
import { showToast } from '../utils/notifications.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setupNavigation('assessment');

  let activeAssessment = null;
  let questions = [];
  let currentQIndex = 0;
  let answers = {}; // questionId -> optionId
  let timerInterval = null;
  let secondsRemaining = 900; // 15 mins default

  // Views
  const viewHome = document.getElementById('view-home');
  const viewQuiz = document.getElementById('view-quiz');
  const viewResults = document.getElementById('view-results');

  // Quiz elements
  const btnStart = document.getElementById('btn-start-quiz');
  const qCounter = document.getElementById('quiz-question-counter');
  const qCategory = document.getElementById('quiz-question-category');
  const qText = document.getElementById('quiz-question-text');
  const qOptions = document.getElementById('quiz-options-container');
  const timerEl = document.getElementById('quiz-timer');
  const btnPrev = document.getElementById('btn-prev-question');
  const btnNext = document.getElementById('btn-next-question');
  const btnSubmit = document.getElementById('btn-submit-quiz');
  const historyTbody = document.getElementById('history-tbody');
  const btnRetake = document.getElementById('btn-retake-quiz');

  try {
    const assessments = await assessmentApi.getActiveAssessments();
    if (assessments && assessments.length > 0) {
      activeAssessment = assessments[0];
      document.getElementById('assessment-title').textContent = activeAssessment.title;
      document.getElementById('assessment-desc').textContent = activeAssessment.description;
      document.getElementById('assessment-duration').textContent = `${activeAssessment.durationMinutes} Minutes`;
      secondsRemaining = activeAssessment.durationMinutes * 60;
    }

    await loadHistory();
  } catch (err) {
    showToast(err.message || 'Failed to load assessments', 'error');
  }

  async function loadHistory() {
    try {
      const history = await assessmentApi.getHistory();
      if (!history || history.length === 0) {
        historyTbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No assessment attempts yet. Start one above!</td></tr>`;
        return;
      }

      historyTbody.innerHTML = history.map(h => `
        <tr>
          <td><span class="small text-muted">${new Date(h.attemptedAt).toLocaleString()}</span></td>
          <td class="fw-semibold text-dark">${h.assessment ? h.assessment.title : 'Technical Exam'}</td>
          <td><span class="fw-bold ${h.scorePercentage >= 70 ? 'text-success' : 'text-primary'}">${h.scorePercentage}%</span></td>
          <td><span class="small text-muted">${h.correctAnswers} / ${h.totalQuestions} Correct</span></td>
          <td><span class="badge-pill-custom badge-primary-soft">${h.readinessCategory}</span></td>
          <td class="text-end">
            <button class="btn btn-outline-custom btn-sm btn-review-attempt" data-id="${h.id}">
              Review Results
            </button>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.btn-review-attempt').forEach(btn => {
        btn.addEventListener('click', async () => {
          const attemptId = btn.getAttribute('data-id');
          try {
            const result = await assessmentApi.getAttemptResult(attemptId);
            renderResults(result);
          } catch (err) {
            showToast(err.message || 'Failed to load attempt details', 'error');
          }
        });
      });
    } catch (err) {
      historyTbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Failed to load history.</td></tr>`;
    }
  }

  // Start Assessment
  btnStart.addEventListener('click', async () => {
    if (!activeAssessment) {
      showToast('No active assessment found', 'error');
      return;
    }

    btnStart.disabled = true;
    btnStart.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Loading Questions...';

    try {
      questions = await assessmentApi.getQuestions(activeAssessment.id);
      if (!questions || questions.length === 0) {
        showToast('No questions currently available for this assessment', 'warning');
        btnStart.disabled = false;
        btnStart.textContent = 'Start Assessment';
        return;
      }

      currentQIndex = 0;
      answers = {};
      secondsRemaining = activeAssessment.durationMinutes * 60;

      viewHome.classList.add('d-none');
      viewResults.classList.add('d-none');
      viewQuiz.classList.remove('d-none');

      startTimer();
      renderQuestion();
    } catch (err) {
      showToast(err.message || 'Error loading test questions', 'error');
      btnStart.disabled = false;
      btnStart.textContent = 'Start Assessment';
    }
  });

  function startTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();

    timerInterval = setInterval(() => {
      secondsRemaining--;
      updateTimerDisplay();

      if (secondsRemaining <= 0) {
        clearInterval(timerInterval);
        showToast('Time is up! Submitting answers automatically...', 'warning');
        submitQuiz();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    if (secondsRemaining < 120) {
      timerEl.className = 'badge bg-danger fs-6 px-3 py-1 font-monospace animate-pulse';
    } else {
      timerEl.className = 'badge bg-dark fs-6 px-3 py-1 font-monospace';
    }
  }

  function renderQuestion() {
    const q = questions[currentQIndex];
    qCounter.textContent = `Question ${currentQIndex + 1} of ${questions.length}`;
    qCategory.textContent = q.category || 'General';
    qText.textContent = q.questionText;

    btnPrev.disabled = currentQIndex === 0;
    btnNext.disabled = currentQIndex === questions.length - 1;

    const selectedOptionId = answers[q.id];

    qOptions.innerHTML = (q.options || []).map(opt => `
      <div class="quiz-option-item ${selectedOptionId === opt.id ? 'selected' : ''}" data-opt-id="${opt.id}">
        <div class="option-badge">${opt.optionLetter}</div>
        <div class="flex-grow-1 text-dark">${opt.optionText}</div>
      </div>
    `).join('');

    qOptions.querySelectorAll('.quiz-option-item').forEach(el => {
      el.addEventListener('click', () => {
        const optId = parseInt(el.getAttribute('data-opt-id'));
        answers[q.id] = optId;
        renderQuestion();
      });
    });
  }

  btnPrev.addEventListener('click', () => {
    if (currentQIndex > 0) {
      currentQIndex--;
      renderQuestion();
    }
  });

  btnNext.addEventListener('click', () => {
    if (currentQIndex < questions.length - 1) {
      currentQIndex++;
      renderQuestion();
    }
  });

  btnSubmit.addEventListener('click', () => {
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = questions.length - answeredCount;

    let msg = 'Are you sure you want to submit your assessment?';
    if (unansweredCount > 0) {
      msg = `You have ${unansweredCount} unanswered questions. Submit anyway?`;
    }

    if (confirm(msg)) {
      submitQuiz();
    }
  });

  async function submitQuiz() {
    clearInterval(timerInterval);
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Grading...';

    try {
      const result = await assessmentApi.submitAssessment({
        assessmentId: activeAssessment.id,
        answers: answers
      });

      showToast('Assessment submitted successfully!', 'success');
      renderResults(result);
      await loadHistory();
    } catch (err) {
      showToast(err.message || 'Error submitting assessment', 'error');
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Submit Assessment';
    }
  }

  function renderResults(result) {
    viewHome.classList.add('d-none');
    viewQuiz.classList.add('d-none');
    viewResults.classList.remove('d-none');

    document.getElementById('res-readiness-cat').textContent = result.readinessCategory;
    document.getElementById('res-score-pct').textContent = `${result.scorePercentage}%`;
    document.getElementById('res-score-summary').textContent =
      `You answered ${result.correctAnswers} out of ${result.totalQuestions} questions correctly (${result.incorrectAnswers} incorrect/skipped).`;

    // Category Performance
    const catPerfContainer = document.getElementById('res-category-perf');
    if (result.categoryPerformance) {
      catPerfContainer.innerHTML = Object.entries(result.categoryPerformance).map(([cat, pct]) => `
        <div class="col-sm-4 col-6">
          <div class="p-2 rounded bg-light border text-center">
            <span class="small text-muted d-block text-truncate">${cat}</span>
            <strong class="${pct >= 70 ? 'text-success' : 'text-primary'}">${pct}%</strong>
          </div>
        </div>
      `).join('');
    }

    // Question-by-Question Review
    const reviewList = document.getElementById('res-question-review-list');
    reviewList.innerHTML = (result.questionResults || []).map((item, idx) => `
      <div class="p-4 rounded-3 border ${item.correct ? 'border-success bg-success bg-opacity-10' : 'border-danger bg-danger bg-opacity-10'}">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span class="badge ${item.correct ? 'bg-success' : 'bg-danger'} px-3 py-1">
            Question ${idx + 1} &bull; ${item.correct ? 'Correct' : 'Incorrect'}
          </span>
          <span class="badge bg-light text-dark border">${item.category || 'Core'}</span>
        </div>

        <h6 class="fw-bold text-dark mt-2 mb-3 lh-base">${item.questionText}</h6>

        <div class="row g-2 mb-3 small">
          <div class="col-md-6">
            <div class="p-2 rounded bg-white border">
              <span class="text-muted d-block">Your Answer:</span>
              <strong class="${item.correct ? 'text-success' : 'text-danger'}">${item.selectedOptionText}</strong>
            </div>
          </div>
          <div class="col-md-6">
            <div class="p-2 rounded bg-white border">
              <span class="text-muted d-block">Correct Answer:</span>
              <strong class="text-success">${item.correctOptionText}</strong>
            </div>
          </div>
        </div>

        ${item.explanation ? `
          <div class="p-3 rounded-2 bg-white border-start border-primary border-3 small text-muted">
            <strong class="text-dark d-block mb-1"><i class="bi bi-lightbulb text-warning me-1"></i> Explanation:</strong>
            ${item.explanation}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  btnRetake.addEventListener('click', () => {
    viewResults.classList.add('d-none');
    viewQuiz.classList.add('d-none');
    viewHome.classList.remove('d-none');
    btnStart.disabled = false;
    btnStart.innerHTML = '<i class="bi bi-play-circle-fill fs-5"></i> <span>Start Assessment</span>';
  });
});
