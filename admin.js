/**
 * ============================================================================
 * CSE PLACEMENT QUIZ ARENA - FACULTY ADMIN CONSOLE ENGINE
 * Real-Time Candidate Proctoring, Analytics & Audit Management
 * ============================================================================
 */

(function () {
  'use strict';

  // Storage Keys matching Student Portal
  const STORAGE_KEYS = {
    ACTIVE_ATTEMPT: 'cse_quiz_arena_active_attempt',
    ATTEMPT_HISTORY: 'cse_quiz_arena_history',
    ADMIN_FEED: 'cse_quiz_arena_live_feed'
  };

  // BroadcastChannel for Live Synchronization
  let adminChannel = null;
  try {
    adminChannel = new BroadcastChannel('cse_placement_quiz_arena_channel');
  } catch (e) {
    console.warn('BroadcastChannel unavailable:', e);
  }

  // Admin State
  const adminState = {
    records: [],
    activeSession: null,
    searchQuery: '',
    statusFilter: 'all',
    selectedCandidate: null
  };

  // DOM Elements Cache
  const DOM = {
    // Auth Gate
    adminAuthGate: document.getElementById('adminAuthGate'),
    adminAuthCard: document.querySelector('.admin-auth-card'),
    adminAuthForm: document.getElementById('adminAuthForm'),
    adminPinInput: document.getElementById('adminPinInput'),
    pinError: document.getElementById('pinError'),
    unlockAdminBtn: document.getElementById('unlockAdminBtn'),
    adminMainWrapper: document.getElementById('adminMainWrapper'),
    lockAdminBtn: document.getElementById('lockAdminBtn'),

    // Top Bar & Sync
    syncStatusText: document.getElementById('syncStatusText'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    refreshFeedBtn: document.getElementById('refreshFeedBtn'),
    clearAllRecordsBtn: document.getElementById('clearAllRecordsBtn'),
    toastContainer: document.getElementById('toastContainer'),

    // KPI Values
    kpiTotalCandidates: document.getElementById('kpiTotalCandidates'),
    kpiAverageScore: document.getElementById('kpiAverageScore'),
    kpiAveragePct: document.getElementById('kpiAveragePct'),
    kpiPlacementReadyCount: document.getElementById('kpiPlacementReadyCount'),
    kpiPlacementReadyPct: document.getElementById('kpiPlacementReadyPct'),
    kpiHighScore: document.getElementById('kpiHighScore'),
    kpiHighScoreStudent: document.getElementById('kpiHighScoreStudent'),
    kpiViolationCount: document.getElementById('kpiViolationCount'),
    kpiActiveSessionsCount: document.getElementById('kpiActiveSessionsCount'),
    kpiActiveDetails: document.getElementById('kpiActiveDetails'),

    // Active Sessions Feed
    activeSessionsSection: document.getElementById('activeSessionsSection'),
    activeSessionsList: document.getElementById('activeSessionsList'),

    // Candidate Directory & Filters
    candidateSearchInput: document.getElementById('candidateSearchInput'),
    countTabAll: document.getElementById('countTabAll'),
    countTabCompleted: document.getElementById('countTabCompleted'),
    countTabDisqualified: document.getElementById('countTabDisqualified'),
    countTabTop: document.getElementById('countTabTop'),
    candidatesTableBody: document.getElementById('candidatesTableBody'),
    tableEmptyState: document.getElementById('tableEmptyState'),

    // Analytics Grid
    questionAnalyticsGrid: document.getElementById('questionAnalyticsGrid'),

    // Inspector Modal
    inspectorModal: document.getElementById('inspectorModal'),
    inspectorCandidateName: document.getElementById('inspectorCandidateName'),
    inspectorCandidateUSN: document.getElementById('inspectorCandidateUSN'),
    inspectorTimestamp: document.getElementById('inspectorTimestamp'),
    inspectorDuration: document.getElementById('inspectorDuration'),
    inspectorScore: document.getElementById('inspectorScore'),
    inspectorPct: document.getElementById('inspectorPct'),
    inspectorViolationNotice: document.getElementById('inspectorViolationNotice'),
    inspectorQuestionsList: document.getElementById('inspectorQuestionsList'),
    closeInspectorModalBtn: document.getElementById('closeInspectorModalBtn'),
    closeInspectorFooterBtn: document.getElementById('closeInspectorFooterBtn'),
    printInspectorSheetBtn: document.getElementById('printInspectorSheetBtn')
  };

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  let isConsoleInitialized = false;

  function initAdminConsole() {
    if (!isConsoleInitialized) {
      bindAdminEvents();
      setupLiveBroadcasting();
      isConsoleInitialized = true;
    }
    loadAllRecords();
    renderAllViews();
  }

  // ==========================================================================
  // REAL-TIME BROADCAST & STORAGE LISTENER
  // ==========================================================================

  function setupLiveBroadcasting() {
    if (adminChannel) {
      adminChannel.onmessage = (event) => {
        const msg = event.data;
        if (!msg) return;

        showAdminToast(`Live Update: ${msg.studentName || 'Candidate'} (${msg.type})`, 'info', 3000);
        
        // Refresh dataset
        loadAllRecords();
        renderAllViews();
      };
    }

    // Storage event for inter-window / inter-tab updates
    window.addEventListener('storage', (e) => {
      if (
        e.key === STORAGE_KEYS.ATTEMPT_HISTORY ||
        e.key === STORAGE_KEYS.ACTIVE_ATTEMPT ||
        e.key === STORAGE_KEYS.ADMIN_FEED
      ) {
        loadAllRecords();
        renderAllViews();
      }
    });
  }

  // ==========================================================================
  // LOAD DATA FROM LOCALSTORAGE
  // ==========================================================================

  function loadAllRecords() {
    // 1. Load Completed History
    try {
      const historyStr = localStorage.getItem(STORAGE_KEYS.ATTEMPT_HISTORY);
      adminState.records = historyStr ? JSON.parse(historyStr) : [];
    } catch (e) {
      console.warn('Failed to parse history in admin:', e);
      adminState.records = [];
    }

    // 2. Load In-Progress Active Attempt
    try {
      const activeStr = localStorage.getItem(STORAGE_KEYS.ACTIVE_ATTEMPT);
      if (activeStr) {
        const active = JSON.parse(activeStr);
        if (active && active.studentName && active.remainingSeconds > 0 && !active.isSubmitted) {
          adminState.activeSession = active;
        } else {
          adminState.activeSession = null;
        }
      } else {
        adminState.activeSession = null;
      }
    } catch (e) {
      adminState.activeSession = null;
    }
  }

  // ==========================================================================
  // VIEW RENDERING ORCHESTRATION
  // ==========================================================================

  function renderAllViews() {
    renderKPIs();
    renderActiveSessions();
    renderCandidateTable();
    renderQuestionAnalytics();
  }

  // ==========================================================================
  // EXECUTIVE KPIS CALCULATION
  // ==========================================================================

  function renderKPIs() {
    const records = adminState.records;
    const total = records.length;

    DOM.kpiTotalCandidates.textContent = total;

    if (total === 0) {
      DOM.kpiAverageScore.innerHTML = `0.0 <small>/ 30</small>`;
      DOM.kpiAveragePct.textContent = `0.0% Mean Accuracy`;
      DOM.kpiPlacementReadyCount.textContent = '0';
      DOM.kpiPlacementReadyPct.textContent = `0% of cohort`;
      DOM.kpiHighScore.innerHTML = `0 <small>/ 30</small>`;
      DOM.kpiHighScoreStudent.textContent = `No submissions`;
      DOM.kpiViolationCount.textContent = '0';
    } else {
      // Average Score
      const totalScoreSum = records.reduce((sum, r) => sum + Number(r.score || 0), 0);
      const avgScore = (totalScoreSum / total).toFixed(1);
      const avgPct = ((totalScoreSum / (total * 30)) * 100).toFixed(1);

      DOM.kpiAverageScore.innerHTML = `${avgScore} <small>/ 30</small>`;
      DOM.kpiAveragePct.textContent = `${avgPct}% Mean Accuracy`;

      // Placement Ready Count (Score >= 27)
      const placementReady = records.filter(r => Number(r.score || 0) >= 27);
      const readyPct = Math.round((placementReady.length / total) * 100);
      DOM.kpiPlacementReadyCount.textContent = placementReady.length;
      DOM.kpiPlacementReadyPct.textContent = `${readyPct}% of cohort`;

      // High Score
      let topRecord = records[0];
      records.forEach(r => {
        if (Number(r.score || 0) > Number(topRecord.score || 0)) {
          topRecord = r;
        }
      });
      DOM.kpiHighScore.innerHTML = `${topRecord.score} <small>/ 30</small>`;
      DOM.kpiHighScoreStudent.textContent = `${topRecord.name} (${topRecord.usn})`;

      // Violations Count
      const violations = records.filter(r => r.isDisqualified === true);
      DOM.kpiViolationCount.textContent = violations.length;
    }

    // Active Sessions
    if (adminState.activeSession) {
      DOM.kpiActiveSessionsCount.textContent = '1 Active';
      DOM.kpiActiveDetails.textContent = `${adminState.activeSession.studentName} is testing`;
    } else {
      DOM.kpiActiveSessionsCount.textContent = '0';
      DOM.kpiActiveDetails.textContent = `No active candidate`;
    }
  }

  // ==========================================================================
  // REAL-TIME ACTIVE SESSIONS FEED
  // ==========================================================================

  function renderActiveSessions() {
    const active = adminState.activeSession;

    if (!active) {
      DOM.activeSessionsSection.classList.add('hidden');
      DOM.activeSessionsList.innerHTML = '';
      return;
    }

    DOM.activeSessionsSection.classList.remove('hidden');
    const answeredCount = Object.keys(active.userAnswers || {}).length;
    const timeRemainingStr = formatTime(active.remainingSeconds || 0);

    DOM.activeSessionsList.innerHTML = `
      <div class="active-session-tile">
        <div class="ast-info">
          <strong>${escapeHtml(active.studentName)}</strong>
          <span>USN: ${escapeHtml(active.studentUSN)}</span>
        </div>
        <div class="ast-meta">
          <span class="badge-live">● Testing Live</span>
          <div>Q${(active.currentQuestionIndex || 0) + 1} of 30 • ${answeredCount} answered</div>
          <small style="color: #60a5fa; font-family: var(--font-mono);">${timeRemainingStr} remaining</small>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // CANDIDATE SUBMISSIONS DIRECTORY TABLE
  // ==========================================================================

  function renderCandidateTable() {
    const records = adminState.records;

    // Filter counts
    const countCompleted = records.filter(r => !r.isDisqualified).length;
    const countDisqualified = records.filter(r => r.isDisqualified).length;
    const countTop = records.filter(r => Number(r.score || 0) >= 27).length;

    DOM.countTabAll.textContent = records.length;
    DOM.countTabCompleted.textContent = countCompleted;
    DOM.countTabDisqualified.textContent = countDisqualified;
    DOM.countTabTop.textContent = countTop;

    // Apply Filter & Search Query
    let filtered = records.filter(r => {
      // 1. Status Filter
      if (adminState.statusFilter === 'completed' && r.isDisqualified) return false;
      if (adminState.statusFilter === 'disqualified' && !r.isDisqualified) return false;
      if (adminState.statusFilter === 'top' && Number(r.score || 0) < 27) return false;

      // 2. Search Query
      if (adminState.searchQuery) {
        const q = adminState.searchQuery.toLowerCase();
        const nameMatch = (r.name || '').toLowerCase().includes(q);
        const usnMatch = (r.usn || '').toLowerCase().includes(q);
        return nameMatch || usnMatch;
      }

      return true;
    });

    if (filtered.length === 0) {
      DOM.candidatesTableBody.innerHTML = '';
      const emptyStateDescription = DOM.tableEmptyState.querySelector('p');
      if (emptyStateDescription) {
        emptyStateDescription.textContent = window.location.protocol === 'file:' && records.length === 0
          ? 'The student and admin pages were opened as separate local files, so they may not share browser storage. Run a local web server and open both pages from the same host and port (for example, http://localhost:8080). Records saved from file:// are not automatically transferred.'
          : 'No student submissions match your query. Students who take the quiz from the student portal will appear here in real time.';
      }
      DOM.tableEmptyState.classList.remove('hidden');
      return;
    }

    DOM.tableEmptyState.classList.add('hidden');
    let rowsHtml = '';

    filtered.forEach((r, idx) => {
      const isViolation = Boolean(r.isDisqualified);
      const statusBadge = isViolation
        ? `<span class="status-badge status-disqualified">⚠️ Disqualified (Tab Switch)</span>`
        : `<span class="status-badge status-completed">✓ Completed</span>`;

      rowsHtml += `
        <tr>
          <td><span style="font-family: var(--font-mono); color: var(--text-dim);">#${filtered.length - idx}</span></td>
          <td>${escapeHtml(r.timestamp)}</td>
          <td class="student-col">
            <strong>${escapeHtml(r.name)}</strong>
          </td>
          <td>
            <small style="font-family: var(--font-mono); color: #a78bfa; font-weight: 700;">${escapeHtml(r.usn)}</small>
          </td>
          <td>
            <strong class="${isViolation ? 'text-rose' : 'text-green'}">${r.score}</strong> <span style="color: var(--text-dim);">/ 30</span>
          </td>
          <td>
            <strong class="text-blue">${r.percentage}%</strong>
          </td>
          <td>${escapeHtml(r.timeTaken || 'N/A')}</td>
          <td>${statusBadge}</td>
          <td>
            <span class="meta-pill ${isViolation ? 'pill-violation' : 'pill-primary'}" style="font-size: 0.72rem;">
              ${escapeHtml(r.verdictTitle || 'Assessment Finalized')}
            </span>
          </td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm inspect-btn" data-record-id="${r.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Inspect</span>
            </button>
          </td>
        </tr>
      `;
    });

    DOM.candidatesTableBody.innerHTML = rowsHtml;

    // Attach inspect click handlers
    const inspectButtons = DOM.candidatesTableBody.querySelectorAll('.inspect-btn');
    inspectButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const recordId = btn.dataset.recordId;
        const candidate = records.find(item => item.id === recordId);
        if (candidate) {
          openInspectorModal(candidate);
        }
      });
    });
  }

  // ==========================================================================
  // CANDIDATE SUBMISSION INSPECTOR MODAL
  // ==========================================================================

  function openInspectorModal(candidate) {
    adminState.selectedCandidate = candidate;

    DOM.inspectorCandidateName.textContent = candidate.name;
    DOM.inspectorCandidateUSN.textContent = candidate.usn;
    DOM.inspectorTimestamp.textContent = candidate.timestamp;
    DOM.inspectorDuration.textContent = candidate.timeTaken;
    DOM.inspectorScore.textContent = `${candidate.score} / 30`;
    DOM.inspectorPct.textContent = `${candidate.percentage}% Accuracy`;

    if (candidate.isDisqualified) {
      DOM.inspectorViolationNotice.classList.remove('hidden');
    } else {
      DOM.inspectorViolationNotice.classList.add('hidden');
    }

    // Build question responses sheet
    DOM.inspectorQuestionsList.innerHTML = '';
    const breakdown = candidate.breakdown || [];

    if (breakdown.length === 0) {
      DOM.inspectorQuestionsList.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
          Detailed question responses not archived for this attempt record.
        </div>
      `;
    } else {
      breakdown.forEach((item, idx) => {
        const qCard = document.createElement('div');
        qCard.className = `inspector-q-card status-${item.status}`;

        let statusTag = '';
        if (item.status === 'correct') {
          statusTag = `<span class="rc-badge badge-correct">✓ Correct (+1)</span>`;
        } else if (item.status === 'incorrect') {
          statusTag = `<span class="rc-badge badge-incorrect">✗ Incorrect (0)</span>`;
        } else {
          statusTag = `<span class="rc-badge badge-unanswered">○ Skipped (0)</span>`;
        }

        const studentPickText = item.studentPick ? `${item.studentPick}: ${escapeHtml(item.options[item.studentPick] || '')}` : 'No Answer Selected';
        const correctText = `${item.correctAnswer}: ${escapeHtml(item.options[item.correctAnswer] || '')}`;

        qCard.innerHTML = `
          <div class="iq-header">
            <span style="font-family: var(--font-mono); font-weight: 700; color: var(--primary);">Question ${idx + 1} (${escapeHtml(item.category)})</span>
            ${statusTag}
          </div>
          <h4 class="iq-title">${formatCodeSnippets(item.question)}</h4>
          <div class="iq-answers-comparison">
            <div style="flex: 1;">
              <span style="display: block; font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Candidate's Choice:</span>
              <strong class="${item.status === 'correct' ? 'text-green' : 'text-rose'}">${studentPickText}</strong>
            </div>
            <div style="flex: 1;">
              <span style="display: block; font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase;">Faculty Answer Key:</span>
              <strong class="text-green">${correctText}</strong>
            </div>
          </div>
          <div style="margin-top: 0.8rem; font-size: 0.85rem; color: var(--text-secondary); background: rgba(59, 130, 246, 0.06); padding: 0.8rem; border-radius: var(--radius-sm);">
            <strong style="color: #93c5fd;">Faculty Concept:</strong> ${formatCodeSnippets(item.explanation)}
          </div>
        `;

        DOM.inspectorQuestionsList.appendChild(qCard);
      });
    }

    DOM.inspectorModal.classList.add('active');
  }

  function closeInspectorModal() {
    DOM.inspectorModal.classList.remove('active');
    adminState.selectedCandidate = null;
  }

  // ==========================================================================
  // QUESTION-LEVEL DIFFICULTY & ERROR ANALYTICS
  // ==========================================================================

  function renderQuestionAnalytics() {
    const records = adminState.records;
    DOM.questionAnalyticsGrid.innerHTML = '';

    QUIZ_QUESTIONS.forEach((q, idx) => {
      let correctAttempts = 0;
      let totalEvaluated = 0;

      records.forEach(r => {
        if (r.breakdown && r.breakdown[idx]) {
          totalEvaluated++;
          if (r.breakdown[idx].status === 'correct') {
            correctAttempts++;
          }
        }
      });

      const accuracy = totalEvaluated > 0
        ? Math.round((correctAttempts / totalEvaluated) * 100)
        : 100; // default baseline

      let diffClass = 'diff-easy';
      let diffLabel = 'Easy (High Accuracy)';

      if (accuracy < 45) {
        diffClass = 'diff-hard';
        diffLabel = 'Hard (High Error)';
      } else if (accuracy < 75) {
        diffClass = 'diff-moderate';
        diffLabel = 'Moderate';
      }

      const tile = document.createElement('div');
      tile.className = 'q-analytic-tile';
      tile.innerHTML = `
        <div class="qat-header">
          <span class="qat-num">Q${idx + 1}</span>
          <span class="diff-badge ${diffClass}">${diffLabel}</span>
        </div>
        <p class="qat-text">${formatCodeSnippets(q.question)}</p>
        <div class="qat-stats-row">
          <span>Topic: <strong style="color: #c4b5fd;">${escapeHtml(q.category)}</strong></span>
          <span>Success: <strong class="text-green">${accuracy}%</strong></span>
        </div>
        <div class="qat-progress-track">
          <div class="qat-progress-fill" style="width: ${accuracy}%;"></div>
        </div>
      `;

      DOM.questionAnalyticsGrid.appendChild(tile);
    });
  }

  // ==========================================================================
  // CSV EXPORT FUNCTIONALITY
  // ==========================================================================

  function exportRecordsToCsv() {
    const records = adminState.records;
    if (records.length === 0) {
      showAdminToast('No candidate records available to export.', 'warning', 3000);
      return;
    }

    const headers = [
      'Record ID',
      'Timestamp',
      'Student Full Name',
      'University Seat Number (USN)',
      'Total Score (/30)',
      'Accuracy Percentage (%)',
      'Duration Taken',
      'Proctoring Violation',
      'Performance Verdict'
    ];

    const rows = records.map(r => [
      r.id || '',
      `"${r.timestamp || ''}"`,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${(r.usn || '').replace(/"/g, '""')}"`,
      r.score || 0,
      r.percentage || 0,
      `"${r.timeTaken || ''}"`,
      r.isDisqualified ? 'DISQUALIFIED (Tab Switch)' : 'CLEAN',
      `"${(r.verdictTitle || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CSE_Placement_Quiz_Results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    showAdminToast('Candidate results exported successfully as CSV.', 'success', 3500);
  }

  // ==========================================================================
  // RESET ALL DATA
  // ==========================================================================

  function handleClearAllRecords() {
    const confirmation = prompt('To permanently delete all candidate test submissions and audit records, type "RESET":');
    if (confirmation === 'RESET') {
      try {
        localStorage.removeItem(STORAGE_KEYS.ATTEMPT_HISTORY);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_ATTEMPT);
        loadAllRecords();
        renderAllViews();
        showAdminToast('All candidate assessment records have been permanently cleared.', 'info', 4000);
      } catch (e) {
        console.warn('Error clearing records:', e);
      }
    } else if (confirmation !== null) {
      showAdminToast('Reset canceled: confirmation text did not match "RESET".', 'warning', 3000);
    }
  }

  // ==========================================================================
  // EVENT BINDINGS
  // ==========================================================================

  function bindAdminEvents() {
    // Toolbar Actions
    DOM.exportCsvBtn.addEventListener('click', exportRecordsToCsv);
    DOM.refreshFeedBtn.addEventListener('click', () => {
      loadAllRecords();
      renderAllViews();
      showAdminToast('Feed refreshed with latest candidate data.', 'success', 2000);
    });
    DOM.clearAllRecordsBtn.addEventListener('click', handleClearAllRecords);

    // Search Query Input
    DOM.candidateSearchInput.addEventListener('input', (e) => {
      adminState.searchQuery = e.target.value.trim();
      renderCandidateTable();
    });

    // Directory Filter Tabs
    const filterTabs = document.querySelectorAll('.dir-filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        adminState.statusFilter = tab.dataset.filter;
        renderCandidateTable();
      });
    });

    // Inspector Modal Actions
    DOM.closeInspectorModalBtn.addEventListener('click', closeInspectorModal);
    DOM.closeInspectorFooterBtn.addEventListener('click', closeInspectorModal);
    DOM.printInspectorSheetBtn.addEventListener('click', () => window.print());

    DOM.inspectorModal.addEventListener('click', (e) => {
      if (e.target === DOM.inspectorModal) {
        closeInspectorModal();
      }
    });

    // Console Lock
    if (DOM.lockAdminBtn) {
      DOM.lockAdminBtn.addEventListener('click', handleLockConsole);
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

  function showAdminToast(message, type = 'info', duration = 3500) {
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
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ==========================================================================
  // FACULTY SECURITY PIN AUTHENTICATION GATE
  // ==========================================================================

  const ADMIN_SECURITY_PIN = 'admin123';
  const SESSION_AUTH_KEY = 'cse_admin_unlocked';

  function checkAdminAuth() {
    const isUnlocked = sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
    if (isUnlocked) {
      if (DOM.adminAuthGate) DOM.adminAuthGate.classList.add('hidden');
      if (DOM.adminMainWrapper) DOM.adminMainWrapper.classList.remove('hidden');
      initAdminConsole();
    } else {
      if (DOM.adminAuthGate) DOM.adminAuthGate.classList.remove('hidden');
      if (DOM.adminMainWrapper) DOM.adminMainWrapper.classList.add('hidden');
      if (DOM.adminPinInput) {
        DOM.adminPinInput.value = '';
        setTimeout(() => {
          if (DOM.adminPinInput) DOM.adminPinInput.focus();
        }, 150);
      }
    }
  }

  function handleUnlockSubmit(e) {
    e.preventDefault();
    const pin = (DOM.adminPinInput ? DOM.adminPinInput.value : '').trim();
    if (pin === ADMIN_SECURITY_PIN) {
      sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
      if (DOM.pinError) DOM.pinError.classList.remove('visible');
      if (DOM.adminAuthGate) DOM.adminAuthGate.classList.add('hidden');
      if (DOM.adminMainWrapper) DOM.adminMainWrapper.classList.remove('hidden');
      initAdminConsole();
      showAdminToast('Faculty Security PIN Verified. Welcome!', 'success', 3000);
    } else {
      if (DOM.pinError) DOM.pinError.classList.add('visible');
      const card = document.querySelector('.admin-auth-card');
      if (card) {
        card.classList.remove('card-shake');
        void card.offsetWidth;
        card.classList.add('card-shake');
      }
      if (DOM.adminPinInput) {
        DOM.adminPinInput.focus();
        DOM.adminPinInput.select();
      }
    }
  }

  function handleLockConsole() {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    if (DOM.adminMainWrapper) DOM.adminMainWrapper.classList.add('hidden');
    if (DOM.adminAuthGate) DOM.adminAuthGate.classList.remove('hidden');
    if (DOM.pinError) DOM.pinError.classList.remove('visible');
    if (DOM.adminPinInput) {
      DOM.adminPinInput.value = '';
      setTimeout(() => {
        if (DOM.adminPinInput) DOM.adminPinInput.focus();
      }, 100);
    }
    showAdminToast('Faculty Console has been locked.', 'info', 2500);
  }

  function setupAuthEvents() {
    if (DOM.adminAuthForm) {
      DOM.adminAuthForm.addEventListener('submit', handleUnlockSubmit);
    }
    if (DOM.adminPinInput) {
      DOM.adminPinInput.addEventListener('input', () => {
        if (DOM.pinError) DOM.pinError.classList.remove('visible');
      });
    }
  }

  // Run initialization
  document.addEventListener('DOMContentLoaded', () => {
    setupAuthEvents();
    checkAdminAuth();
  });

})();
