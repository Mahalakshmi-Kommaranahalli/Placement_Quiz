/**
 * ============================================================================
 * CSE PLACEMENT QUIZ ARENA - APPLICATION ENGINE
 * 5th Semester CSE | Student Forum Activity
 * Mobile-First & Responsive (Phone, Tablet, Desktop)
 * Strict Tab-Switching Proctoring & Live Admin Broadcasting
 * ============================================================================
 */

(function () {
  'use strict';

  // Storage Keys
  const STORAGE_KEYS = {
    ACTIVE_ATTEMPT: 'cse_quiz_arena_active_attempt',
    ATTEMPT_HISTORY: 'cse_quiz_arena_history',
    ADMIN_FEED: 'cse_quiz_arena_live_feed'
  };

  const TOTAL_QUESTIONS = QUIZ_QUESTIONS.length; // 30
  const TOTAL_TIME_SECONDS = 30 * 60; // 30 minutes = 1800s

  // BroadcastChannel for Live Sync with Faculty Admin Portal
  let adminChannel = null;
  try {
    adminChannel = new BroadcastChannel('cse_placement_quiz_arena_channel');
  } catch (e) {
    console.warn('BroadcastChannel not supported in this environment:', e);
  }

  // Application State
  const state = {
    studentName: '',
    studentUSN: '',
    currentQuestionIndex: 0, // 0-based (0 to 29)
    userAnswers: {},         // { [questionId]: 'A' | 'B' | 'C' | 'D' }
    visitedQuestions: new Set([1]), // 1-based question IDs
    remainingSeconds: TOTAL_TIME_SECONDS,
    timerInterval: null,
    isSubmitted: false,
    isDisqualified: false,
    violationTimestamp: null,
    startTime: null,
    endTime: null,
    warned5Min: false,
    warned1Min: false,
    activeReviewFilter: 'all',
    allExplanationsOpen: false
  };

  // DOM Elements Cache
  const DOM = {
    // Screens
    registrationScreen: document.getElementById('registrationScreen'),
    quizScreen: document.getElementById('quizScreen'),
    violationScreen: document.getElementById('violationScreen'),
    resultScreen: document.getElementById('resultScreen'),

    // Toast
    toastContainer: document.getElementById('toastContainer'),

    // Registration Form
    registrationForm: document.getElementById('registrationForm'),
    studentNameInput: document.getElementById('studentNameInput'),
    studentUSNInput: document.getElementById('studentUSNInput'),
    nameError: document.getElementById('nameError'),
    usnError: document.getElementById('usnError'),
    startQuizBtn: document.getElementById('startQuizBtn'),
    viewHistoryLandingBtn: document.getElementById('viewHistoryLandingBtn'),
    resumeSessionBanner: document.getElementById('resumeSessionBanner'),
    resumeSessionDetails: document.getElementById('resumeSessionDetails'),
    resumeTestBtn: document.getElementById('resumeTestBtn'),

    // Quiz Header
    headerCandidateName: document.getElementById('headerCandidateName'),
    headerCandidateUSN: document.getElementById('headerCandidateUSN'),
    liveTimerBadge: document.getElementById('liveTimerBadge'),
    timerDisplay: document.getElementById('timerDisplay'),
    topSubmitBtn: document.getElementById('topSubmitBtn'),

    // Quiz Workspace
    questionCounterPill: document.getElementById('questionCounterPill'),
    questionTopicPill: document.getElementById('questionTopicPill'),
    answeredCounterText: document.getElementById('answeredCounterText'),
    quizProgressBar: document.getElementById('quizProgressBar'),
    qSequencePrefix: document.getElementById('qSequencePrefix'),
    qStatement: document.getElementById('qStatement'),
    optionsGrid: document.getElementById('optionsGrid'),
    prevBtn: document.getElementById('prevBtn'),
    clearBtn: document.getElementById('clearBtn'),
    nextBtn: document.getElementById('nextBtn'),
    nextBtnText: document.getElementById('nextBtnText'),

    // Mobile Phone Sticky Bottom Bar
    mobileFooterPrevBtn: document.getElementById('mobileFooterPrevBtn'),
    mobileFooterNextBtn: document.getElementById('mobileFooterNextBtn'),
    mobileFooterNextText: document.getElementById('mobileFooterNextText'),
    mobileFooterPaletteBtn: document.getElementById('mobileFooterPaletteBtn'),
    mobileFooterPaletteText: document.getElementById('mobileFooterPaletteText'),
    mobileFooterCountBadge: document.getElementById('mobileFooterCountBadge'),
    mobileFooterClearBtn: document.getElementById('mobileFooterClearBtn'),

    // Palette & Bottom Sheet
    paletteSidebar: document.getElementById('paletteSidebar'),
    paletteOverlayBackdrop: document.getElementById('paletteOverlayBackdrop'),
    paletteGrid: document.getElementById('paletteGrid'),
    paletteAnsweredCount: document.getElementById('paletteAnsweredCount'),
    paletteVisitedCount: document.getElementById('paletteVisitedCount'),
    paletteUnvisitedCount: document.getElementById('paletteUnvisitedCount'),
    sidebarSubmitBtn: document.getElementById('sidebarSubmitBtn'),
    mobilePaletteCloseBtn: document.getElementById('mobilePaletteCloseBtn'),

    // Submit Modal
    submitConfirmationModal: document.getElementById('submitConfirmationModal'),
    confirmAnsweredVal: document.getElementById('confirmAnsweredVal'),
    confirmUnansweredVal: document.getElementById('confirmUnansweredVal'),
    confirmTimeLeftVal: document.getElementById('confirmTimeLeftVal'),
    unansweredWarningAlert: document.getElementById('unansweredWarningAlert'),
    cancelSubmitModalBtn: document.getElementById('cancelSubmitModalBtn'),
    finalizeSubmitModalBtn: document.getElementById('finalizeSubmitModalBtn'),

    // Violation Screen Elements
    violationCandidateName: document.getElementById('violationCandidateName'),
    violationCandidateUSN: document.getElementById('violationCandidateUSN'),
    violationTimeVal: document.getElementById('violationTimeVal'),
    violationScoreVal: document.getElementById('violationScoreVal'),
    viewViolationScorecardBtn: document.getElementById('viewViolationScorecardBtn'),
    returnHomeViolationBtn: document.getElementById('returnHomeViolationBtn'),

    // Result Dashboard
    resultCardTypeChip: document.getElementById('resultCardTypeChip'),
    resultStudentName: document.getElementById('resultStudentName'),
    resultStudentUSN: document.getElementById('resultStudentUSN'),
    resultAttemptTimestamp: document.getElementById('resultAttemptTimestamp'),
    resultDuration: document.getElementById('resultDuration'),
    scoreRingProgress: document.getElementById('scoreRingProgress'),
    resultScoreNum: document.getElementById('resultScoreNum'),
    resultPercentageNum: document.getElementById('resultPercentageNum'),
    verdictBanner: document.getElementById('verdictBanner'),
    verdictEmoji: document.getElementById('verdictEmoji'),
    verdictHeading: document.getElementById('verdictHeading'),
    verdictDescription: document.getElementById('verdictDescription'),
    metricTotalScore: document.getElementById('metricTotalScore'),
    metricAccuracy: document.getElementById('metricAccuracy'),
    metricCorrectAnswers: document.getElementById('metricCorrectAnswers'),
    metricIncorrectAnswers: document.getElementById('metricIncorrectAnswers'),
    metricSkippedAnswers: document.getElementById('metricSkippedAnswers'),
    retakeQuizBtn: document.getElementById('retakeQuizBtn'),
    viewHistoryFromResultsBtn: document.getElementById('viewHistoryFromResultsBtn'),
    printScorecardBtn: document.getElementById('printScorecardBtn'),

    // Review Section
    filterCountAll: document.getElementById('filterCountAll'),
    filterCountCorrect: document.getElementById('filterCountCorrect'),
    filterCountIncorrect: document.getElementById('filterCountIncorrect'),
    filterCountUnanswered: document.getElementById('filterCountUnanswered'),
    reviewCardsList: document.getElementById('reviewCardsList'),
    toggleAllExplanationsBtn: document.getElementById('toggleAllExplanationsBtn'),

    // History Modal
    historyModal: document.getElementById('historyModal'),
    closeHistoryModalBtn: document.getElementById('closeHistoryModalBtn'),
    closeHistoryFooterBtn: document.getElementById('closeHistoryFooterBtn'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    histTotalAttemptsCount: document.getElementById('histTotalAttemptsCount'),
    histHighestScoreVal: document.getElementById('histHighestScoreVal'),
    histAvgAccuracyVal: document.getElementById('histAvgAccuracyVal'),
    historyTableContainer: document.getElementById('historyTableContainer')
  };

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  function initApp() {
    checkActiveSession();
    bindEvents();
    renderPaletteButtons();
  }

  // ==========================================================================
  // BROADCAST TO FACULTY ADMIN PORTAL
  // ==========================================================================

  function broadcastToAdmin(type, payload = {}) {
    const message = {
      type: type,
      studentName: state.studentName,
      studentUSN: state.studentUSN,
      timestamp: new Date().toISOString(),
      currentQuestion: state.currentQuestionIndex + 1,
      answeredCount: Object.keys(state.userAnswers).length,
      remainingSeconds: state.remainingSeconds,
      ...payload
    };

    if (adminChannel) {
      try {
        adminChannel.postMessage(message);
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_FEED, JSON.stringify(message));
    } catch (e) {
      // storage quota
    }
  }

  // ==========================================================================
  // SCREEN SWITCHING
  // ==========================================================================

  function showScreen(screenElement) {
    [DOM.registrationScreen, DOM.quizScreen, DOM.violationScreen, DOM.resultScreen].forEach(scr => {
      scr.classList.remove('active');
    });
    screenElement.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================================================
  // TOAST NOTIFICATIONS
  // ==========================================================================

  function showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'warning') icon = '⚠️';
    if (type === 'critical') icon = '🚨';
    if (type === 'success') icon = '✅';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
    `;

    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  // ==========================================================================
  // REGISTRATION & VALIDATION
  // ==========================================================================

  function handleRegistrationSubmit(e) {
    if (e) e.preventDefault();

    const name = DOM.studentNameInput.value.trim();
    const usn = DOM.studentUSNInput.value.trim().toUpperCase();

    let isValid = true;

    // Validate Name
    if (!name || name.length < 2) {
      DOM.studentNameInput.parentElement.classList.add('error');
      DOM.nameError.classList.add('visible');
      isValid = false;
    } else {
      DOM.studentNameInput.parentElement.classList.remove('error');
      DOM.nameError.classList.remove('visible');
    }

    // Validate USN
    if (!usn || usn.length < 3) {
      DOM.studentUSNInput.parentElement.classList.add('error');
      DOM.usnError.classList.add('visible');
      isValid = false;
    } else {
      DOM.studentUSNInput.parentElement.classList.remove('error');
      DOM.usnError.classList.remove('visible');
    }

    if (!isValid) return;

    // Initialize New Quiz Attempt
    state.studentName = name;
    state.studentUSN = usn;
    state.currentQuestionIndex = 0;
    state.userAnswers = {};
    state.visitedQuestions = new Set([1]);
    state.remainingSeconds = TOTAL_TIME_SECONDS;
    state.isSubmitted = false;
    state.isDisqualified = false;
    state.violationTimestamp = null;
    state.startTime = new Date().toISOString();
    state.endTime = null;
    state.warned5Min = false;
    state.warned1Min = false;

    saveActiveSession();
    broadcastToAdmin('SESSION_START');
    startQuizSession();
  }

  function checkActiveSession() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_ATTEMPT);
      if (saved) {
        const data = JSON.parse(saved);
        if (data && data.studentName && data.remainingSeconds > 0 && !data.isSubmitted && !data.isDisqualified) {
          DOM.resumeSessionDetails.textContent = `${data.studentName} (${data.studentUSN}) • ${formatTime(data.remainingSeconds)} left`;
          DOM.resumeSessionBanner.classList.remove('hidden');
        }
      }
    } catch (e) {
      console.warn('Could not read active session:', e);
    }
  }

  function resumeActiveSession() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_ATTEMPT);
      if (!saved) return;
      const data = JSON.parse(saved);

      state.studentName = data.studentName;
      state.studentUSN = data.studentUSN;
      state.currentQuestionIndex = data.currentQuestionIndex || 0;
      state.userAnswers = data.userAnswers || {};
      state.visitedQuestions = new Set(data.visitedQuestions || [1]);
      state.remainingSeconds = data.remainingSeconds || TOTAL_TIME_SECONDS;
      state.startTime = data.startTime || new Date().toISOString();
      state.isSubmitted = false;
      state.isDisqualified = false;
      state.warned5Min = data.remainingSeconds <= 300;
      state.warned1Min = data.remainingSeconds <= 60;

      startQuizSession();
      broadcastToAdmin('SESSION_RESUME');
      showToast(`Welcome back, ${state.studentName}! Your assessment resumed.`, 'success');
    } catch (e) {
      console.error('Error resuming session:', e);
      handleRegistrationSubmit();
    }
  }

  function saveActiveSession() {
    if (state.isSubmitted) return;
    try {
      const payload = {
        studentName: state.studentName,
        studentUSN: state.studentUSN,
        currentQuestionIndex: state.currentQuestionIndex,
        userAnswers: state.userAnswers,
        visitedQuestions: Array.from(state.visitedQuestions),
        remainingSeconds: state.remainingSeconds,
        startTime: state.startTime,
        isSubmitted: state.isSubmitted,
        isDisqualified: state.isDisqualified
      };
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ATTEMPT, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save session to localStorage:', e);
    }
  }

  function clearActiveSession() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ATTEMPT);
      DOM.resumeSessionBanner.classList.add('hidden');
    } catch (e) {
      console.warn('Failed to clear active session:', e);
    }
  }

  // ==========================================================================
  // QUIZ SESSION START & TIMER
  // ==========================================================================

  function startQuizSession() {
    DOM.headerCandidateName.textContent = state.studentName;
    DOM.headerCandidateUSN.textContent = state.studentUSN;

    showScreen(DOM.quizScreen);
    renderQuestion(state.currentQuestionIndex);
    updatePaletteUI();
    updateProgressUI();

    startTimer();
  }

  function startTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);

    updateTimerDisplay();

    state.timerInterval = setInterval(() => {
      state.remainingSeconds--;

      if (state.remainingSeconds <= 0) {
        state.remainingSeconds = 0;
        updateTimerDisplay();
        clearInterval(state.timerInterval);
        handleTimerExpiration();
        return;
      }

      updateTimerDisplay();

      if (state.remainingSeconds % 5 === 0) {
        saveActiveSession();
        broadcastToAdmin('PING_TICK');
      }

      if (state.remainingSeconds <= 300 && !state.warned5Min) {
        state.warned5Min = true;
        DOM.liveTimerBadge.classList.add('warning');
        showToast('⚠️ 5 Minutes Left! Review your answers.', 'warning', 5000);
      }

      if (state.remainingSeconds <= 60 && !state.warned1Min) {
        state.warned1Min = true;
        DOM.liveTimerBadge.classList.remove('warning');
        DOM.liveTimerBadge.classList.add('critical');
        showToast('🚨 1 Minute Remaining! Finalizing test soon.', 'critical', 5000);
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const timeStr = formatTime(state.remainingSeconds);
    DOM.timerDisplay.textContent = timeStr;

    if (state.remainingSeconds > 300) {
      DOM.liveTimerBadge.className = 'timer-badge';
    } else if (state.remainingSeconds > 60) {
      DOM.liveTimerBadge.className = 'timer-badge warning';
    } else {
      DOM.liveTimerBadge.className = 'timer-badge critical';
    }
  }

  function handleTimerExpiration() {
    if (state.isSubmitted) return;
    showToast('⏰ Time has expired! Auto-submitting test...', 'critical', 4000);
    closeConfirmModal();
    finalizeQuizSubmission(true, false);
  }

  // ==========================================================================
  // STRICT PROCTORING: TAB / APP SWITCHING DETECTION ON PHONE
  // ==========================================================================

  function handleTabSwitchViolation() {
    if (state.isSubmitted || !DOM.quizScreen.classList.contains('active')) return;

    state.isDisqualified = true;
    state.violationTimestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }

    closeConfirmModal();
    closeMobilePaletteDrawer();

    finalizeQuizSubmission(false, true);

    DOM.violationCandidateName.textContent = state.studentName;
    DOM.violationCandidateUSN.textContent = state.studentUSN;
    DOM.violationTimeVal.textContent = state.violationTimestamp;

    const currentScore = calculateCurrentScore();
    DOM.violationScoreVal.textContent = `${currentScore} / ${TOTAL_QUESTIONS}`;

    showScreen(DOM.violationScreen);

    broadcastToAdmin('VIOLATION_TERMINATION', {
      reason: 'Phone App / Tab Switch Detected',
      partialScore: currentScore
    });

    showToast('🚨 PROCTORING VIOLATION: Test terminated due to tab or app switch.', 'critical', 8000);
  }

  function calculateCurrentScore() {
    let s = 0;
    QUIZ_QUESTIONS.forEach(q => {
      if (state.userAnswers[q.id] === q.correctAnswer) {
        s++;
      }
    });
    return s;
  }

  // ==========================================================================
  // QUESTION RENDERING & NAVIGATION
  // ==========================================================================

  function renderQuestion(index) {
    if (index < 0 || index >= TOTAL_QUESTIONS) return;

    state.currentQuestionIndex = index;
    const qData = QUIZ_QUESTIONS[index];
    const qId = qData.id;

    state.visitedQuestions.add(qId);

    // Update Meta Pills
    DOM.questionCounterPill.textContent = `Q${index + 1} / ${TOTAL_QUESTIONS}`;
    DOM.questionTopicPill.textContent = qData.category;
    DOM.qSequencePrefix.textContent = `Q${index + 1}.`;

    DOM.qStatement.innerHTML = formatCodeSnippets(qData.question);

    DOM.optionsGrid.innerHTML = '';
    const currentSelection = state.userAnswers[qId];

    ['A', 'B', 'C', 'D'].forEach(letter => {
      const optionText = qData.options[letter];
      if (!optionText) return;

      const isSelected = currentSelection === letter;
      const optBox = document.createElement('div');
      optBox.className = `option-box ${isSelected ? 'selected' : ''}`;
      optBox.setAttribute('role', 'radio');
      optBox.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      optBox.setAttribute('tabindex', '0');
      optBox.dataset.optionKey = letter;

      optBox.innerHTML = `
        <div class="option-letter-badge">${letter}</div>
        <div class="option-label-text">${formatCodeSnippets(optionText)}</div>
      `;

      optBox.addEventListener('click', () => selectOption(qId, letter));
      optBox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectOption(qId, letter);
        }
      });

      DOM.optionsGrid.appendChild(optBox);
    });

    // Update Navigation Buttons (Desktop + Mobile Bottom Bar)
    DOM.prevBtn.disabled = index === 0;
    DOM.mobileFooterPrevBtn.disabled = index === 0;

    const isLast = index === TOTAL_QUESTIONS - 1;
    DOM.nextBtnText.textContent = isLast ? 'Finish / Review' : 'Save & Next';
    DOM.mobileFooterNextText.textContent = isLast ? 'Review' : 'Next';

    // Mobile Footer Palette Pill Text
    DOM.mobileFooterPaletteText.textContent = `Palette Q${index + 1}`;

    updatePaletteUI();
    updateProgressUI();
    saveActiveSession();
  }

  function selectOption(qId, optionKey) {
    state.userAnswers[qId] = optionKey;

    const optionCards = DOM.optionsGrid.querySelectorAll('.option-box');
    optionCards.forEach(card => {
      if (card.dataset.optionKey === optionKey) {
        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');
      } else {
        card.classList.remove('selected');
        card.setAttribute('aria-checked', 'false');
      }
    });

    updatePaletteUI();
    updateProgressUI();
    saveActiveSession();
    broadcastToAdmin('ANSWER_SELECT', {
      questionId: qId,
      optionSelected: optionKey
    });
  }

  function clearCurrentAnswer() {
    const qData = QUIZ_QUESTIONS[state.currentQuestionIndex];
    if (state.userAnswers[qData.id]) {
      delete state.userAnswers[qData.id];

      const optionCards = DOM.optionsGrid.querySelectorAll('.option-box');
      optionCards.forEach(card => {
        card.classList.remove('selected');
        card.setAttribute('aria-checked', 'false');
      });

      updatePaletteUI();
      updateProgressUI();
      saveActiveSession();
      broadcastToAdmin('ANSWER_CLEAR', { questionId: qData.id });
      showToast('Answer cleared for this question.', 'info', 1800);
    }
  }

  function navigateQuestion(delta) {
    const nextIdx = state.currentQuestionIndex + delta;

    if (nextIdx >= TOTAL_QUESTIONS) {
      openConfirmModal();
      return;
    }

    if (nextIdx >= 0 && nextIdx < TOTAL_QUESTIONS) {
      renderQuestion(nextIdx);
    }
  }

  // ==========================================================================
  // QUESTION PALETTE & PROGRESS UI
  // ==========================================================================

  function renderPaletteButtons() {
    DOM.paletteGrid.innerHTML = '';

    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const qNum = i + 1;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'palette-btn unvisited';
      btn.id = `paletteBtn-${qNum}`;
      btn.textContent = qNum;
      btn.setAttribute('aria-label', `Jump to question ${qNum}`);

      btn.addEventListener('click', () => {
        renderQuestion(i);
        closeMobilePaletteDrawer();
      });

      DOM.paletteGrid.appendChild(btn);
    }
  }

  function updatePaletteUI() {
    let answered = 0;
    let visited = 0;
    let unvisited = 0;

    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      const qNum = i + 1;
      const btn = document.getElementById(`paletteBtn-${qNum}`);
      if (!btn) continue;

      const isCurrent = i === state.currentQuestionIndex;
      const isAnswered = Boolean(state.userAnswers[qNum]);
      const isVisited = state.visitedQuestions.has(qNum);

      btn.className = 'palette-btn';

      if (isAnswered) {
        btn.classList.add('answered');
        answered++;
      } else if (isVisited) {
        btn.classList.add('visited-unanswered');
        visited++;
      } else {
        btn.classList.add('unvisited');
        unvisited++;
      }

      if (isCurrent) {
        btn.classList.add('current');
      }
    }

    DOM.paletteAnsweredCount.textContent = answered;
    DOM.paletteVisitedCount.textContent = visited;
    DOM.paletteUnvisitedCount.textContent = unvisited;

    // Mobile Bottom Bar Badge
    DOM.mobileFooterCountBadge.textContent = `${answered}/${TOTAL_QUESTIONS}`;
  }

  function updateProgressUI() {
    const answeredCount = Object.keys(state.userAnswers).length;
    DOM.answeredCounterText.textContent = `${answeredCount} / ${TOTAL_QUESTIONS}`;

    const percentage = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);
    DOM.quizProgressBar.style.width = `${percentage}%`;
  }

  function openMobilePaletteDrawer() {
    DOM.paletteSidebar.classList.add('open');
  }

  function closeMobilePaletteDrawer() {
    DOM.paletteSidebar.classList.remove('open');
  }

  // ==========================================================================
  // CONFIRMATION MODAL & SUBMISSION
  // ==========================================================================

  function openConfirmModal() {
    const answeredCount = Object.keys(state.userAnswers).length;
    const unansweredCount = TOTAL_QUESTIONS - answeredCount;

    DOM.confirmAnsweredVal.textContent = `${answeredCount} / ${TOTAL_QUESTIONS}`;
    DOM.confirmUnansweredVal.textContent = `${unansweredCount} / ${TOTAL_QUESTIONS}`;
    DOM.confirmTimeLeftVal.textContent = formatTime(state.remainingSeconds);

    if (unansweredCount > 0) {
      DOM.unansweredWarningAlert.classList.remove('hidden');
    } else {
      DOM.unansweredWarningAlert.classList.add('hidden');
    }

    DOM.submitConfirmationModal.classList.add('active');
  }

  function closeConfirmModal() {
    DOM.submitConfirmationModal.classList.remove('active');
  }

  function finalizeQuizSubmission(isAutoSubmit = false, isViolation = false) {
    if (state.isSubmitted) return;
    state.isSubmitted = true;

    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }

    state.endTime = new Date().toISOString();
    closeConfirmModal();
    closeMobilePaletteDrawer();

    const resultData = calculateResults(isViolation);
    saveAttemptHistory(resultData);
    clearActiveSession();

    broadcastToAdmin('ASSESSMENT_COMPLETED', {
      score: resultData.score,
      percentage: resultData.percentage,
      isDisqualified: isViolation,
      verdict: resultData.verdict.title
    });

    renderResultDashboard(resultData);

    if (!isViolation) {
      showScreen(DOM.resultScreen);
      if (isAutoSubmit) {
        showToast('Assessment submitted automatically. Review results below.', 'info', 5000);
      } else {
        showToast('Assessment submitted successfully! Great effort.', 'success', 5000);
      }
    }
  }

  // ==========================================================================
  // GRADING & RESULT CALCULATION
  // ==========================================================================

  function calculateResults(isViolation = false) {
    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const breakdown = QUIZ_QUESTIONS.map(q => {
      const studentPick = state.userAnswers[q.id] || null;
      const isCorrect = studentPick === q.correctAnswer;
      const isUnanswered = studentPick === null;

      if (isCorrect) {
        score += 1;
        correctCount += 1;
      } else if (isUnanswered) {
        unansweredCount += 1;
      } else {
        incorrectCount += 1;
      }

      return {
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        studentPick: studentPick,
        category: q.category,
        explanation: q.explanation,
        status: isCorrect ? 'correct' : isUnanswered ? 'unanswered' : 'incorrect'
      };
    });

    const percentage = Number(((score / TOTAL_QUESTIONS) * 100).toFixed(1));
    const secondsTaken = TOTAL_TIME_SECONDS - state.remainingSeconds;
    const timeTakenFormatted = formatTimeWords(secondsTaken);

    let verdict = {
      badge: '🏆',
      title: 'Excellent — Placement Ready',
      desc: 'Outstanding technical performance! You demonstrated exceptional mastery of computer science fundamentals and algorithms.'
    };

    if (isViolation) {
      verdict = {
        badge: '⚠️',
        title: 'Disqualified — Tab / App Switch Violation',
        desc: 'Assessment terminated prematurely due to leaving the examination window or switching apps on your phone. Proctoring violation logged.'
      };
    } else if (score >= 27) {
      verdict = {
        badge: '🏆',
        title: 'Excellent — Placement Ready',
        desc: 'Outstanding technical performance! You demonstrated exceptional mastery of core CS, Java, DBMS, and algorithms. High probability of clearing top-tier technical rounds.'
      };
    } else if (score >= 23) {
      verdict = {
        badge: '🌟',
        title: 'Very Good',
        desc: 'Strong command of core placement concepts. Brush up on fine-grained theoretical edge cases to easily cross the 90%+ threshold.'
      };
    } else if (score >= 18) {
      verdict = {
        badge: '👍',
        title: 'Good — Keep Practising',
        desc: 'Good baseline foundation. Focus your revision on Operating Systems scheduling, DBMS normalization, and complexity bounds.'
      };
    } else if (score >= 12) {
      verdict = {
        badge: '⚠️',
        title: 'Needs Improvement',
        desc: 'Foundational gaps identified across multiple subjects. Systematic review of data structures and core principles is recommended before placement interviews.'
      };
    } else {
      verdict = {
        badge: '📚',
        title: 'More Practice Recommended',
        desc: 'Substantial preparation required. Work through the detailed explanations below, study standard core textbooks, and retake the assessment.'
      };
    }

    return {
      name: state.studentName,
      usn: state.studentUSN,
      timestamp: new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      score,
      totalQuestions: TOTAL_QUESTIONS,
      percentage,
      correctCount,
      incorrectCount,
      unansweredCount,
      secondsTaken,
      timeTakenFormatted,
      isDisqualified: isViolation,
      verdict,
      breakdown
    };
  }

  // ==========================================================================
  // RESULT SCREEN RENDERING
  // ==========================================================================

  function renderResultDashboard(results) {
    DOM.resultStudentName.textContent = results.name;
    DOM.resultStudentUSN.textContent = results.usn;
    DOM.resultAttemptTimestamp.textContent = results.timestamp;
    DOM.resultDuration.textContent = results.timeTakenFormatted;

    if (results.isDisqualified) {
      DOM.resultCardTypeChip.textContent = 'DISQUALIFIED SESSION REPORT';
      DOM.resultCardTypeChip.classList.add('violation-chip');
      DOM.verdictBanner.classList.add('violation-banner');
    } else {
      DOM.resultCardTypeChip.textContent = 'OFFICIAL PERFORMANCE REPORT';
      DOM.resultCardTypeChip.classList.remove('violation-chip');
      DOM.verdictBanner.classList.remove('violation-banner');
    }

    DOM.resultScoreNum.textContent = results.score;
    DOM.resultPercentageNum.textContent = `${results.percentage}%`;

    const circumference = 2 * Math.PI * 68;
    const progressOffset = circumference - (results.percentage / 100) * circumference;
    DOM.scoreRingProgress.style.strokeDashoffset = progressOffset;

    if (results.isDisqualified) {
      DOM.scoreRingProgress.style.stroke = 'var(--rose)';
    } else if (results.score >= 23) {
      DOM.scoreRingProgress.style.stroke = 'var(--emerald)';
    } else if (results.score >= 18) {
      DOM.scoreRingProgress.style.stroke = 'var(--primary)';
    } else if (results.score >= 12) {
      DOM.scoreRingProgress.style.stroke = 'var(--amber)';
    } else {
      DOM.scoreRingProgress.style.stroke = 'var(--rose)';
    }

    DOM.verdictEmoji.textContent = results.verdict.badge;
    DOM.verdictHeading.textContent = results.verdict.title;
    DOM.verdictDescription.textContent = results.verdict.desc;

    DOM.metricTotalScore.textContent = results.score;
    DOM.metricAccuracy.textContent = `${results.percentage}%`;
    DOM.metricCorrectAnswers.textContent = results.correctCount;
    DOM.metricIncorrectAnswers.textContent = results.incorrectCount;
    DOM.metricSkippedAnswers.textContent = results.unansweredCount;

    DOM.filterCountAll.textContent = results.totalQuestions;
    DOM.filterCountCorrect.textContent = results.correctCount;
    DOM.filterCountIncorrect.textContent = results.incorrectCount;
    DOM.filterCountUnanswered.textContent = results.unansweredCount;

    renderReviewCards(results.breakdown);
  }

  // ==========================================================================
  // DETAILED REVIEW CARDS
  // ==========================================================================

  function renderReviewCards(breakdown) {
    DOM.reviewCardsList.innerHTML = '';

    breakdown.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = `review-card status-${item.status}`;
      card.dataset.status = item.status;

      let badgeHtml = '';
      if (item.status === 'correct') {
        badgeHtml = `<span class="rc-badge badge-correct">✓ Correct (+1)</span>`;
      } else if (item.status === 'incorrect') {
        badgeHtml = `<span class="rc-badge badge-incorrect">✗ Incorrect (0)</span>`;
      } else {
        badgeHtml = `<span class="rc-badge badge-unanswered">○ Skipped (0)</span>`;
      }

      let optionsHtml = '';
      ['A', 'B', 'C', 'D'].forEach(letter => {
        const text = item.options[letter];
        if (!text) return;

        const isCorrectKey = item.correctAnswer === letter;
        const isStudentPick = item.studentPick === letter;

        let optClass = 'rc-option-item';
        let optTag = '';

        if (isCorrectKey) {
          optClass += ' opt-correct';
          optTag = `<span class="opt-indicator-tag tag-faculty-key">Faculty Key ✓</span>`;
        } else if (isStudentPick && !isCorrectKey) {
          optClass += ' opt-incorrect';
          optTag = `<span class="opt-indicator-tag tag-student-pick">Your Pick ✗</span>`;
        }

        optionsHtml += `
          <div class="${optClass}">
            <div class="rc-option-key">${letter}</div>
            <div class="rc-option-text">${formatCodeSnippets(text)}</div>
            ${optTag}
          </div>
        `;
      });

      card.innerHTML = `
        <div class="review-card-header">
          <div class="rc-header-left">
            <span class="rc-qnum">Q${idx + 1}</span>
            <span class="rc-category">${escapeHtml(item.category)}</span>
          </div>
          ${badgeHtml}
        </div>

        <h3 class="rc-question-text">${formatCodeSnippets(item.question)}</h3>

        <div class="rc-options-grid">
          ${optionsHtml}
        </div>

        <div class="explanation-accordion">
          <button type="button" class="explanation-toggle-btn" data-target="exp-${item.id}">
            <svg class="toggle-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            <span>Show Explanation</span>
          </button>
          <div id="exp-${item.id}" class="explanation-drawer">
            <strong>Key Concept &amp; Faculty Analysis:</strong>
            <p>${formatCodeSnippets(item.explanation)}</p>
          </div>
        </div>
      `;

      const toggleBtn = card.querySelector('.explanation-toggle-btn');
      const drawer = card.querySelector('.explanation-drawer');
      const arrow = card.querySelector('.toggle-arrow');

      toggleBtn.addEventListener('click', () => {
        const isOpen = drawer.classList.contains('open');
        if (isOpen) {
          drawer.classList.remove('open');
          arrow.style.transform = 'rotate(0deg)';
          toggleBtn.querySelector('span').textContent = 'Show Explanation';
        } else {
          drawer.classList.add('open');
          arrow.style.transform = 'rotate(180deg)';
          toggleBtn.querySelector('span').textContent = 'Hide Explanation';
        }
      });

      DOM.reviewCardsList.appendChild(card);
    });

    applyReviewFilter(state.activeReviewFilter);
  }

  function applyReviewFilter(filter) {
    state.activeReviewFilter = filter;
    const cards = DOM.reviewCardsList.querySelectorAll('.review-card');

    cards.forEach(card => {
      if (filter === 'all' || card.dataset.status === filter) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });

    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      if (tab.dataset.filter === filter) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  function toggleAllExplanations() {
    state.allExplanationsOpen = !state.allExplanationsOpen;
    const drawers = DOM.reviewCardsList.querySelectorAll('.explanation-drawer');
    const toggleBtns = DOM.reviewCardsList.querySelectorAll('.explanation-toggle-btn');

    drawers.forEach((drawer, idx) => {
      const btn = toggleBtns[idx];
      const arrow = btn ? btn.querySelector('.toggle-arrow') : null;

      if (state.allExplanationsOpen) {
        drawer.classList.add('open');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
        if (btn) btn.querySelector('span').textContent = 'Hide Explanation';
      } else {
        drawer.classList.remove('open');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
        if (btn) btn.querySelector('span').textContent = 'Show Explanation';
      }
    });

    DOM.toggleAllExplanationsBtn.querySelector('span').textContent = state.allExplanationsOpen
      ? 'Collapse All Explanations'
      : 'Expand All Explanations';
  }

  // ==========================================================================
  // ATTEMPT HISTORY MANAGEMENT
  // ==========================================================================

  function getAttemptHistory() {
    try {
      const historyStr = localStorage.getItem(STORAGE_KEYS.ATTEMPT_HISTORY);
      return historyStr ? JSON.parse(historyStr) : [];
    } catch (e) {
      console.warn('Failed to parse history:', e);
      return [];
    }
  }

  function saveAttemptHistory(resultData) {
    try {
      const history = getAttemptHistory();
      const newEntry = {
        id: 'ATT-' + Date.now(),
        name: resultData.name,
        usn: resultData.usn,
        timestamp: resultData.timestamp,
        score: resultData.score,
        total: resultData.totalQuestions,
        percentage: resultData.percentage,
        timeTaken: resultData.timeTakenFormatted,
        isDisqualified: Boolean(resultData.isDisqualified),
        verdictTitle: resultData.verdict.title,
        breakdown: resultData.breakdown
      };

      history.unshift(newEntry);
      localStorage.setItem(STORAGE_KEYS.ATTEMPT_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save to history:', e);
    }
  }

  function openHistoryModal() {
    renderHistoryModal();
    DOM.historyModal.classList.add('active');
  }

  function closeHistoryModal() {
    DOM.historyModal.classList.remove('active');
  }

  function renderHistoryModal() {
    const history = getAttemptHistory();

    DOM.histTotalAttemptsCount.textContent = history.length;

    if (history.length === 0) {
      DOM.histHighestScoreVal.textContent = '0 / 30';
      DOM.histAvgAccuracyVal.textContent = '0%';
      DOM.historyTableContainer.innerHTML = `
        <div style="padding: 2.5rem 1rem; text-align: center; color: var(--text-muted);">
          <h4>No Previous Attempts Found</h4>
          <p style="font-size: 0.85rem; margin-top: 0.3rem;">Complete a quiz session to record scores.</p>
        </div>
      `;
      return;
    }

    const scores = history.map(h => h.score);
    const highestScore = Math.max(...scores);
    const avgPercentage = (
      history.reduce((sum, h) => sum + h.percentage, 0) / history.length
    ).toFixed(1);

    DOM.histHighestScoreVal.textContent = `${highestScore} / 30`;
    DOM.histAvgAccuracyVal.textContent = `${avgPercentage}%`;

    let rowsHtml = '';
    history.forEach((entry, idx) => {
      let statusPill = `<span class="meta-pill pill-primary" style="font-size: 0.7rem;">${escapeHtml(entry.verdictTitle)}</span>`;
      if (entry.isDisqualified) {
        statusPill = `<span class="meta-pill pill-violation" style="font-size: 0.7rem;">⚠️ Disqualified</span>`;
      }

      rowsHtml += `
        <tr>
          <td>#${history.length - idx}</td>
          <td>${escapeHtml(entry.timestamp)}</td>
          <td><strong>${escapeHtml(entry.name)}</strong><br><small style="font-family: var(--font-mono); color: #a78bfa;">${escapeHtml(entry.usn)}</small></td>
          <td><strong class="text-green">${entry.score}</strong>/30</td>
          <td><strong class="text-blue">${entry.percentage}%</strong></td>
          <td>${statusPill}</td>
        </tr>
      `;
    });

    DOM.historyTableContainer.innerHTML = `
      <table class="history-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Candidate</th>
            <th>Score</th>
            <th>Acc</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  }

  function clearAllHistory() {
    if (confirm('Permanently clear your local attempt history?')) {
      try {
        localStorage.removeItem(STORAGE_KEYS.ATTEMPT_HISTORY);
        renderHistoryModal();
        broadcastToAdmin('HISTORY_CLEARED');
        showToast('Attempt history cleared.', 'info', 2500);
      } catch (e) {
        console.warn('Failed to clear history:', e);
      }
    }
  }

  // ==========================================================================
  // EVENT BINDINGS
  // ==========================================================================

  function bindEvents() {
    // Registration Form
    DOM.registrationForm.addEventListener('submit', handleRegistrationSubmit);
    DOM.resumeTestBtn.addEventListener('click', resumeActiveSession);
    DOM.viewHistoryLandingBtn.addEventListener('click', openHistoryModal);

    DOM.studentUSNInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });

    // Desktop & Inline Navigation
    DOM.prevBtn.addEventListener('click', () => navigateQuestion(-1));
    DOM.nextBtn.addEventListener('click', () => navigateQuestion(1));
    DOM.clearBtn.addEventListener('click', clearCurrentAnswer);

    // Mobile Phone Sticky Bottom Bar Handlers
    DOM.mobileFooterPrevBtn.addEventListener('click', () => navigateQuestion(-1));
    DOM.mobileFooterNextBtn.addEventListener('click', () => navigateQuestion(1));
    DOM.mobileFooterClearBtn.addEventListener('click', clearCurrentAnswer);
    DOM.mobileFooterPaletteBtn.addEventListener('click', openMobilePaletteDrawer);

    // Mobile Palette Bottom Sheet Close Handlers
    DOM.mobilePaletteCloseBtn.addEventListener('click', closeMobilePaletteDrawer);
    DOM.paletteOverlayBackdrop.addEventListener('click', closeMobilePaletteDrawer);

    // Submit Triggers
    DOM.topSubmitBtn.addEventListener('click', openConfirmModal);
    DOM.sidebarSubmitBtn.addEventListener('click', openConfirmModal);

    // Confirm Modal Actions
    DOM.cancelSubmitModalBtn.addEventListener('click', closeConfirmModal);
    DOM.finalizeSubmitModalBtn.addEventListener('click', () => finalizeQuizSubmission(false, false));

    // Violation Screen Actions
    DOM.viewViolationScorecardBtn.addEventListener('click', () => {
      showScreen(DOM.resultScreen);
    });
    DOM.returnHomeViolationBtn.addEventListener('click', () => {
      showScreen(DOM.registrationScreen);
    });

    // Result Actions
    DOM.retakeQuizBtn.addEventListener('click', () => {
      if (confirm('Start a fresh quiz assessment?')) {
        showScreen(DOM.registrationScreen);
      }
    });
    DOM.viewHistoryFromResultsBtn.addEventListener('click', openHistoryModal);
    DOM.printScorecardBtn.addEventListener('click', () => window.print());

    // Review Filters
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        applyReviewFilter(tab.dataset.filter);
      });
    });

    DOM.toggleAllExplanationsBtn.addEventListener('click', toggleAllExplanations);

    // History Modal
    DOM.closeHistoryModalBtn.addEventListener('click', closeHistoryModal);
    DOM.closeHistoryFooterBtn.addEventListener('click', closeHistoryModal);
    DOM.clearHistoryBtn.addEventListener('click', clearAllHistory);

    // Close Modals on Backdrop Click
    [DOM.submitConfirmationModal, DOM.historyModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    // Keyboard Shortcuts (for desktop or physical keyboards connected to phones)
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // ========================================================================
    // TAB & APP-SWITCHING PROCTORING FOR PHONES
    // document.visibilitychange accurately fires when leaving the browser or app!
    // ========================================================================
    document.addEventListener('visibilitychange', () => {
      if (DOM.quizScreen.classList.contains('active') && !state.isSubmitted) {
        if (document.hidden) {
          // Phone user switched apps, switched browser tabs, or went to Home screen!
          handleTabSwitchViolation();
        }
      }
    });

    // Prevent accidental unload
    window.addEventListener('beforeunload', (e) => {
      if (!state.isSubmitted && state.studentName && DOM.quizScreen.classList.contains('active')) {
        saveActiveSession();
        e.preventDefault();
        e.returnValue = 'Your test is currently active.';
        return e.returnValue;
      }
    });
  }

  function handleKeyboardShortcuts(e) {
    if (!DOM.quizScreen.classList.contains('active')) return;
    if (DOM.submitConfirmationModal.classList.contains('active')) return;
    if (DOM.historyModal.classList.contains('active')) return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    const qData = QUIZ_QUESTIONS[state.currentQuestionIndex];
    if (!qData) return;

    const key = e.key.toUpperCase();
    if (key === '1' || key === 'A') {
      e.preventDefault();
      selectOption(qData.id, 'A');
    } else if (key === '2' || key === 'B') {
      e.preventDefault();
      selectOption(qData.id, 'B');
    } else if (key === '3' || key === 'C') {
      e.preventDefault();
      selectOption(qData.id, 'C');
    } else if (key === '4' || key === 'D') {
      e.preventDefault();
      selectOption(qData.id, 'D');
    } else if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      navigateQuestion(-1);
    } else if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      navigateQuestion(1);
    }
  }

  // ==========================================================================
  // HELPER FORMATTING FUNCTIONS
  // ==========================================================================

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function formatTimeWords(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs} seconds`;
    return `${mins}m ${secs}s`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatCodeSnippets(str) {
    if (!str) return '';
    const escaped = escapeHtml(str);
    return escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  document.addEventListener('DOMContentLoaded', initApp);

})();
