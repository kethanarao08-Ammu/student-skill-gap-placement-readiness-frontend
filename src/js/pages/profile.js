import { requireAuth, setupNavigation } from '../utils/authGuard.js';
import { studentApi } from '../api/studentApi.js';
import { jobRoleApi } from '../api/jobRoleApi.js';
import { showToast } from '../utils/notifications.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setupNavigation('profile');

  const form = document.getElementById('profile-form');
  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const collegeInput = document.getElementById('college');
  const degreeSelect = document.getElementById('degree');
  const branchInput = document.getElementById('branch');
  const gradYearInput = document.getElementById('graduationYear');
  const cgpaInput = document.getElementById('cgpa');
  const phoneInput = document.getElementById('phone');
  const targetRoleSelect = document.getElementById('targetJobRole');
  const bioInput = document.getElementById('bio');
  const saveBtn = document.getElementById('save-profile-btn');

  try {
    // Fetch active job roles for dropdown
    const roles = await jobRoleApi.getAllActiveRoles();
    targetRoleSelect.innerHTML = '<option value="">Choose your primary career target...</option>' +
      roles.map(r => `<option value="${r.id}">${r.title}</option>`).join('');

    // Fetch existing profile
    const profile = await studentApi.getProfile();
    nameInput.value = profile.fullName || '';
    emailInput.value = profile.email || '';
    collegeInput.value = profile.college || '';
    if (profile.degree) degreeSelect.value = profile.degree;
    branchInput.value = profile.branch || '';
    gradYearInput.value = profile.graduationYear || '';
    cgpaInput.value = profile.cgpa !== null && profile.cgpa !== undefined ? profile.cgpa : '';
    phoneInput.value = profile.phone || '';
    if (profile.targetJobRoleId) targetRoleSelect.value = profile.targetJobRoleId;
    bioInput.value = profile.bio || '';

    updateChecklist(profile);
  } catch (err) {
    showToast(err.message || 'Failed to load profile details', 'error');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Saving...';

    const payload = {
      college: collegeInput.value.trim() || null,
      degree: degreeSelect.value || null,
      branch: branchInput.value.trim() || null,
      graduationYear: gradYearInput.value ? parseInt(gradYearInput.value) : null,
      cgpa: cgpaInput.value ? parseFloat(cgpaInput.value) : null,
      phone: phoneInput.value.trim() || null,
      targetJobRoleId: targetRoleSelect.value ? parseInt(targetRoleSelect.value) : null,
      bio: bioInput.value.trim() || null
    };

    try {
      const updated = await studentApi.updateProfile(payload);
      showToast('Profile updated successfully!', 'success');
      updateChecklist(updated);
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="bi bi-check2-circle"></i> <span>Save Changes</span>';
    }
  });

  function updateChecklist(p) {
    let score = 10;
    const items = [
      { label: 'Basic Account Info', done: true },
      { label: 'College / Institute', done: Boolean(p.college) },
      { label: 'Degree & Branch', done: Boolean(p.degree && p.branch) },
      { label: 'Graduation Year & CGPA', done: Boolean(p.graduationYear && p.cgpa !== null) },
      { label: 'Contact Phone', done: Boolean(p.phone) },
      { label: 'Professional Bio', done: Boolean(p.bio) },
      { label: 'Target Job Role Selected', done: Boolean(p.targetJobRoleId) }
    ];

    if (p.college) score += 15;
    if (p.degree) score += 10;
    if (p.branch) score += 10;
    if (p.graduationYear) score += 5;
    if (p.cgpa !== null && p.cgpa !== undefined) score += 5;
    if (p.phone) score += 5;
    if (p.bio) score += 10;
    if (p.targetJobRoleId) score += 30;
    score = Math.min(score, 100);

    document.getElementById('completion-badge').textContent = `${score}%`;
    document.getElementById('completion-bar').style.width = `${score}%`;

    const checklistEl = document.getElementById('completion-checklist');
    checklistEl.innerHTML = items.map(item => `
      <div class="list-group-item bg-transparent px-0 d-flex align-items-center justify-content-between border-0 py-1">
        <span class="${item.done ? 'text-dark' : 'text-muted'}">${item.label}</span>
        <i class="bi ${item.done ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'}"></i>
      </div>
    `).join('');
  }
});
