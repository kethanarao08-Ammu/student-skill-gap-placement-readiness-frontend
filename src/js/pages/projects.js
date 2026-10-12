import { requireAuth, setupNavigation } from '../utils/authGuard.js';
import { projectApi } from '../api/projectApi.js';
import { showToast } from '../utils/notifications.js';
import * as bootstrap from 'bootstrap';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setupNavigation('projects');

  let projects = [];
  const container = document.getElementById('projects-container');
  const form = document.getElementById('project-form');
  const editIdInput = document.getElementById('project-edit-id');
  const titleInput = document.getElementById('proj-title');
  const techInput = document.getElementById('proj-tech');
  const descInput = document.getElementById('proj-desc');
  const githubInput = document.getElementById('proj-github');
  const liveInput = document.getElementById('proj-live');
  const startInput = document.getElementById('proj-start');
  const endInput = document.getElementById('proj-end');
  const saveBtn = document.getElementById('btn-save-project');
  const modalEl = document.getElementById('projectModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  document.getElementById('btn-add-project-modal').addEventListener('click', () => {
    form.reset();
    editIdInput.value = '';
    document.getElementById('projectModalLabel').textContent = 'Add Project';
  });

  try {
    projects = await projectApi.getProjects();
    renderProjects();
  } catch (err) {
    showToast(err.message || 'Failed to load projects', 'error');
  }

  function renderProjects() {
    updateProjectScore();

    if (!projects || projects.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="stat-icon bg-light text-muted mx-auto mb-3" style="width:50px; height:50px;">
            <i class="bi bi-folder2-open fs-3"></i>
          </div>
          <h6 class="fw-bold text-dark">No projects added yet</h6>
          <p class="small text-muted mb-3">Adding practical projects contributes 15% towards your placement readiness score.</p>
          <button class="btn btn-primary-custom btn-sm" data-bs-toggle="modal" data-bs-target="#projectModal">
            <i class="bi bi-plus-lg me-1"></i> Add First Project
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = projects.map(p => {
      const techList = p.technologies ? p.technologies.split(',').map(t => t.trim()) : [];

      return `
        <div class="col-md-6 col-xl-4">
          <div class="card-modern p-4 h-100 d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="fw-bold mb-1 text-dark">${p.title}</h5>
              <div class="dropdown">
                <button class="btn btn-sm btn-light border-0" type="button" data-bs-toggle="dropdown">
                  <i class="bi bi-three-dots-vertical"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                  <li><a class="dropdown-item btn-edit-proj" href="#" data-id="${p.id}">Edit</a></li>
                  <li><a class="dropdown-item text-danger btn-delete-proj" href="#" data-id="${p.id}">Delete</a></li>
                </ul>
              </div>
            </div>

            <p class="small text-muted mb-3 flex-grow-1">${p.description || 'No description provided.'}</p>

            ${techList.length > 0 ? `
              <div class="d-flex flex-wrap gap-1 mb-3">
                ${techList.map(t => `<span class="badge bg-light text-secondary border small">${t}</span>`).join('')}
              </div>
            ` : ''}

            <div class="d-flex justify-content-between align-items-center pt-3 border-top small text-muted">
              <div>
                ${p.startDate ? `<i class="bi bi-calendar3 me-1"></i>${p.startDate}` : ''}
              </div>
              <div class="d-flex gap-2">
                ${p.githubUrl ? `
                  <a href="${p.githubUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-light border p-1" title="GitHub">
                    <i class="bi bi-github fs-6"></i>
                  </a>
                ` : ''}
                ${p.projectUrl ? `
                  <a href="${p.projectUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-light border p-1" title="Live Demo">
                    <i class="bi bi-box-arrow-up-right fs-6 text-primary"></i>
                  </a>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach edit and delete listeners
    document.querySelectorAll('.btn-edit-proj').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = parseInt(btn.getAttribute('data-id'));
        const p = projects.find(item => item.id === id);
        if (p) {
          editIdInput.value = p.id;
          titleInput.value = p.title || '';
          techInput.value = p.technologies || '';
          descInput.value = p.description || '';
          githubInput.value = p.githubUrl || '';
          liveInput.value = p.projectUrl || '';
          startInput.value = p.startDate || '';
          endInput.value = p.endDate || '';
          document.getElementById('projectModalLabel').textContent = 'Edit Project';
          modal.show();
        }
      });
    });

    document.querySelectorAll('.btn-delete-proj').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = parseInt(btn.getAttribute('data-id'));
        if (confirm('Delete this project?')) {
          try {
            await projectApi.deleteProject(id);
            projects = projects.filter(item => item.id !== id);
            showToast('Project deleted', 'success');
            renderProjects();
          } catch (err) {
            showToast(err.message || 'Failed to delete project', 'error');
          }
        }
      });
    });
  }

  function updateProjectScore() {
    const count = projects.length;
    document.getElementById('total-projects-pill').textContent = `${count} Project${count !== 1 ? 's' : ''}`;
    let score = 0;
    if (count === 1) score = 40;
    else if (count === 2) score = 75;
    else if (count >= 3) score = 100;

    document.getElementById('project-score-badge').textContent = `${score}% (Points Earned: ${(score * 0.15).toFixed(1)} / 15)`;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isEdit = Boolean(editIdInput.value);
    const id = parseInt(editIdInput.value);

    const payload = {
      title: titleInput.value.trim(),
      technologies: techInput.value.trim() || null,
      description: descInput.value.trim() || null,
      githubUrl: githubInput.value.trim() || null,
      projectUrl: liveInput.value.trim() || null,
      startDate: startInput.value || null,
      endDate: endInput.value || null
    };

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

    try {
      if (isEdit) {
        const updated = await projectApi.updateProject(id, payload);
        const idx = projects.findIndex(p => p.id === id);
        if (idx >= 0) projects[idx] = updated;
        showToast('Project updated!', 'success');
      } else {
        const created = await projectApi.createProject(payload);
        projects.unshift(created);
        showToast('Project created!', 'success');
      }

      modal.hide();
      form.reset();
      renderProjects();
    } catch (err) {
      showToast(err.message || 'Failed to save project', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Project';
    }
  });
});
