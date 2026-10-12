import { requireAuth, setupNavigation } from '../utils/authGuard.js';
import { skillApi } from '../api/skillApi.js';
import { showToast } from '../utils/notifications.js';
import * as bootstrap from 'bootstrap';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setupNavigation('skills');

  let allSkillsCatalog = [];
  let studentSkills = [];
  let currentCategory = 'ALL';
  let searchTerm = '';

  const skillsContainer = document.getElementById('skills-grid-container');
  const searchInput = document.getElementById('search-skill');
  const catButtons = document.querySelectorAll('#category-filter-buttons button');
  const skillSelect = document.getElementById('select-skill-id');
  const slider = document.getElementById('proficiency-slider');
  const levelDisplay = document.getElementById('level-display-label');
  const form = document.getElementById('skill-rating-form');
  const saveBtn = document.getElementById('save-skill-btn');
  const modalEl = document.getElementById('addSkillModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  const levelLabels = {
    1: '1 - Beginner',
    2: '2 - Basic',
    3: '3 - Intermediate',
    4: '4 - Advanced',
    5: '5 - Expert'
  };

  slider.addEventListener('input', () => {
    levelDisplay.textContent = levelLabels[slider.value] || `${slider.value} / 5`;
  });

  // Category filter handlers
  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      catButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-cat');
      renderSkills();
    });
  });

  // Search input handler
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase().trim();
    renderSkills();
  });

  try {
    const [catalog, userSkills] = await Promise.all([
      skillApi.getAllSkills(),
      skillApi.getStudentSkills()
    ]);
    allSkillsCatalog = catalog;
    studentSkills = userSkills;

    // Populate Modal Dropdown
    skillSelect.innerHTML = '<option value="">Select a skill to rate...</option>' +
      allSkillsCatalog.map(s => `<option value="${s.id}">${s.name} (${formatCategory(s.category)})</option>`).join('');

    renderSkills();
    updateStats();
  } catch (err) {
    showToast(err.message || 'Failed to load skills', 'error');
  }

  function renderSkills() {
    let filtered = studentSkills.filter(s => {
      const matchCat = currentCategory === 'ALL' || s.skillCategory === currentCategory;
      const matchSearch = !searchTerm || s.skillName.toLowerCase().includes(searchTerm);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      skillsContainer.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="stat-icon bg-light text-muted mx-auto mb-3" style="width:50px; height:50px;">
            <i class="bi bi-cpu fs-3"></i>
          </div>
          <h6 class="fw-bold text-dark">No skills match the selected filter</h6>
          <p class="small text-muted">Add new skills to your inventory to calculate accurate placement readiness.</p>
          <button class="btn btn-outline-custom btn-sm mt-2" data-bs-toggle="modal" data-bs-target="#addSkillModal">
            <i class="bi bi-plus-lg me-1"></i> Add Skill Now
          </button>
        </div>
      `;
      return;
    }

    skillsContainer.innerHTML = filtered.map(item => `
      <div class="col-md-6 col-xl-4">
        <div class="card-modern p-3 h-100 position-relative">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <span class="badge-pill-custom badge-primary-soft mb-1" style="font-size:0.7rem;">
                ${formatCategory(item.skillCategory)}
              </span>
              <h5 class="fw-bold mb-0 text-dark">${item.skillName}</h5>
            </div>
            <div class="dropdown">
              <button class="btn btn-sm btn-light border-0" type="button" data-bs-toggle="dropdown">
                <i class="bi bi-three-dots-vertical"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                <li><a class="dropdown-item btn-edit-skill" href="#" data-id="${item.skillId}" data-level="${item.proficiencyLevel}">Edit Level</a></li>
                <li><a class="dropdown-item text-danger btn-delete-skill" href="#" data-id="${item.skillId}">Delete</a></li>
              </ul>
            </div>
          </div>

          <div class="mt-3">
            <div class="d-flex justify-content-between align-items-center mb-1 small">
              <span class="text-muted">Proficiency:</span>
              <span class="fw-bold text-primary">${item.proficiencyLabel} (${item.proficiencyLevel}/5)</span>
            </div>
            <div class="progress progress-modern mb-2" style="height: 6px;">
              <div class="progress-bar ${getProgressBarColor(item.proficiencyLevel)}" style="width: ${(item.proficiencyLevel / 5) * 100}%"></div>
            </div>
            <div class="d-flex gap-1 text-warning small">
              ${renderStars(item.proficiencyLevel)}
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // Attach edit and delete listeners
    document.querySelectorAll('.btn-edit-skill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const skillId = btn.getAttribute('data-id');
        const level = btn.getAttribute('data-level');
        skillSelect.value = skillId;
        slider.value = level;
        levelDisplay.textContent = levelLabels[level];
        modal.show();
      });
    });

    document.querySelectorAll('.btn-delete-skill').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const skillId = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to remove this skill from your profile?')) {
          try {
            await skillApi.deleteStudentSkill(skillId);
            studentSkills = studentSkills.filter(s => s.skillId != skillId);
            showToast('Skill removed', 'success');
            renderSkills();
            updateStats();
          } catch (err) {
            showToast(err.message || 'Failed to remove skill', 'error');
          }
        }
      });
    });
  }

  function updateStats() {
    const total = studentSkills.length;
    document.getElementById('total-skills-count').textContent = total;

    if (total > 0) {
      const sum = studentSkills.reduce((acc, curr) => acc + curr.proficiencyLevel, 0);
      const avg = (sum / total).toFixed(1);
      document.getElementById('avg-proficiency-txt').textContent = `${avg} / 5`;

      const advanced = studentSkills.filter(s => s.proficiencyLevel >= 4).length;
      document.getElementById('advanced-skills-count').textContent = advanced;
    } else {
      document.getElementById('avg-proficiency-txt').textContent = '0.0 / 5';
      document.getElementById('advanced-skills-count').textContent = '0';
    }
  }

  // Modal Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const skillId = parseInt(skillSelect.value);
    const level = parseInt(slider.value);

    if (!skillId) {
      showToast('Please select a skill', 'warning');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Saving...';

    try {
      const saved = await skillApi.addOrUpdateStudentSkill({
        skillId: skillId,
        proficiencyLevel: level
      });

      // Update local studentSkills list
      const idx = studentSkills.findIndex(s => s.skillId == skillId);
      if (idx >= 0) {
        studentSkills[idx] = saved;
      } else {
        studentSkills.push(saved);
      }

      showToast(`Updated ${saved.skillName} to Level ${level}!`, 'success');
      modal.hide();
      form.reset();
      slider.value = 3;
      levelDisplay.textContent = levelLabels[3];
      renderSkills();
      updateStats();
    } catch (err) {
      showToast(err.message || 'Failed to save skill', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Skill';
    }
  });

  function renderStars(level) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= level) {
        stars += '<i class="bi bi-star-fill text-warning"></i>';
      } else {
        stars += '<i class="bi bi-star text-muted"></i>';
      }
    }
    return stars;
  }

  function getProgressBarColor(level) {
    if (level >= 4) return 'bg-success';
    if (level === 3) return 'bg-primary';
    if (level === 2) return 'bg-warning';
    return 'bg-danger';
  }

  function formatCategory(cat) {
    if (!cat) return 'General';
    return cat.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
});
