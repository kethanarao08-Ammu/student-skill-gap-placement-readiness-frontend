import { requireAuth, setupNavigation, getUser } from '../utils/authGuard.js';
import { dashboardApi } from '../api/dashboardApi.js';
import { skillGapApi } from '../api/skillGapApi.js';
import { showToast } from '../utils/notifications.js';
import Chart from 'chart.js/auto';
import * as bootstrap from 'bootstrap';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setupNavigation('dashboard');

  const user = getUser();
  if (user && user.role === 'ROLE_ADMIN') {
    document.getElementById('user-role-badge').textContent = 'Placement Officer';
  }

  let doughnutChart = null;

  try {
    const summary = await dashboardApi.getSummary();
    const readiness = await skillGapApi.getReadinessScore().catch(() => null);

    renderSummary(summary, readiness);
  } catch (err) {
    showToast(err.message || 'Failed to load dashboard metrics', 'error');
  }

  function renderSummary(summary, readiness) {
    // 1. Profile Completion Banner
    const profileBanner = document.getElementById('profile-banner');
    const compPct = summary.profileCompletionPercentage || 0;
    if (compPct < 100) {
      profileBanner.classList.remove('d-none');
      document.getElementById('profile-completion-txt').textContent = `${compPct}%`;
      document.getElementById('profile-progress-bar').style.width = `${compPct}%`;
    }

    // 2. Key Metrics
    const overallScore = summary.overallReadinessScore || 0;
    document.getElementById('overall-score-txt').textContent = `${overallScore}%`;

    const catBadge = document.getElementById('readiness-category-badge');
    const category = summary.readinessCategory || 'Needs Strong Improvement';
    catBadge.textContent = category;

    if (overallScore >= 80) {
      catBadge.className = 'badge-pill-custom badge-matched';
    } else if (overallScore >= 60) {
      catBadge.className = 'badge-pill-custom badge-primary-soft';
    } else if (overallScore >= 40) {
      catBadge.className = 'badge-pill-custom badge-improvement';
    } else {
      catBadge.className = 'badge-pill-custom badge-missing';
    }

    if (readiness && readiness.provisional) {
      document.getElementById('provisional-indicator').innerHTML =
        `<i class="bi bi-clock-history text-warning me-1"></i> <span class="text-warning">Provisional Score</span>`;
    }

    // Target Job Role
    document.getElementById('target-role-txt').textContent = summary.targetJobRoleTitle || 'Select a Role';
    document.getElementById('skill-match-txt').textContent = `${summary.skillMatchPercentage || 0}%`;

    // Assessment Score
    if (summary.hasCompletedAssessment) {
      document.getElementById('assessment-score-txt').textContent = `${summary.latestAssessmentScore}%`;
      document.getElementById('assessment-status-txt').innerHTML =
        `<span class="badge-pill-custom badge-matched py-0 px-2 small">${summary.latestAssessmentCategory}</span>`;
    } else {
      document.getElementById('assessment-score-txt').textContent = '0%';
      document.getElementById('assessment-status-txt').innerHTML =
        `<a href="/pages/assessment.html" class="text-primary text-decoration-none fw-semibold">Take Test Now &rarr;</a>`;
    }

    // Skills & Counts
    document.getElementById('total-skills-txt').textContent = summary.totalSkillsAdded || 0;
    document.getElementById('projects-count-txt').textContent = summary.totalProjects || 0;
    document.getElementById('certs-count-txt').textContent = summary.totalCertifications || 0;

    // Component Scores
    if (readiness && readiness.componentScores) {
      document.getElementById('comp-skill-match').textContent = `${readiness.componentScores.skillMatch || 0}%`;
      document.getElementById('comp-assessment').textContent = `${readiness.componentScores.assessment || 0}%`;
      document.getElementById('comp-projects').textContent = `${readiness.componentScores.projects || 0}%`;
      document.getElementById('comp-certs').textContent = `${readiness.componentScores.certifications || 0}%`;

      renderDoughnut([
        readiness.componentScores.skillMatch || 0,
        readiness.componentScores.assessment || 0,
        readiness.componentScores.projects || 0,
        readiness.componentScores.certifications || 0
      ]);
    } else {
      renderDoughnut([summary.skillMatchPercentage || 0, summary.latestAssessmentScore || 0, 0, 0]);
    }

    // 3. High-Priority Gaps
    const gapsContainer = document.getElementById('top-gaps-container');
    if (summary.topSkillGaps && summary.topSkillGaps.length > 0) {
      gapsContainer.innerHTML = summary.topSkillGaps.map(gap => `
        <div class="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border">
          <div class="d-flex align-items-center gap-3">
            <div class="stat-icon bg-danger bg-opacity-10 text-danger p-2" style="width:36px; height:36px; font-size:1.1rem;">
              <i class="bi bi-exclamation-octagon"></i>
            </div>
            <div>
              <h6 class="fw-bold mb-0 text-dark">${gap.skillName}</h6>
              <small class="text-muted">${gap.category || 'Technical'} &bull; Importance: ${gap.importanceWeight}/5</small>
            </div>
          </div>
          <div class="text-end">
            <div class="badge-pill-custom badge-missing mb-1">Gap: ${gap.gap} Level${gap.gap > 1 ? 's' : ''}</div>
            <div class="smaller text-muted" style="font-size: 0.75rem;">Level ${gap.currentLevel}/5 &rarr; Req ${gap.requiredLevel}/5</div>
          </div>
        </div>
      `).join('');
    } else {
      gapsContainer.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="bi bi-check-circle text-success fs-2 d-block mb-2"></i>
          <p class="mb-1 fw-semibold text-dark">No critical skill gaps detected!</p>
          <small class="text-muted">Either all role skills are matched, or add your skills in the inventory.</small>
          <div class="mt-3">
            <a href="/pages/skills.html" class="btn btn-outline-custom btn-sm">Manage Skills</a>
          </div>
        </div>
      `;
    }

    // 4. Learning Recommendations
    const recsContainer = document.getElementById('learning-items-container');
    if (summary.pendingRecommendations && summary.pendingRecommendations.length > 0) {
      recsContainer.innerHTML = summary.pendingRecommendations.map(rec => `
        <div class="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border">
          <div class="d-flex align-items-center gap-3">
            <div class="stat-icon bg-primary bg-opacity-10 text-primary p-2" style="width:36px; height:36px; font-size:1.1rem;">
              <i class="bi bi-book"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge-pill-custom badge-primary-soft py-0 px-2" style="font-size:0.7rem;">${rec.priority} PRIORITY</span>
                <span class="small text-muted"><i class="bi bi-clock me-1"></i>${rec.estimatedDuration}</span>
              </div>
              <h6 class="fw-bold mb-0 text-dark">${rec.resourceTitle || rec.suggestedTopic}</h6>
              <small class="text-muted">${rec.skillName} &bull; ${rec.reason}</small>
            </div>
          </div>
          <div class="text-end text-nowrap ms-3">
            <a href="${rec.resourceUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary-custom btn-sm py-1 px-3">
              Learn <i class="bi bi-box-arrow-up-right ms-1"></i>
            </a>
          </div>
        </div>
      `).join('');
    } else {
      recsContainer.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="bi bi-award text-primary fs-2 d-block mb-2"></i>
          <p class="mb-1 fw-semibold text-dark">All learning items completed or none generated</p>
          <small class="text-muted">Generate a personalized roadmap matching your dream job role.</small>
          <div class="mt-3">
            <a href="/pages/learning-path.html" class="btn btn-primary-custom btn-sm">Explore Learning Path</a>
          </div>
        </div>
      `;
    }

    // 5. Strongest Skills
    const strongContainer = document.getElementById('strongest-skills-container');
    if (summary.strongestSkills && summary.strongestSkills.length > 0) {
      strongContainer.innerHTML = summary.strongestSkills.map(s => `
        <div class="d-flex justify-content-between align-items-center p-2 rounded-2 bg-light">
          <span class="fw-semibold small text-dark">${s.skillName}</span>
          <span class="badge-pill-custom badge-matched py-0 px-2 small">${s.proficiencyLabel} (${s.proficiencyLevel}/5)</span>
        </div>
      `).join('');
    } else {
      strongContainer.innerHTML = `
        <div class="text-muted small py-2">No skills rated yet. <a href="/pages/skills.html" class="text-primary text-decoration-none">Add skills &rarr;</a></div>
      `;
    }
  }

  function renderDoughnut(data) {
    const ctx = document.getElementById('readinessDoughnutChart');
    if (!ctx) return;

    if (doughnutChart) {
      doughnutChart.destroy();
    }

    doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Skills', 'Assessment', 'Projects', 'Certifications'],
        datasets: [{
          data: data,
          backgroundColor: ['#4F46E5', '#06B6D4', '#F59E0B', '#10B981'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ${context.raw}%`
            }
          }
        }
      }
    });
  }
});
