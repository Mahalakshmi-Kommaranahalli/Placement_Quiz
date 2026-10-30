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

  const cloudClientPromise = import('./cloud-client.js').then(module => module.quizCloud);

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
    activeSessions: [],
    searchQuery: '',
    statusFilter: 'all',
    selectedCandidate: null,
    cloudErrorShown: false
  };

  // DOM Elements Cache
  const DOM = {
    // Auth Gate
    adminAuthGate: document.getElementById('adminAuthGate'),
    adminAuthCard: document.querySelector('.admin-auth-card'),
    adminAuthForm: document.getElementById('adminAuthForm'),
    adminEmailInput: document.getElementById('adminEmailInput'),
    adminPasswordInput: document.getElementById('adminPasswordInput'),
    adminAuthModeToggle: document.getElementById('adminAuthModeToggle'),
    adminAuthModeLabel: document.getElementById('adminAuthModeLabel'),
    adminAuthSubmitLabel: document.getElementById('adminAuthSubmitLabel'),
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
    countTabActive: document.getElementById('countTabActive'),
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
  let isAdminSignUp = false;
  let isAdminVerified = false;
  let cloudRefreshInterval = null;

  function initAdminConsole() {
    if (!isConsoleInitialized) {
      bindAdminEvents();
      setupLiveBroadcasting();
      isConsoleInitialized = true;
    }
    loadAllRecords();
    renderAllViews();
    refreshCloudRecords();
    if (!cloudRefreshInterval) {
      cloudRefreshInterval = setInterval(refreshCloudRecords, 3000);
    }
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
        refreshCloudRecords();
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
        refreshCloudRecords();
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
          adminState.activeSessions = [active];
        } else {
          adminState.activeSessions = [];
        }
      } else {
        adminState.activeSessions = [];
      }
    } catch (e) {
      adminState.activeSessions = [];
    }
  }

  function mapCloudAttempt(attempt) {
    return {
      id: attempt.id,
      name: attempt.name,
      usn: attempt.usn,
      timestamp: attempt.started_at,
      score: Number(attempt.score || 0),
      percentage: Number(attempt.percentage || 0),
      timeTaken: attempt.time_taken || '',
      isDisqualified: Boolean(attempt.is_disqualified),
      verdictTitle: attempt.verdict_title || '',
      breakdown: attempt.breakdown || [],
      status: attempt.status,
      currentQuestionIndex: Math.max(0, Number(attempt.current_question || 1) - 1),
      answeredCount: Number(attempt.answered_count || 0),
      remainingSeconds: Number(attempt.remaining_seconds || 0),
      userAnswers: attempt.user_answers || {},
      remoteRecord: true
    };
  }

  async function refreshCloudRecords() {
    try {
      if (!isAdminVerified) return;
      const client = await cloudClientPromise;
      const { data, error } = await client
        .from('quiz_attempts')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const legacyRecords = adminState.records.filter(record => !record.remoteRecord);
      const remoteRecords = (data || []).map(mapCloudAttempt);
      adminState.records = [...remoteRecords, ...legacyRecords];
      adminState.activeSessions = remoteRecords.filter(record => record.status === 'active');
      adminState.cloudErrorShown = false;
      DOM.syncStatusText.textContent = `Live Feed Active • Updated ${new Date().toLocaleTimeString()}`;
      renderAllViews();
    } catch (error) {
      console.error('Leaderboard refresh failed:', error);
      DOM.syncStatusText.textContent = 'Database sync error';
      if (!adminState.cloudErrorShown) {
        adminState.cloudErrorShown = true;
        showAdminToast('Could not refresh the shared student leaderboard. Check the network and database connection.', 'warning', 6000);
      }
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
    const completedRecords = records.filter(record => record.status !== 'active');
    const total = completedRecords.length;

    DOM.kpiTotalCandidates.textContent = records.length;

    if (total === 0) {
      DOM.kpiAverageScore.innerHTML = `0.0 <small>/ 30</small>`;
      DOM.kpiAveragePct.textContent = `0.0% Mean Accuracy`;
      DOM.kpiPlacementReadyCount.textContent = '0';
      DOM.kpiPlacementReadyPct.textContent = `0% of cohort`;
      DOM.kpiHighScore.innerHTML = `0 <small>/ 30</small>`;
      DOM.kpiHighScoreStudent.textContent = records.length ? 'No completed attempts yet' : 'No submissions';
      DOM.kpiViolationCount.textContent = '0';
    } else {
      // Average Score
      const totalScoreSum = completedRecords.reduce((sum, r) => sum + Number(r.score || 0), 0);
      const avgScore = (totalScoreSum / total).toFixed(1);
      const avgPct = ((totalScoreSum / (total * 30)) * 100).toFixed(1);

      DOM.kpiAverageScore.innerHTML = `${avgScore} <small>/ 30</small>`;
      DOM.kpiAveragePct.textContent = `${avgPct}% Mean Accuracy`;

      // Placement Ready Count (Score >= 27)
      const placementReady = completedRecords.filter(r => Number(r.score || 0) >= 27);
      const readyPct = Math.round((placementReady.length / total) * 100);
      DOM.kpiPlacementReadyCount.textContent = placementReady.length;
      DOM.kpiPlacementReadyPct.textContent = `${readyPct}% of cohort`;

      // High Score
      let topRecord = completedRecords[0];
      completedRecords.forEach(r => {
        if (Number(r.score || 0) > Number(topRecord.score || 0)) {
          topRecord = r;
        }
      });
      DOM.kpiHighScore.innerHTML = `${topRecord.score} <small>/ 30</small>`;
      DOM.kpiHighScoreStudent.textContent = `${topRecord.name} (${topRecord.usn})`;

      // Violations Count
      const violations = completedRecords.filter(r => r.isDisqualified === true);
      DOM.kpiViolationCount.textContent = violations.length;
    }

    // Active Sessions
    const activeCount = adminState.activeSessions.length;
    if (activeCount > 0) {
      DOM.kpiActiveSessionsCount.textContent = `${activeCount} Active`;
      DOM.kpiActiveDetails.textContent = activeCount === 1
        ? `${adminState.activeSessions[0].name || adminState.activeSessions[0].studentName} is testing`
        : 'Students are currently testing';
    } else {
      DOM.kpiActiveSessionsCount.textContent = '0';
      DOM.kpiActiveDetails.textContent = `No active candidate`;
    }
  }

  // ==========================================================================
  // REAL-TIME ACTIVE SESSIONS FEED
  // ==========================================================================

  function renderActiveSessions() {
    const activeSessions = adminState.activeSessions;

    if (activeSessions.length === 0) {
      DOM.activeSessionsSection.classList.add('hidden');
      DOM.activeSessionsList.innerHTML = '';
      return;
    }

    DOM.activeSessionsSection.classList.remove('hidden');
    DOM.activeSessionsList.innerHTML = activeSessions.map(active => {
      const answeredCount = active.answeredCount === undefined
        ? Object.keys(active.userAnswers || {}).length
        : active.answeredCount;
      const currentQuestion = active.currentQuestionIndex || 0;
      return `
        <div class="active-session-tile">
          <div class="ast-info">
            <strong>${escapeHtml(active.name || active.studentName)}</strong>
            <span>USN: ${escapeHtml(active.usn || active.studentUSN)}</span>
          </div>
          <div class="ast-meta">
            <span class="badge-live">● Testing Live</span>
            <div>Q${currentQuestion + 1} of 30 • ${answeredCount} answered</div>
            <small style="color: #60a5fa; font-family: var(--font-mono);">${formatTime(active.remainingSeconds || 0)} remaining</small>
          </div>
        </div>
      `;
    }).join('');
  }

  // ==========================================================================
  // CANDIDATE SUBMISSIONS DIRECTORY TABLE
  // ==========================================================================

  function renderCandidateTable() {
    const records = adminState.records;

    // Filter counts
    const countCompleted = records.filter(r => r.status !== 'active' && !r.isDisqualified).length;
    const countDisqualified = records.filter(r => r.isDisqualified).length;
    const countTop = records.filter(r => r.status !== 'active' && Number(r.score || 0) >= 27).length;

    DOM.countTabAll.textContent = records.length;
    DOM.countTabActive.textContent = records.filter(r => r.status === 'active').length;
    DOM.countTabCompleted.textContent = countCompleted;
    DOM.countTabDisqualified.textContent = countDisqualified;
    DOM.countTabTop.textContent = countTop;

    // Apply Filter & Search Query
    let filtered = records.filter(r => {
      // 1. Status Filter
      if (adminState.statusFilter === 'active' && r.status !== 'active') return false;
      if (adminState.statusFilter === 'completed' && (r.status === 'active' || r.isDisqualified)) return false;
      if (adminState.statusFilter === 'disqualified' && !r.isDisqualified) return false;
      if (adminState.statusFilter === 'top' && (r.status === 'active' || Number(r.score || 0) < 27)) return false;

      // 2. Search Query
      if (adminState.searchQuery) {
        const q = adminState.searchQuery.toLowerCase();
        const nameMatch = (r.name || r.studentName || '').toLowerCase().includes(q);
        const usnMatch = (r.usn || r.studentUSN || '').toLowerCase().includes(q);
        return nameMatch || usnMatch;
      }

      return true;
    });

    if (filtered.length === 0) {
      DOM.candidatesTableBody.innerHTML = '';
      const emptyStateDescription = DOM.tableEmptyState.querySelector('p');
      if (emptyStateDescription) {
        emptyStateDescription.textContent = records.length === 0
          ? 'No student attempts yet. Students who create an account and start the assessment will appear here automatically.'
          : 'No student attempts match your search or selected filter.';
      }
      DOM.tableEmptyState.classList.remove('hidden');
      return;
    }

    DOM.tableEmptyState.classList.add('hidden');
    let rowsHtml = '';

    filtered.forEach((r, idx) => {
      const isActive = r.status === 'active';
      const isViolation = Boolean(r.isDisqualified);
      const statusBadge = isActive
        ? `<span class="status-badge status-active">● Live • Q${Number(r.currentQuestionIndex || 0) + 1} / 30 • ${Number(r.answeredCount === undefined ? Object.keys(r.userAnswers || {}).length : r.answeredCount)} answered</span>`
        : isViolation
          ? `<span class="status-badge status-disqualified">⚠️ Disqualified (Tab Switch)</span>`
          : `<span class="status-badge status-completed">✓ Completed</span>`;

      rowsHtml += `
        <tr>
          <td><span style="font-family: var(--font-mono); color: var(--text-dim);">#${filtered.length - idx}</span></td>
          <td>${escapeHtml(r.timestamp || '')}</td>
          <td class="student-col">
            <strong>${escapeHtml(r.name || r.studentName)}</strong>
          </td>
          <td>
            <small style="font-family: var(--font-mono); color: #a78bfa; font-weight: 700;">${escapeHtml(r.usn || r.studentUSN)}</small>
          </td>
          <td>
            <strong class="${isActive ? 'text-blue' : isViolation ? 'text-rose' : 'text-green'}">${isActive ? '—' : r.score}</strong> <span style="color: var(--text-dim);">/ 30</span>
          </td>
          <td>
            <strong class="text-blue">${isActive ? '—' : `${r.percentage}%`}</strong>
          </td>
          <td>${isActive ? `${formatTime(r.remainingSeconds || 0)} left` : escapeHtml(r.timeTaken || 'N/A')}</td>
          <td>${statusBadge}</td>
          <td>
            <span class="meta-pill ${isViolation ? 'pill-violation' : 'pill-primary'}" style="font-size: 0.72rem;">
              ${escapeHtml(isActive ? 'Assessment in progress' : r.verdictTitle || 'Assessment Finalized')}
            </span>
          </td>
          <td>
            ${isActive ? '<span>—</span>' : `<button type="button" class="btn btn-secondary btn-sm inspect-btn" data-record-id="${r.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Inspect</span>
            </button>`}
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

  async function handleClearAllRecords() {
    const confirmation = prompt('To permanently delete all candidate test submissions and audit records, type "RESET":');
    if (confirmation === 'RESET') {
      try {
        localStorage.removeItem(STORAGE_KEYS.ATTEMPT_HISTORY);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_ATTEMPT);
        const client = await cloudClientPromise;
        const { error } = await client
          .from('quiz_attempts')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        loadAllRecords();
        renderAllViews();
        await refreshCloudRecords();
        showAdminToast('All candidate assessment records have been permanently cleared.', 'info', 4000);
      } catch (e) {
        console.error('Error clearing records:', e);
        showAdminToast('Could not clear the shared leaderboard. Verify faculty access and try again.', 'warning', 6000);
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
      refreshCloudRecords();
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

  function showAdminAuthGate(message) {
    if (DOM.adminAuthGate) DOM.adminAuthGate.classList.remove('hidden');
    if (DOM.adminMainWrapper) DOM.adminMainWrapper.classList.add('hidden');
    if (message) DOM.adminAuthModeLabel.textContent = message;
  }

  async function checkAdminAuth() {
    try {
      const client = await cloudClientPromise;
      const { data: sessionData, error } = await client.auth.getSession();
      if (error) throw error;
      if (!sessionData || !sessionData.user) {
        showAdminAuthGate('Sign in with the authorized faculty account to view student records.');
        return;
      }

      const { data: isAdmin, error: roleError } = await client.rpc('is_quiz_admin');
      if (roleError) throw roleError;
      if (isAdmin !== true) {
        await client.auth.signOut();
        isAdminVerified = false;
        showAdminAuthGate('This account is not authorized to view the leaderboard.');
        return;
      }

      isAdminVerified = true;
      DOM.adminAuthGate.classList.add('hidden');
      DOM.adminMainWrapper.classList.remove('hidden');
      initAdminConsole();
    } catch (error) {
      console.error('Admin authentication check failed:', error);
      showAdminAuthGate('Could not verify access with the database. Check your connection and sign in again.');
    }
  }

  async function handleUnlockSubmit(e) {
    e.preventDefault();
    const email = DOM.adminEmailInput.value.trim().toLowerCase();
    const password = DOM.adminPasswordInput.value;
    DOM.unlockAdminBtn.disabled = true;
    DOM.adminAuthSubmitLabel.textContent = 'Connecting...';

    try {
      const client = await cloudClientPromise;
      const result = isAdminSignUp
        ? await client.auth.signUp.email({ email, password, name: 'Faculty Administrator' })
        : await client.auth.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message);

      const { data: isAdmin, error } = await client.rpc('is_quiz_admin');
      if (error) throw error;
      if (isAdmin !== true) {
        await client.auth.signOut();
        throw new Error('This account is not authorized for the faculty leaderboard.');
      }

      isAdminVerified = true;
      DOM.adminAuthGate.classList.add('hidden');
      DOM.adminMainWrapper.classList.remove('hidden');
      DOM.adminPasswordInput.value = '';
      initAdminConsole();
      await refreshCloudRecords();
      showAdminToast('Faculty account verified. Live leaderboard connected.', 'success', 3500);
    } catch (error) {
      console.error('Admin sign-in failed:', error);
      showAdminAuthGate(error.message || 'Sign-in failed. Check your account and try again.');
    } finally {
      DOM.unlockAdminBtn.disabled = false;
      DOM.adminAuthSubmitLabel.textContent = isAdminSignUp ? 'Create Account' : 'Sign In';
    }
  }

  async function handleLockConsole() {
    isAdminVerified = false;
    try {
      const client = await cloudClientPromise;
      const { error } = await client.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Admin sign-out failed:', error);
      showAdminToast('Unable to sign out cleanly. Close this tab to end the session.', 'warning', 5000);
    }
    if (DOM.adminMainWrapper) DOM.adminMainWrapper.classList.add('hidden');
    if (DOM.adminAuthGate) DOM.adminAuthGate.classList.remove('hidden');
    DOM.adminPasswordInput.value = '';
    showAdminToast('Faculty Console has been locked.', 'info', 2500);
  }

  function toggleAdminAuthMode() {
    isAdminSignUp = !isAdminSignUp;
    DOM.adminAuthSubmitLabel.textContent = isAdminSignUp ? 'Create Account' : 'Sign In';
    DOM.adminAuthModeLabel.textContent = isAdminSignUp
      ? 'Create an account using the authorized faculty email.'
      : 'Sign in with your authorized faculty account.';
    DOM.adminAuthModeToggle.textContent = isAdminSignUp ? 'Back to sign in' : 'Create account';
    DOM.adminPasswordInput.autocomplete = isAdminSignUp ? 'new-password' : 'current-password';
  }

  function setupAuthEvents() {
    if (DOM.adminAuthForm) {
      DOM.adminAuthForm.addEventListener('submit', handleUnlockSubmit);
    }
    DOM.adminAuthModeToggle.addEventListener('click', toggleAdminAuthMode);
  }

  // Run initialization
  document.addEventListener('DOMContentLoaded', () => {
    setupAuthEvents();
    checkAdminAuth();
  });

})();
