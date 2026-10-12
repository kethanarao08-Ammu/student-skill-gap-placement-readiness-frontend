import { requireAuth, setupNavigation } from '../utils/authGuard.js';
import { skillGapApi } from '../api/skillGapApi.js';
import { showToast } from '../utils/notifications.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setupNavigation('progress');

  try {
    const data = await skillGapApi.getReadinessScore();
    renderReadiness(data);
  } catch (err) {
    showToast(err.message || 'Failed to load readiness breakdown', 'error');
  }

  function renderReadiness(data) {
    document.getElementById('target-role-badge').textContent = `Target Role: ${data.jobRoleTitle || 'General'}`;
    document.getElementById('overall-score-display').textContent = `${data.overallReadinessScore}%`;

    const catTag = document.getElementById('readiness-category-tag');
    catTag.textContent = data.readinessCategory;

    if (data.overallReadinessScore >= 80) {
      catTag.className = 'badge-pill-custom badge-matched fs-6 px-4 py-2';
    } else if (data.overallReadinessScore >= 60) {
      catTag.className = 'badge-pill-custom badge-primary-soft fs-6 px-4 py-2';
    } else if (data.overallReadinessScore >= 40) {
      catTag.className = 'badge-pill-custom badge-improvement fs-6 px-4 py-2';
    } else {
      catTag.className = 'badge-pill-custom badge-missing fs-6 px-4 py-2';
    }

    // Provisional Banner
    const provBanner = document.getElementById('provisional-banner');
    if (data.provisional) {
      provBanner.classList.remove('d-none');
      document.getElementById('provisional-msg-txt').textContent = data.provisionalReason || 'Certain components are missing.';

      const badgesContainer = document.getElementById('missing-items-badges');
      badgesContainer.innerHTML = (data.missingComponents || []).map(item => `
        <span class="badge bg-white text-danger border border-danger px-3 py-1">
          <i class="bi bi-exclamation-circle me-1"></i> Missing: ${item}
        </span>
      `).join('');
    }

    // Component 1: Skills (40%)
    const skillScore = data.skillMatchScore || 0;
    document.getElementById('skill-score-num').textContent = `${skillScore}%`;
    document.getElementById('skill-score-bar').style.width = `${skillScore}%`;
    document.getElementById('skill-contrib-txt').textContent = `${(skillScore * 0.40).toFixed(1)} / 40 pts`;

    // Component 2: Assessment (35%)
    const assessScore = data.assessmentScore || 0;
    document.getElementById('assess-score-num').textContent = `${assessScore}%`;
    document.getElementById('assess-score-bar').style.width = `${assessScore}%`;
    document.getElementById('assess-contrib-txt').textContent = `${(assessScore * 0.35).toFixed(1)} / 35 pts`;

    // Component 3: Projects (15%)
    const projScore = data.projectScore || 0;
    document.getElementById('proj-score-num').textContent = `${projScore}%`;
    document.getElementById('proj-score-bar').style.width = `${projScore}%`;
    document.getElementById('proj-contrib-txt').textContent = `${(projScore * 0.15).toFixed(1)} / 15 pts`;

    // Component 4: Certifications (10%)
    const certScore = data.certificationScore || 0;
    document.getElementById('cert-score-num').textContent = `${certScore}%`;
    document.getElementById('cert-score-bar').style.width = `${certScore}%`;
    document.getElementById('cert-contrib-txt').textContent = `${(certScore * 0.10).toFixed(1)} / 10 pts`;
  }
});
