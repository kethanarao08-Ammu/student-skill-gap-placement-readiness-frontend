import { requireAuth, setupNavigation } from '../utils/authGuard.js';
import { skillGapApi } from '../api/skillGapApi.js';
import { jobRoleApi } from '../api/jobRoleApi.js';
import { showToast } from '../utils/notifications.js';
import Chart from 'chart.js/auto';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setupNavigation('skill-gap');

  const roleSelect = document.getElementById('role-select');
  const matrixTbody = document.getElementById('matrix-tbody');
  const criticalGapsList = document.getElementById('critical-gaps-list');
  const filterButtons = document.querySelectorAll('#table-filter-group button');
  let currentFilter = 'ALL';
  let radarChart = null;
  let currentGapData = null;

  // Read URL query parameter for roleId
  const urlParams = new URLSearchParams(window.location.search);
  let selectedRoleId = urlParams.get('jobRoleId') || null;

  try {
    const roles = await jobRoleApi.getAllActiveRoles();
    roleSelect.innerHTML = roles.map(r => `
      <option value="${r.id}">${r.title}</option>
    `).join('');

    if (selectedRoleId) {
      roleSelect.value = selectedRoleId;
    } else if (roles.length > 0) {
      selectedRoleId = roles[0].id;
      roleSelect.value = selectedRoleId;
    }

    roleSelect.addEventListener('change', () => {
      selectedRoleId = roleSelect.value;
      loadGapAnalysis(selectedRoleId);
    });

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        renderTable();
      });
    });

    await loadGapAnalysis(selectedRoleId);
  } catch (err) {
    showToast(err.message || 'Failed to initialize gap analysis', 'error');
  }

  async function loadGapAnalysis(roleId) {
    try {
      const data = await skillGapApi.analyzeGap(roleId);
      currentGapData = data;
      renderKPIs(data);
      renderRadar(data);
      renderCriticalGaps(data.highPriorityGaps || []);
      renderTable();
    } catch (err) {
      showToast(err.message || 'Error calculating skill gap', 'error');
    }
  }

  function renderKPIs(data) {
    document.getElementById('weighted-match-txt').textContent = `${data.weightedMatchPercentage}%`;
    document.getElementById('simple-match-txt').textContent = `${data.simpleMatchPercentage}%`;
    document.getElementById('matched-count').textContent = data.matchedSkillsCount;
    document.getElementById('improve-count').textContent = data.needsImprovementCount;
    document.getElementById('missing-count').textContent = data.missingSkillsCount;
    document.getElementById('total-skills-req').textContent = data.totalRequiredSkills;

    const pathBtn = document.getElementById('learning-path-btn');
    if (pathBtn) {
      pathBtn.href = `/pages/learning-path.html?jobRoleId=${data.jobRoleId}`;
    }
  }

  function renderRadar(data) {
    const ctx = document.getElementById('skillRadarChart');
    if (!ctx) return;

    if (radarChart) {
      radarChart.destroy();
    }

    // Combine all required skills for the radar
    const allSkills = [
      ...(data.matchedSkills || []),
      ...(data.needsImprovementSkills || []),
      ...(data.missingSkills || [])
    ];

    const labels = allSkills.map(s => s.skillName);
    const requiredData = allSkills.map(s => s.requiredLevel);
    const currentData = allSkills.map(s => s.currentLevel);

    radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Required Level',
            data: requiredData,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderWidth: 2,
            pointBackgroundColor: '#EF4444'
          },
          {
            label: 'Your Current Level',
            data: currentData,
            borderColor: '#4F46E5',
            backgroundColor: 'rgba(79, 70, 229, 0.25)',
            borderWidth: 2,
            pointBackgroundColor: '#4F46E5'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 5,
            ticks: {
              stepSize: 1,
              showLabelBackdrop: false
            },
            pointLabels: {
              font: {
                size: 11,
                weight: 'bold'
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { size: 12 }
            }
          }
        }
      }
    });
  }

  function renderCriticalGaps(gaps) {
    if (!gaps || gaps.length === 0) {
      criticalGapsList.innerHTML = `
        <div class="text-center py-4 text-muted my-auto">
          <i class="bi bi-shield-check text-success fs-1 mb-2 d-block"></i>
          <h6 class="fw-bold text-dark mb-1">No high-priority gaps!</h6>
          <small>Your skills satisfy all primary requirements for this role.</small>
        </div>
      `;
      return;
    }

    criticalGapsList.innerHTML = gaps.map(gap => `
      <div class="p-3 rounded-3 bg-light border d-flex justify-content-between align-items-center">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <h6 class="fw-bold mb-0 text-dark">${gap.skillName}</h6>
            <span class="badge-pill-custom badge-missing py-0 px-2" style="font-size:0.7rem;">Gap: ${gap.gap}</span>
          </div>
          <small class="text-muted">${gap.priorityReason || `Importance: ${gap.importanceWeight}/5`}</small>
        </div>
        <div class="text-end">
          <span class="small fw-semibold text-secondary">${gap.currentLevel}/5 &rarr; ${gap.requiredLevel}/5</span>
        </div>
      </div>
    `).join('');
  }

  function renderTable() {
    if (!currentGapData) return;

    let items = [];
    if (currentFilter === 'ALL') {
      items = [
        ...(currentGapData.matchedSkills || []),
        ...(currentGapData.needsImprovementSkills || []),
        ...(currentGapData.missingSkills || [])
      ];
    } else if (currentFilter === 'MATCHED') {
      items = currentGapData.matchedSkills || [];
    } else if (currentFilter === 'NEEDS_IMPROVEMENT') {
      items = currentGapData.needsImprovementSkills || [];
    } else if (currentFilter === 'MISSING') {
      items = currentGapData.missingSkills || [];
    }

    if (items.length === 0) {
      matrixTbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No skills in this category.</td></tr>`;
      return;
    }

    matrixTbody.innerHTML = items.map(item => `
      <tr>
        <td class="fw-bold text-dark">${item.skillName}</td>
        <td><span class="badge-pill-custom badge-primary-soft" style="font-size:0.75rem;">${formatCategory(item.skillCategory)}</span></td>
        <td><span class="fw-semibold text-secondary">${item.requiredLevel} / 5</span></td>
        <td><span class="fw-bold ${item.currentLevel >= item.requiredLevel ? 'text-success' : 'text-primary'}">${item.currentLevel} / 5</span></td>
        <td>
          <span class="fw-bold ${item.gap > 0 ? 'text-danger' : 'text-success'}">
            ${item.gap > 0 ? `-${item.gap}` : '0 (Matched)'}
          </span>
        </td>
        <td><span class="text-muted">${item.importanceWeight} / 5</span></td>
        <td>${renderStatusBadge(item.status)}</td>
      </tr>
    `).join('');
  }

  function renderStatusBadge(status) {
    if (status === 'MATCHED') {
      return '<span class="badge-pill-custom badge-matched"><i class="bi bi-check-circle-fill me-1"></i> Matched</span>';
    } else if (status === 'NEEDS_IMPROVEMENT') {
      return '<span class="badge-pill-custom badge-improvement"><i class="bi bi-arrow-up-circle-fill me-1"></i> Needs Work</span>';
    } else {
      return '<span class="badge-pill-custom badge-missing"><i class="bi bi-x-circle-fill me-1"></i> Missing</span>';
    }
  }

  function formatCategory(cat) {
    if (!cat) return 'General';
    return cat.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
});
