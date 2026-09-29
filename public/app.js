// SchoolFix — Client Application Logic
document.addEventListener('DOMContentLoaded', () => {
  // State
  let currentView = 'home';
  let reportsData = [];
  let statsData = {};
  let commonProblems = [];
  let selectedFile = null;
  let activeModalReport = null;
  let activeFilterStatus = 'All';
  let activeFilterCategory = 'All';
  let activeSearchQuery = '';

  // Elements
  const navTabs = document.getElementById('navTabs');
  const brandHomeBtn = document.getElementById('brandHomeBtn');
  const viewPanels = document.querySelectorAll('.view-panel');

  // Home View Elements
  const heroReportBtn = document.getElementById('heroReportBtn');
  const heroTrackBtn = document.getElementById('heroTrackBtn');
  const heroAdminBtn = document.getElementById('heroAdminBtn');
  const homeBrowseAllBtn = document.getElementById('homeBrowseAllBtn');
  const homeTotalStat = document.getElementById('homeTotalStat');
  const homeProgressStat = document.getElementById('homeProgressStat');
  const homeFixedStat = document.getElementById('homeFixedStat');

  // Submit Form Elements
  const reportForm = document.getElementById('reportForm');
  const categorySelect = document.getElementById('categorySelect');
  const problemTypeInput = document.getElementById('problemType');
  const locationInput = document.getElementById('locationInput');
  const descInput = document.getElementById('descInput');
  const descCount = document.getElementById('descCount');
  const photoInput = document.getElementById('photoInput');
  const dropzone = document.getElementById('dropzone');
  const dropzoneEmpty = document.getElementById('dropzoneEmpty');
  const dropzonePreview = document.getElementById('dropzonePreview');
  const previewImg = document.getElementById('previewImg');
  const previewName = document.getElementById('previewName');
  const removePhotoBtn = document.getElementById('removePhotoBtn');
  const submitBtn = document.getElementById('submitBtn');
  const successNotice = document.getElementById('successNotice');
  const successTicketId = document.getElementById('successTicketId');
  const viewInTrackerBtn = document.getElementById('viewInTrackerBtn');
  const submitAnotherBtn = document.getElementById('submitAnotherBtn');

  // Common Problems Guide
  const toggleCommonProblemsBtn = document.getElementById('toggleCommonProblemsBtn');
  const commonProblemsGuide = document.getElementById('commonProblemsGuide');
  const closeGuideBtn = document.getElementById('closeGuideBtn');
  const quickProblemGrid = document.getElementById('quickProblemGrid');

  // Track View Elements
  const trackForm = document.getElementById('trackForm');
  const trackInput = document.getElementById('trackInput');
  const trackResult = document.getElementById('trackResult');

  // Admin View Elements
  const reportsTableBody = document.getElementById('reportsTableBody');
  const tableEmptyState = document.getElementById('tableEmptyState');
  const adminSearchInput = document.getElementById('adminSearchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const statusFilterTabs = document.getElementById('statusFilterTabs');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportBtn = document.getElementById('exportBtn');

  // Stat Counters
  const statTotal = document.getElementById('statTotal');
  const statPending = document.getElementById('statPending');
  const statProgress = document.getElementById('statProgress');
  const statFixed = document.getElementById('statFixed');
  const statUrgent = document.getElementById('statUrgent');

  // Modal Elements
  const detailModal = document.getElementById('detailModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const modalTicketId = document.getElementById('modalTicketId');
  const modalStatusBadge = document.getElementById('modalStatusBadge');
  const modalType = document.getElementById('modalType');
  const modalCategory = document.getElementById('modalCategory');
  const modalLocation = document.getElementById('modalLocation');
  const modalUrgency = document.getElementById('modalUrgency');
  const modalReporter = document.getElementById('modalReporter');
  const modalTimestamp = document.getElementById('modalTimestamp');
  const modalDescription = document.getElementById('modalDescription');
  const modalPhotoSection = document.getElementById('modalPhotoSection');
  const modalPhoto = document.getElementById('modalPhoto');
  const modalStatusBtns = document.querySelectorAll('.status-btn');
  const adminNotesInput = document.getElementById('adminNotesInput');
  const saveStatusBtn = document.getElementById('saveStatusBtn');
  const deleteReportBtn = document.getElementById('deleteReportBtn');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // ============================================
  // Initial Boot
  // ============================================
  init();

  async function init() {
    setupNavigation();
    setupHomeEvents();
    setupFormEvents();
    setupCommonProblems();
    setupTracking();
    setupAdminEvents();
    setupModalEvents();

    await loadCatalog();
    await loadReportsAndStats();
  }

  // ============================================
  // Navigation & Home
  // ============================================
  function setupNavigation() {
    navTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-btn');
      if (!btn) return;

      const targetView = btn.getAttribute('data-view');
      switchView(targetView);
    });
  }

  function setupHomeEvents() {
    if (brandHomeBtn) {
      brandHomeBtn.addEventListener('click', () => switchView('home'));
      brandHomeBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          switchView('home');
        }
      });
    }

    if (heroReportBtn) {
      heroReportBtn.addEventListener('click', () => {
        switchView('submit');
        problemTypeInput.focus();
      });
    }

    if (heroTrackBtn) {
      heroTrackBtn.addEventListener('click', () => {
        switchView('track');
        trackInput.focus();
      });
    }

    if (heroAdminBtn) {
      heroAdminBtn.addEventListener('click', () => {
        switchView('admin');
      });
    }

    if (homeBrowseAllBtn) {
      homeBrowseAllBtn.addEventListener('click', () => {
        switchView('submit');
      });
    }

    // Quick Presets on Home Page
    document.querySelectorAll('.shelf-chip, .category-card').forEach(card => {
      card.addEventListener('click', () => {
        const cat = card.getAttribute('data-cat');
        const type = card.getAttribute('data-type');

        if (cat) categorySelect.value = cat;
        if (type) problemTypeInput.value = type;

        let defaultUrgency = 'Medium';
        if (type === 'Power Socket') defaultUrgency = 'Urgent';
        else if (type === 'Plumbing & Toilet' || type === 'Projector / AV') defaultUrgency = 'High';
        else if (type === 'Lighting Fixture') defaultUrgency = 'Low';

        const urgencyRadio = document.querySelector(`input[name="urgency"][value="${defaultUrgency}"]`);
        if (urgencyRadio) urgencyRadio.checked = true;

        switchView('submit');
        locationInput.focus();
        showToast(`Reporting ${type}. Please enter the room location.`);
      });
    });
  }

  function switchView(viewName) {
    currentView = viewName;

    // Update nav tab styling
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });

    // Update panel visibility
    viewPanels.forEach(panel => {
      const match = panel.id === `${viewName}View`;
      panel.classList.toggle('active', match);
    });

    if (viewName === 'admin') {
      loadReportsAndStats();
    }
  }

  // ============================================
  // Catalog & Common Problems Guide
  // ============================================
  async function loadCatalog() {
    try {
      const res = await fetch('/api/catalog');
      const data = await res.json();
      if (data.success && data.data) {
        commonProblems = data.data;
        renderCommonProblemsGrid();
      }
    } catch (err) {
      console.warn('Could not load catalog:', err);
    }
  }

  function renderCommonProblemsGrid() {
    quickProblemGrid.innerHTML = '';
    commonProblems.forEach(group => {
      group.items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'quick-problem-item';
        card.innerHTML = `
          <div class="quick-item-top">
            <span class="quick-item-title">${escapeHtml(item.type)}</span>
            <span class="quick-item-cat">${escapeHtml(group.category)}</span>
          </div>
          <p class="quick-item-desc">${escapeHtml(item.desc)}</p>
        `;

        card.addEventListener('click', () => {
          // Pre-fill form
          categorySelect.value = group.category;
          problemTypeInput.value = item.type;
          
          // Select urgency
          const urgencyRadio = document.querySelector(`input[name="urgency"][value="${item.defaultUrgency}"]`);
          if (urgencyRadio) urgencyRadio.checked = true;

          // Helper hint in description if blank
          if (!descInput.value.trim()) {
            descInput.value = item.desc + ' ';
            updateDescCount();
          }

          // Close guide and highlight form
          commonProblemsGuide.classList.add('hidden');
          locationInput.focus();
          showToast(`Selected "${item.type}". Please specify the location.`);
        });

        quickProblemGrid.appendChild(card);
      });
    });
  }

  function setupCommonProblems() {
    toggleCommonProblemsBtn.addEventListener('click', () => {
      commonProblemsGuide.classList.toggle('hidden');
    });

    closeGuideBtn.addEventListener('click', () => {
      commonProblemsGuide.classList.add('hidden');
    });
  }

  // ============================================
  // Form Events (Report Submission)
  // ============================================
  function setupFormEvents() {
    // Quick Location Chips
    document.querySelectorAll('.loc-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-loc');
        locationInput.value = val;
        locationInput.focus();
      });
    });

    // Character Counter
    descInput.addEventListener('input', updateDescCount);

    function updateDescCount() {
      const len = descInput.value.length;
      descCount.textContent = `${len}/400`;
    }

    // Drag and Drop & Photo Input
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    photoInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });

    removePhotoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearPhoto();
    });

    function handleFileSelect(file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (JPG, PNG, WEBP).', 'error');
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        showToast('File size must be under 8MB.', 'error');
        return;
      }

      selectedFile = file;
      previewName.textContent = file.name;

      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        dropzoneEmpty.classList.add('hidden');
        dropzonePreview.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }

    function clearPhoto() {
      selectedFile = null;
      photoInput.value = '';
      previewImg.src = '';
      previewName.textContent = '';
      dropzonePreview.classList.add('hidden');
      dropzoneEmpty.classList.remove('hidden');
    }

    // Reset Form
    reportForm.addEventListener('reset', () => {
      clearPhoto();
      setTimeout(updateDescCount, 10);
    });

    // Submit Report Form
    reportForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const type = problemTypeInput.value.trim();
      const category = categorySelect.value;
      const location = locationInput.value.trim();
      const urgency = document.querySelector('input[name="urgency"]:checked')?.value || 'Medium';
      const description = descInput.value.trim();
      const reporterRole = document.getElementById('reporterRole').value;
      const reporterName = document.getElementById('reporterName').value.trim() || 'Anonymous';

      if (!type || !location || !description) {
        showToast('Please fill out all required fields.', 'error');
        return;
      }

      setSubmitLoading(true);

      try {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('category', category);
        formData.append('location', location);
        formData.append('urgency', urgency);
        formData.append('description', description);
        formData.append('reporterRole', reporterRole);
        formData.append('reporterName', reporterName);

        if (selectedFile) {
          formData.append('photo', selectedFile);
        }

        const res = await fetch('/api/reports', {
          method: 'POST',
          body: formData
        });

        const result = await res.json();

        if (result.success && result.data) {
          reportForm.reset();
          clearPhoto();
          updateDescCount();

          // Show confirmation card
          successTicketId.textContent = result.data.id;
          successNotice.classList.remove('hidden');
          showToast(`Ticket ${result.data.id} created successfully!`, 'success');

          // Action buttons on confirmation card
          viewInTrackerBtn.onclick = () => {
            trackInput.value = result.data.id;
            switchView('track');
            lookupTicket(result.data.id);
            successNotice.classList.add('hidden');
          };

          submitAnotherBtn.onclick = () => {
            successNotice.classList.add('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          };
        } else {
          showToast(result.message || 'Submission failed.', 'error');
        }
      } catch (err) {
        console.error('Submission error:', err);
        showToast('Network error while submitting report.', 'error');
      } finally {
        setSubmitLoading(false);
      }
    });

    function setSubmitLoading(isLoading) {
      submitBtn.disabled = isLoading;
      const text = submitBtn.querySelector('.btn-text');
      const loader = submitBtn.querySelector('.btn-loader');
      if (isLoading) {
        text.classList.add('hidden');
        loader.classList.remove('hidden');
      } else {
        text.classList.remove('hidden');
        loader.classList.add('hidden');
      }
    }
  }

  // ============================================
  // Tracking
  // ============================================
  function setupTracking() {
    trackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = trackInput.value.trim();
      if (id) {
        lookupTicket(id);
      }
    });

    // Sample ticket chips
    document.querySelectorAll('.sample-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.getAttribute('data-id');
        trackInput.value = id;
        lookupTicket(id);
      });
    });
  }

  async function lookupTicket(ticketId) {
    trackResult.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">Looking up ticket ${escapeHtml(ticketId)}...</p>`;
    trackResult.classList.remove('hidden');

    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(ticketId)}`);
      const data = await res.json();

      if (data.success && data.data) {
        renderTrackResult(data.data);
      } else {
        trackResult.innerHTML = `
          <div class="empty-state">
            <p class="empty-title">Ticket Not Found</p>
            <p class="empty-sub">No maintenance report exists with reference "${escapeHtml(ticketId)}". Check the ticket code and try again.</p>
          </div>
        `;
      }
    } catch (err) {
      trackResult.innerHTML = `
        <div class="empty-state">
          <p class="empty-title">Error</p>
          <p class="empty-sub">Failed to connect to the facility server.</p>
        </div>
      `;
    }
  }

  function renderTrackResult(report) {
    const isPending = report.status === 'Pending';
    const isProgress = report.status === 'In Progress';
    const isFixed = report.status === 'Fixed';

    let progressFill = '0%';
    if (isProgress) progressFill = '50%';
    if (isFixed) progressFill = '100%';

    const statusBadgeClass = report.status.toLowerCase().replace(/\s+/g, '');

    trackResult.innerHTML = `
      <div class="track-result-card">
        <div class="track-result-head">
          <div>
            <div class="track-ticket-id mono">${escapeHtml(report.id)}</div>
            <div class="track-ticket-item">${escapeHtml(report.type)} &bull; ${escapeHtml(report.location)}</div>
          </div>
          <span class="status-badge status-${statusBadgeClass}">
            <span class="indicator ${report.status === 'Fixed' ? 'fixed' : (report.status === 'In Progress' ? 'medium' : 'low')}"></span>
            ${escapeHtml(report.status)}
          </span>
        </div>

        <!-- 3-stage Lifecycle Stepper -->
        <div class="lifecycle-stepper">
          <div class="lifecycle-line">
            <div class="lifecycle-line-fill" style="width: ${progressFill};"></div>
          </div>
          
          <div class="step-node ${isPending ? 'active' : 'completed'}">
            <div class="step-circle">1</div>
            <span class="step-label">Pending</span>
          </div>

          <div class="step-node ${isProgress ? 'active' : (isFixed ? 'completed' : '')}">
            <div class="step-circle">2</div>
            <span class="step-label">In Progress</span>
          </div>

          <div class="step-node ${isFixed ? 'completed active' : ''}">
            <div class="step-circle">3</div>
            <span class="step-label">Fixed</span>
          </div>
        </div>

        <div class="modal-info-grid" style="margin-top: 20px;">
          <div class="info-block">
            <span class="info-label">Category</span>
            <p class="info-val">${escapeHtml(report.category || 'General')}</p>
          </div>
          <div class="info-block">
            <span class="info-label">Urgency</span>
            <p class="info-val">${escapeHtml(report.urgency || 'Normal')}</p>
          </div>
          <div class="info-block">
            <span class="info-label">Reported By</span>
            <p class="info-val">${escapeHtml(report.reporterName)} (${escapeHtml(report.reporterRole)})</p>
          </div>
          <div class="info-block">
            <span class="info-label">Logged Date</span>
            <p class="info-val mono">${formatDate(report.createdAt)}</p>
          </div>
        </div>

        <div class="modal-section" style="margin-top: 16px;">
          <span class="info-label">Defect Description</span>
          <div class="modal-text-box">${escapeHtml(report.description)}</div>
        </div>

        ${report.notes ? `
          <div class="modal-section" style="margin-top: 16px;">
            <span class="info-label">Technician Log / Action Taken</span>
            <div class="modal-text-box" style="border-color: var(--border-active); color: var(--text-main); font-weight: 500;">
              ${escapeHtml(report.notes)}
            </div>
          </div>
        ` : ''}

        ${report.photoUrl ? `
          <div class="modal-section" style="margin-top: 16px;">
            <span class="info-label">Photo</span>
            <div class="modal-photo-wrap" style="max-height: 180px;">
              <img src="${escapeHtml(report.photoUrl)}" alt="Attachment">
            </div>
          </div>
        ` : ''}

      </div>
    `;
  }

  // ============================================
  // Admin Dashboard
  // ============================================
  function setupAdminEvents() {
    // Status Filter Tabs
    statusFilterTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.filter-tab');
      if (!tab) return;

      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      activeFilterStatus = tab.getAttribute('data-status');
      renderAdminTable();
    });

    // Category Filter
    categoryFilter.addEventListener('change', (e) => {
      activeFilterCategory = e.target.value;
      renderAdminTable();
    });

    // Search Input
    let debounceTimer;
    adminSearchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        activeSearchQuery = e.target.value.toLowerCase().trim();
        renderAdminTable();
      }, 150);
    });

    // Refresh
    refreshBtn.addEventListener('click', async () => {
      await loadReportsAndStats();
      showToast('Maintenance records refreshed.');
    });

    // Export CSV
    exportBtn.addEventListener('click', exportReportsCSV);

    // Stat card quick filters
    document.querySelectorAll('.stat-card').forEach(card => {
      card.addEventListener('click', () => {
        const filterStatus = card.getAttribute('data-filter-status');
        const filterUrgency = card.getAttribute('data-filter-urgency');

        if (filterStatus) {
          activeFilterStatus = filterStatus;
          document.querySelectorAll('.filter-tab').forEach(t => {
            t.classList.toggle('active', t.getAttribute('data-status') === filterStatus);
          });
          renderAdminTable();
        } else if (filterUrgency) {
          activeSearchQuery = 'urgent';
          adminSearchInput.value = 'Urgent';
          renderAdminTable();
        }
      });
    });
  }

  async function loadReportsAndStats() {
    try {
      const [reportsRes, statsRes] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/stats')
      ]);

      const reportsJson = await reportsRes.json();
      const statsJson = await statsRes.json();

      if (reportsJson.success) {
        reportsData = reportsJson.data || [];
        renderAdminTable();
      }

      if (statsJson.success) {
        statsData = statsJson.stats || {};
        updateStatsUI();
      }
    } catch (err) {
      console.error('Failed to load reports/stats:', err);
    }
  }

  function updateStatsUI() {
    statTotal.textContent = statsData.total || 0;
    statPending.textContent = statsData.pending || 0;
    statProgress.textContent = statsData.inProgress || 0;
    statFixed.textContent = statsData.fixed || 0;
    statUrgent.textContent = statsData.urgent || 0;

    if (homeTotalStat) homeTotalStat.textContent = statsData.total || 0;
    if (homeProgressStat) homeProgressStat.textContent = statsData.inProgress || 0;
    if (homeFixedStat) homeFixedStat.textContent = statsData.fixed || 0;
  }

  function renderAdminTable() {
    let filtered = reportsData.slice();

    // Filter by Status
    if (activeFilterStatus !== 'All') {
      filtered = filtered.filter(r => r.status.toLowerCase() === activeFilterStatus.toLowerCase());
    }

    // Filter by Category
    if (activeFilterCategory !== 'All') {
      filtered = filtered.filter(r => r.category && r.category.toLowerCase() === activeFilterCategory.toLowerCase());
    }

    // Search query
    if (activeSearchQuery) {
      filtered = filtered.filter(r => {
        const hay = [
          r.id,
          r.type,
          r.category,
          r.location,
          r.description,
          r.reporterName,
          r.urgency,
          r.status
        ].join(' ').toLowerCase();
        return hay.includes(activeSearchQuery);
      });
    }

    if (filtered.length === 0) {
      reportsTableBody.innerHTML = '';
      tableEmptyState.classList.remove('hidden');
      return;
    }

    tableEmptyState.classList.add('hidden');
    reportsTableBody.innerHTML = '';

    filtered.forEach(report => {
      const tr = document.createElement('tr');

      const urgencyClass = (report.urgency || 'Normal').toLowerCase();
      const statusClass = report.status.toLowerCase().replace(/\s+/g, '');

      tr.innerHTML = `
        <td class="td-id">${escapeHtml(report.id)}</td>
        <td>
          <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(report.type)}</div>
          <div class="td-location">${escapeHtml(report.location)}</div>
        </td>
        <td class="td-desc" title="${escapeHtml(report.description)}">${escapeHtml(report.description)}</td>
        <td>
          <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px;">
            <span class="indicator ${urgencyClass}"></span>
            ${escapeHtml(report.urgency || 'Normal')}
          </span>
        </td>
        <td>
          <div style="font-size: 12.5px; color: var(--text-main);">${escapeHtml(report.reporterName)}</div>
          <div style="font-size: 11px; color: var(--text-dim);">${escapeHtml(report.reporterRole)}</div>
        </td>
        <td>
          ${report.photoUrl ? `
            <img src="${escapeHtml(report.photoUrl)}" class="td-thumb" alt="Thumbnail" data-report-id="${report.id}">
          ` : `
            <span class="no-photo-badge">None</span>
          `}
        </td>
        <td>
          <select class="status-select-inline" data-report-id="${report.id}">
            <option value="Pending" ${report.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="In Progress" ${report.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Fixed" ${report.status === 'Fixed' ? 'selected' : ''}>Fixed</option>
          </select>
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn-ghost view-report-btn" data-report-id="${report.id}" style="padding: 4px 8px; font-size: 12px;">
            Inspect
          </button>
        </td>
      `;

      // Inline status change handler
      const select = tr.querySelector('.status-select-inline');
      select.addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        await updateReportStatus(report.id, newStatus);
      });

      // View details button
      const inspectBtn = tr.querySelector('.view-report-btn');
      inspectBtn.addEventListener('click', () => {
        openDetailModal(report);
      });

      // Thumbnail click opens modal
      const thumb = tr.querySelector('.td-thumb');
      if (thumb) {
        thumb.addEventListener('click', () => {
          openDetailModal(report);
        });
      }

      reportsTableBody.appendChild(tr);
    });
  }

  // ============================================
  // Status Update API & Modal Logic
  // ============================================
  async function updateReportStatus(id, newStatus, notes = undefined) {
    try {
      const payload = { status: newStatus };
      if (notes !== undefined) {
        payload.notes = notes;
      }

      const res = await fetch(`/api/reports/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Status updated to ${newStatus}`, 'success');
        await loadReportsAndStats();
        if (activeModalReport && activeModalReport.id === id) {
          activeModalReport = data.data;
          syncModalData(data.data);
        }
      } else {
        showToast(data.message || 'Status update failed.', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Network error while updating status.', 'error');
    }
  }

  function setupModalEvents() {
    closeModalBtn.addEventListener('click', closeDetailModal);
    cancelModalBtn.addEventListener('click', closeDetailModal);

    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) {
        closeDetailModal();
      }
    });

    // Status buttons inside modal
    modalStatusBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modalStatusBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    // Save changes inside modal
    saveStatusBtn.addEventListener('click', async () => {
      if (!activeModalReport) return;

      const selectedBtn = document.querySelector('.status-btn.selected');
      const newStatus = selectedBtn ? selectedBtn.getAttribute('data-set-status') : activeModalReport.status;
      const notes = adminNotesInput.value.trim();

      await updateReportStatus(activeModalReport.id, newStatus, notes);
      closeDetailModal();
    });

    // Delete ticket inside modal
    deleteReportBtn.addEventListener('click', async () => {
      if (!activeModalReport) return;

      const confirmed = confirm(`Are you sure you want to permanently delete ticket ${activeModalReport.id}?`);
      if (!confirmed) return;

      try {
        const res = await fetch(`/api/reports/${activeModalReport.id}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Ticket ${activeModalReport.id} removed.`, 'success');
          closeDetailModal();
          await loadReportsAndStats();
        } else {
          showToast('Failed to delete report.', 'error');
        }
      } catch (err) {
        showToast('Network error deleting report.', 'error');
      }
    });
  }

  function openDetailModal(report) {
    activeModalReport = report;
    syncModalData(report);
    detailModal.classList.remove('hidden');
  }

  function syncModalData(report) {
    modalTicketId.textContent = report.id;
    
    // Status Badge
    const statusClass = report.status.toLowerCase().replace(/\s+/g, '');
    modalStatusBadge.className = `status-badge status-${statusClass}`;
    modalStatusBadge.textContent = report.status;

    modalType.textContent = report.type;
    modalCategory.textContent = report.category || 'General';
    modalLocation.textContent = report.location;
    modalUrgency.textContent = report.urgency || 'Normal';
    modalReporter.textContent = `${report.reporterName} (${report.reporterRole})`;
    modalTimestamp.textContent = formatDate(report.createdAt);
    modalDescription.textContent = report.description;

    // Photo
    if (report.photoUrl) {
      modalPhoto.src = report.photoUrl;
      modalPhotoSection.classList.remove('hidden');
    } else {
      modalPhotoSection.classList.add('hidden');
    }

    // Modal Status Selector Buttons
    modalStatusBtns.forEach(btn => {
      const match = btn.getAttribute('data-set-status') === report.status;
      btn.classList.toggle('selected', match);
    });

    // Admin Notes
    adminNotesInput.value = report.notes || '';
  }

  function closeDetailModal() {
    detailModal.classList.add('hidden');
    activeModalReport = null;
  }

  // ============================================
  // Export CSV
  // ============================================
  function exportReportsCSV() {
    if (!reportsData.length) {
      showToast('No records available to export.');
      return;
    }

    const headers = ['ID', 'Type', 'Category', 'Location', 'Urgency', 'Reporter', 'Role', 'Status', 'LoggedAt', 'Notes'];
    const rows = reportsData.map(r => [
      `"${r.id}"`,
      `"${(r.type || '').replace(/"/g, '""')}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      `"${(r.location || '').replace(/"/g, '""')}"`,
      `"${r.urgency || ''}"`,
      `"${(r.reporterName || '').replace(/"/g, '""')}"`,
      `"${r.reporterRole || ''}"`,
      `"${r.status || ''}"`,
      `"${r.createdAt || ''}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `schoolfix-reports-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Exported CSV file successfully.', 'success');
  }

  // ============================================
  // Utility Functions
  // ============================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease-out';
      setTimeout(() => toast.remove(), 200);
    }, 3200);
  }

  function formatDate(isoStr) {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
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
});
