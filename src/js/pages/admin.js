import { requireAdmin, setupNavigation } from '../utils/authGuard.js';
import { adminApi } from '../api/adminApi.js';
import { skillApi } from '../api/skillApi.js';
import { jobRoleApi } from '../api/jobRoleApi.js';
import { showToast } from '../utils/notifications.js';
import * as bootstrap from 'bootstrap';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAdmin()) return;
  setupNavigation('admin');

  let allStudents = [];
  let allSkills = [];
  let allRoles = [];

  const studentsTbody = document.getElementById('students-tbody');
  const skillsTbody = document.getElementById('skills-admin-tbody');
  const rolesContainer = document.getElementById('roles-admin-container');
  const searchInput = document.getElementById('search-students');

  // Skill Modal
  const skillForm = document.getElementById('admin-skill-form');
  const skillNameInput = document.getElementById('adm-skill-name');
  const skillCatSelect = document.getElementById('adm-skill-cat');
  const skillDescInput = document.getElementById('adm-skill-desc');
  const saveSkillBtn = document.getElementById('btn-save-admin-skill');
  const skillModalEl = document.getElementById('skillModal');
  const skillModal = bootstrap.Modal.getOrCreateInstance(skillModalEl);

  // Role Modal
  const roleForm = document.getElementById('admin-role-form');
  const roleTitleInput = document.getElementById('adm-role-title');
  const roleDescInput = document.getElementById('adm-role-desc');
  const saveRoleBtn = document.getElementById('btn-save-admin-role');
  const roleModalEl = document.getElementById('roleModal');
  const roleModal = bootstrap.Modal.getOrCreateInstance(roleModalEl);

  try {
    const overview = await adminApi.getOverview();
    document.getElementById('stat-total-students').textContent = overview.totalStudents || 0;
    document.getElementById('stat-avg-readiness').textContent = `${overview.averageReadinessScore || 0}%`;
    document.getElementById('stat-total-skills').textContent = overview.totalSkills || 0;
    document.getElementById('stat-total-roles').textContent = overview.totalJobRoles || 0;
    document.getElementById('stat-total-tests').textContent = overview.totalAssessmentsTaken || 0;

    await Promise.all([
      loadStudents(),
      loadSkills(),
      loadRoles()
    ]);
  } catch (err) {
    showToast(err.message || 'Failed to initialize admin portal', 'error');
  }

  // Search Filter for Students
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    renderStudents(term);
  });

  async function loadStudents() {
    try {
      allStudents = await adminApi.getStudents();
      renderStudents();
    } catch (err) {
      studentsTbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">Failed to load student roster.</td></tr>`;
    }
  }

  function renderStudents(filterTerm = '') {
    let filtered = allStudents.filter(s => {
      if (!filterTerm) return true;
      const name = (s.fullName || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const col = (s.college || '').toLowerCase();
      return name.includes(filterTerm) || email.includes(filterTerm) || col.includes(filterTerm);
    });

    if (filtered.length === 0) {
      studentsTbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No students matching criteria.</td></tr>`;
      return;
    }

    studentsTbody.innerHTML = filtered.map(s => `
      <tr>
        <td>
          <div class="fw-bold text-dark">${s.fullName}</div>
          <div class="small text-muted">${s.email}</div>
        </td>
        <td>
          <div class="small text-dark">${s.college || 'N/A'}</div>
          <div class="smaller text-muted">${s.degree || ''} ${s.branch ? '&bull; ' + s.branch : ''}</div>
        </td>
        <td>
          <span class="badge bg-light text-dark border small">${s.targetRole}</span>
        </td>
        <td>
          <span class="fw-bold fs-6 ${s.readinessScore >= 80 ? 'text-success' : s.readinessScore >= 60 ? 'text-primary' : 'text-danger'}">
            ${s.readinessScore}%
          </span>
          ${s.isProvisional ? '<span class="badge bg-warning text-dark ms-1 small" title="Provisional score">Prov.</span>' : ''}
        </td>
        <td>
          <span class="badge-pill-custom ${getCatBadgeClass(s.readinessCategory)}">
            ${s.readinessCategory}
          </span>
        </td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="progress progress-modern flex-grow-1" style="width: 60px;">
              <div class="progress-bar bg-primary" style="width: ${s.profileCompletion}%"></div>
            </div>
            <span class="small text-muted">${s.profileCompletion}%</span>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async function loadSkills() {
    try {
      allSkills = await skillApi.getAllSkills();
      renderSkills();
    } catch (err) {
      skillsTbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">Failed to load skills.</td></tr>`;
    }
  }

  function renderSkills() {
    skillsTbody.innerHTML = allSkills.map(s => `
      <tr>
        <td><span class="text-muted small">#${s.id}</span></td>
        <td class="fw-bold text-dark">${s.name}</td>
        <td><span class="badge-pill-custom badge-primary-soft">${formatCat(s.category)}</span></td>
        <td class="small text-muted">${s.description || 'N/A'}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-danger btn-delete-skill-admin" data-id="${s.id}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.btn-delete-skill-admin').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-id'));
        if (confirm('Delete this skill from the library?')) {
          try {
            await adminApi.deleteSkill(id);
            allSkills = allSkills.filter(s => s.id !== id);
            showToast('Skill deleted', 'success');
            renderSkills();
          } catch (err) {
            showToast(err.message || 'Cannot delete skill', 'error');
          }
        }
      });
    });
  }

  async function loadRoles() {
    try {
      allRoles = await jobRoleApi.getAllActiveRoles();
      renderRoles();
    } catch (err) {
      rolesContainer.innerHTML = `<div class="col-12 text-center text-danger py-4">Failed to load roles.</div>`;
    }
  }

  function renderRoles() {
    rolesContainer.innerHTML = allRoles.map(r => `
      <div class="col-lg-6">
        <div class="card-modern p-4 h-100 d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 class="fw-bold mb-1 text-dark">${r.title}</h5>
              <span class="badge-pill-custom badge-matched">Active Role</span>
            </div>
            <button class="btn btn-sm btn-outline-danger btn-delete-role-admin" data-id="${r.id}">
              <i class="bi bi-trash"></i>
            </button>
          </div>

          <p class="small text-muted mb-3">${r.description || 'No description provided.'}</p>

          <h6 class="smaller fw-bold text-uppercase text-muted letter-spacing-1 mb-2">Mapped Skills (${(r.requiredSkills || []).length})</h6>
          <div class="d-flex flex-wrap gap-2 mb-3 flex-grow-1 align-content-start">
            ${(r.requiredSkills || []).map(s => `
              <span class="badge bg-light text-dark border p-2 small">
                ${s.skill.name} (Req: ${s.requiredLevel}/5, Wt: ${s.importanceWeight})
              </span>
            `).join('')}
          </div>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.btn-delete-role-admin').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.getAttribute('data-id'));
        if (confirm('Delete this job role?')) {
          try {
            await adminApi.deleteJobRole(id);
            allRoles = allRoles.filter(r => r.id !== id);
            showToast('Job role deleted', 'success');
            renderRoles();
          } catch (err) {
            showToast(err.message || 'Cannot delete job role', 'error');
          }
        }
      });
    });
  }

  // Create Skill
  skillForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveSkillBtn.disabled = true;
    saveSkillBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Creating...';

    const payload = {
      name: skillNameInput.value.trim(),
      category: skillCatSelect.value,
      description: skillDescInput.value.trim() || null
    };

    try {
      const created = await adminApi.createSkill(payload);
      allSkills.push(created);
      showToast(`Skill "${created.name}" added to catalog!`, 'success');
      skillModal.hide();
      skillForm.reset();
      renderSkills();
    } catch (err) {
      showToast(err.message || 'Failed to create skill', 'error');
    } finally {
      saveSkillBtn.disabled = false;
      saveSkillBtn.innerHTML = 'Save Skill';
    }
  });

  // Create Role
  roleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveRoleBtn.disabled = true;
    saveRoleBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Creating...';

    const payload = {
      title: roleTitleInput.value.trim(),
      description: roleDescInput.value.trim() || null,
      active: true
    };

    try {
      const created = await adminApi.createJobRole(payload);
      allRoles.push(created);
      showToast(`Job role "${created.title}" created!`, 'success');
      roleModal.hide();
      roleForm.reset();
      renderRoles();
    } catch (err) {
      showToast(err.message || 'Failed to create job role', 'error');
    } finally {
      saveRoleBtn.disabled = false;
      saveRoleBtn.innerHTML = 'Create Role';
    }
  });

  function getCatBadgeClass(cat) {
    if (cat === 'Placement Ready') return 'badge-matched';
    if (cat === 'Nearly Ready') return 'badge-primary-soft';
    if (cat === 'Developing') return 'badge-improvement';
    return 'badge-missing';
  }

  function formatCat(c) {
    if (!c) return 'General';
    return c.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
});
