import { requireAuth, setupNavigation } from '../utils/authGuard.js';
import { learningPathApi } from '../api/learningPathApi.js';
import { showToast } from '../utils/notifications.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setupNavigation('learning-path');

  let recommendations = [];
  let currentFilter = 'ALL';

  const container = document.getElementById('recommendations-container');
  const btnRegenerate = document.getElementById('btn-generate-recs');
  const filterButtons = document.querySelectorAll('#status-filter-group button');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderRecommendations();
    });
  });

  btnRegenerate.addEventListener('click', async () => {
    btnRegenerate.disabled = true;
    btnRegenerate.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Analyzing Gaps...';

    try {
      recommendations = await learningPathApi.generateRecommendations();
      showToast('Roadmap regenerated based on active skill gaps!', 'success');
      renderRecommendations();
      updateProgress();
    } catch (err) {
      showToast(err.message || 'Failed to regenerate roadmap', 'error');
    } finally {
      btnRegenerate.disabled = false;
      btnRegenerate.innerHTML = '<i class="bi bi-arrow-repeat"></i> <span>Regenerate Roadmap</span>';
    }
  });

  try {
    let recs = await learningPathApi.getRecommendations();
    if (!recs || recs.length === 0) {
      // Auto-generate if empty
      recs = await learningPathApi.generateRecommendations();
    }
    recommendations = recs;
    renderRecommendations();
    updateProgress();
  } catch (err) {
    showToast(err.message || 'Error loading learning path', 'error');
  }

  function renderRecommendations() {
    let filtered = recommendations.filter(r => {
      if (currentFilter === 'ALL') return true;
      return r.status === currentFilter;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card-modern p-5 text-center text-muted">
          <i class="bi bi-compass fs-1 text-primary mb-2 d-block"></i>
          <h5 class="fw-bold text-dark">No modules in this category</h5>
          <p class="small text-muted mb-3">Either all items are completed, or click regenerate to scan for newly detected gaps.</p>
          <button id="btn-quick-generate" class="btn btn-outline-custom btn-sm">
            <i class="bi bi-arrow-repeat me-1"></i> Scan Gaps Now
          </button>
        </div>
      `;
      const qGen = document.getElementById('btn-quick-generate');
      if (qGen) qGen.addEventListener('click', () => btnRegenerate.click());
      return;
    }

    container.innerHTML = filtered.map(item => `
      <div class="card-modern p-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
          <div class="d-flex align-items-start gap-3 flex-grow-1">
            <div class="stat-icon ${getPriorityBgClass(item.priority)} p-2 mt-1" style="width:44px; height:44px; font-size:1.2rem;">
              <i class="bi bi-mortarboard"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <span class="badge-pill-custom ${getPriorityBadgeClass(item.priority)}" style="font-size:0.75rem;">
                  ${item.priority} Priority
                </span>
                <span class="badge bg-light text-dark border small">${item.skillName}</span>
                <span class="small text-muted"><i class="bi bi-clock me-1"></i>${item.estimatedDuration}</span>
              </div>

              <h5 class="fw-bold text-dark mb-1">${item.resourceTitle || item.suggestedTopic}</h5>
              <p class="small text-muted mb-2">${item.reason}</p>

              <div class="d-flex align-items-center gap-2">
                <a href="${item.resourceUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-custom">
                  <span>Open Resource / Documentation</span>
                  <i class="bi bi-box-arrow-up-right ms-1"></i>
                </a>
              </div>
            </div>
          </div>

          <!-- Status Action Dropdown / Toggle -->
          <div class="d-flex align-items-center gap-2 ms-md-auto">
            ${renderStatusControls(item)}
          </div>
        </div>
      </div>
    `).join('');

    // Attach status toggle click handlers
    document.querySelectorAll('.btn-update-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-id'));
        const nextStatus = btn.getAttribute('data-status');

        btn.disabled = true;
        try {
          const updated = await learningPathApi.updateStatus(id, nextStatus);
          const idx = recommendations.findIndex(r => r.id === id);
          if (idx >= 0) recommendations[idx] = updated;

          showToast(`Marked as ${formatStatus(nextStatus)}`, 'success');
          renderRecommendations();
          updateProgress();
        } catch (err) {
          showToast(err.message || 'Failed to update progress', 'error');
          btn.disabled = false;
        }
      });
    });
  }

  function renderStatusControls(item) {
    if (item.status === 'COMPLETED') {
      return `
        <span class="badge-pill-custom badge-matched px-3 py-2">
          <i class="bi bi-check-circle-fill me-1"></i> Completed
        </span>
        <button class="btn btn-sm btn-light border btn-update-status" data-id="${item.id}" data-status="IN_PROGRESS" title="Reset to in progress">
          <i class="bi bi-arrow-counterclockwise"></i>
        </button>
      `;
    } else if (item.status === 'IN_PROGRESS') {
      return `
        <button class="btn btn-sm btn-success btn-update-status" data-id="${item.id}" data-status="COMPLETED">
          <i class="bi bi-check2 me-1"></i> Mark Done
        </button>
        <button class="btn btn-sm btn-light border btn-update-status" data-id="${item.id}" data-status="NOT_STARTED" title="Reset">
          <i class="bi bi-arrow-counterclockwise"></i>
        </button>
      `;
    } else {
      return `
        <button class="btn btn-sm btn-outline-custom btn-update-status" data-id="${item.id}" data-status="IN_PROGRESS">
          <i class="bi bi-play me-1"></i> Start Learning
        </button>
      `;
    }
  }

  function updateProgress() {
    const total = recommendations.length;
    const completed = recommendations.filter(r => r.status === 'COMPLETED').length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('completed-count-txt').textContent = completed;
    document.getElementById('total-count-txt').textContent = total;
    document.getElementById('roadmap-progress-bar').style.width = `${pct}%`;
    document.getElementById('roadmap-pct-txt').textContent = `${pct}% Modules Completed`;
  }

  function getPriorityBadgeClass(p) {
    if (p === 'HIGH') return 'badge-missing';
    if (p === 'MEDIUM') return 'badge-improvement';
    return 'badge-primary-soft';
  }

  function getPriorityBgClass(p) {
    if (p === 'HIGH') return 'bg-danger bg-opacity-10 text-danger';
    if (p === 'MEDIUM') return 'bg-warning bg-opacity-10 text-warning';
    return 'bg-primary bg-opacity-10 text-primary';
  }

  function formatStatus(s) {
    if (!s) return '';
    return s.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
});
