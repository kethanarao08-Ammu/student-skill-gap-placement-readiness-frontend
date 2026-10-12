import { requireAuth, setupNavigation } from '../utils/authGuard.js';
import { jobRoleApi } from '../api/jobRoleApi.js';
import { studentApi } from '../api/studentApi.js';
import { showToast } from '../utils/notifications.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setupNavigation('job-roles');

  const container = document.getElementById('roles-grid-container');
  const targetTitleEl = document.getElementById('current-target-title');
  let currentTargetRoleId = null;

  try {
    const [profile, roles] = await Promise.all([
      studentApi.getProfile(),
      jobRoleApi.getAllActiveRoles()
    ]);

    currentTargetRoleId = profile.targetJobRoleId;
    targetTitleEl.textContent = profile.targetJobRoleTitle || 'None Selected (Click below to set)';

    renderRoles(roles);
  } catch (err) {
    showToast(err.message || 'Failed to load job roles', 'error');
  }

  function renderRoles(roles) {
    if (!roles || roles.length === 0) {
      container.innerHTML = '<div class="col-12 text-center py-5 text-muted">No job roles available.</div>';
      return;
    }

    container.innerHTML = roles.map(role => {
      const isTarget = currentTargetRoleId === role.id;
      const skills = role.requiredSkills || [];

      return `
        <div class="col-lg-6">
          <div class="card-modern p-4 h-100 d-flex flex-column ${isTarget ? 'border-primary shadow-md' : ''}">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h5 class="fw-bold mb-1 text-dark">${role.title}</h5>
                <span class="badge-pill-custom ${isTarget ? 'badge-matched' : 'badge-primary-soft'}">
                  ${isTarget ? '<i class="bi bi-star-fill me-1"></i> Current Target' : `${skills.length} Required Skills`}
                </span>
              </div>
              <div class="stat-icon bg-primary bg-opacity-10 text-primary p-2" style="width:40px; height:40px; font-size:1.2rem;">
                <i class="bi bi-laptop"></i>
              </div>
            </div>

            <p class="small text-muted mb-3">${role.description || 'Industry software engineering position.'}</p>

            <h6 class="smaller fw-bold text-uppercase text-muted letter-spacing-1 mb-2">Required Core Competencies</h6>
            <div class="d-flex flex-wrap gap-2 mb-4 flex-grow-1 align-content-start">
              ${skills.map(s => `
                <span class="badge bg-light text-dark border p-2 small">
                  <strong>${s.skill.name}</strong> 
                  <span class="text-primary">&bull; Req: ${s.requiredLevel}/5</span>
                  <span class="text-muted ms-1">(Weight: ${s.importanceWeight})</span>
                </span>
              `).join('')}
            </div>

            <div class="d-flex gap-2 pt-3 border-top mt-auto">
              ${isTarget ? `
                <button class="btn btn-success btn-sm w-50 disabled" disabled>
                  <i class="bi bi-check2-circle me-1"></i> Active Target
                </button>
              ` : `
                <button class="btn btn-outline-custom btn-sm w-50 btn-set-target" data-id="${role.id}" data-title="${role.title}">
                  Set as Target
                </button>
              `}
              <a href="/pages/skill-gap.html?jobRoleId=${role.id}" class="btn btn-primary-custom btn-sm w-50 text-center">
                Analyze Gap &rarr;
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach "Set as Target" button click events
    document.querySelectorAll('.btn-set-target').forEach(btn => {
      btn.addEventListener('click', async () => {
        const roleId = parseInt(btn.getAttribute('data-id'));
        const roleTitle = btn.getAttribute('data-title');

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Setting...';

        try {
          await studentApi.updateProfile({ targetJobRoleId: roleId });
          currentTargetRoleId = roleId;
          targetTitleEl.textContent = roleTitle;
          showToast(`Target role set to "${roleTitle}"!`, 'success');
          // Re-render
          const updatedRoles = await jobRoleApi.getAllActiveRoles();
          renderRoles(updatedRoles);
        } catch (err) {
          showToast(err.message || 'Failed to update target role', 'error');
          btn.disabled = false;
          btn.textContent = 'Set as Target';
        }
      });
    });
  }
});
