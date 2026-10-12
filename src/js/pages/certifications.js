import { requireAuth, setupNavigation } from '../utils/authGuard.js';
import { certificationApi } from '../api/certificationApi.js';
import { showToast } from '../utils/notifications.js';
import * as bootstrap from 'bootstrap';

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  setupNavigation('certifications');

  let certs = [];
  const container = document.getElementById('certs-container');
  const form = document.getElementById('cert-form');
  const editIdInput = document.getElementById('cert-edit-id');
  const titleInput = document.getElementById('cert-title');
  const orgInput = document.getElementById('cert-org');
  const dateInput = document.getElementById('cert-date');
  const idNumberInput = document.getElementById('cert-number');
  const urlInput = document.getElementById('cert-url');
  const saveBtn = document.getElementById('btn-save-cert');
  const modalEl = document.getElementById('certModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  document.getElementById('btn-add-cert-modal').addEventListener('click', () => {
    form.reset();
    editIdInput.value = '';
    document.getElementById('certModalLabel').textContent = 'Add Certification';
  });

  try {
    certs = await certificationApi.getCertifications();
    renderCerts();
  } catch (err) {
    showToast(err.message || 'Failed to load certifications', 'error');
  }

  function renderCerts() {
    updateCertScore();

    if (!certs || certs.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="stat-icon bg-light text-muted mx-auto mb-3" style="width:50px; height:50px;">
            <i class="bi bi-award fs-3"></i>
          </div>
          <h6 class="fw-bold text-dark">No certifications added yet</h6>
          <p class="small text-muted mb-3">Adding verified certifications contributes 10% towards your placement readiness score.</p>
          <button class="btn btn-primary-custom btn-sm" data-bs-toggle="modal" data-bs-target="#certModal">
            <i class="bi bi-plus-lg me-1"></i> Add First Certification
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = certs.map(c => `
      <div class="col-md-6 col-xl-4">
        <div class="card-modern p-4 h-100 d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div class="d-flex align-items-center gap-2">
              <div class="stat-icon bg-success bg-opacity-10 text-success p-2" style="width:36px; height:36px; font-size:1.1rem;">
                <i class="bi bi-patch-check"></i>
              </div>
              <div>
                <span class="badge-pill-custom badge-matched" style="font-size:0.7rem;">Verified</span>
              </div>
            </div>
            <div class="dropdown">
              <button class="btn btn-sm btn-light border-0" type="button" data-bs-toggle="dropdown">
                <i class="bi bi-three-dots-vertical"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                <li><a class="dropdown-item btn-edit-cert" href="#" data-id="${c.id}">Edit</a></li>
                <li><a class="dropdown-item text-danger btn-delete-cert" href="#" data-id="${c.id}">Delete</a></li>
              </ul>
            </div>
          </div>

          <h5 class="fw-bold mb-1 text-dark mt-2">${c.title}</h5>
          <h6 class="text-primary small mb-3">${c.issuingOrganization}</h6>

          <div class="small text-muted mb-3 flex-grow-1">
            ${c.issueDate ? `<div><i class="bi bi-calendar-event me-2"></i>Issued: ${c.issueDate}</div>` : ''}
            ${c.certificateId ? `<div><i class="bi bi-hash me-2"></i>ID: <code>${c.certificateId}</code></div>` : ''}
          </div>

          <div class="pt-3 border-top mt-auto">
            ${c.credentialUrl ? `
              <a href="${c.credentialUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-custom w-100 d-flex justify-content-center align-items-center gap-1">
                <span>Verify Credential</span>
                <i class="bi bi-box-arrow-up-right"></i>
              </a>
            ` : `
              <span class="text-muted small">No verification link provided</span>
            `}
          </div>
        </div>
      </div>
    `).join('');

    // Attach edit and delete listeners
    document.querySelectorAll('.btn-edit-cert').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = parseInt(btn.getAttribute('data-id'));
        const c = certs.find(item => item.id === id);
        if (c) {
          editIdInput.value = c.id;
          titleInput.value = c.title || '';
          orgInput.value = c.issuingOrganization || '';
          dateInput.value = c.issueDate || '';
          idNumberInput.value = c.certificateId || '';
          urlInput.value = c.credentialUrl || '';
          document.getElementById('certModalLabel').textContent = 'Edit Certification';
          modal.show();
        }
      });
    });

    document.querySelectorAll('.btn-delete-cert').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = parseInt(btn.getAttribute('data-id'));
        if (confirm('Delete this certification?')) {
          try {
            await certificationApi.deleteCertification(id);
            certs = certs.filter(item => item.id !== id);
            showToast('Certification deleted', 'success');
            renderCerts();
          } catch (err) {
            showToast(err.message || 'Failed to delete certification', 'error');
          }
        }
      });
    });
  }

  function updateCertScore() {
    const count = certs.length;
    document.getElementById('total-certs-pill').textContent = `${count} Certification${count !== 1 ? 's' : ''}`;
    let score = 0;
    if (count === 1) score = 60;
    else if (count >= 2) score = 100;

    document.getElementById('cert-score-badge').textContent = `${score}% (Points Earned: ${(score * 0.10).toFixed(1)} / 10)`;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isEdit = Boolean(editIdInput.value);
    const id = parseInt(editIdInput.value);

    const payload = {
      title: titleInput.value.trim(),
      issuingOrganization: orgInput.value.trim(),
      issueDate: dateInput.value || null,
      certificateId: idNumberInput.value.trim() || null,
      credentialUrl: urlInput.value.trim() || null
    };

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';

    try {
      if (isEdit) {
        const updated = await certificationApi.updateCertification(id, payload);
        const idx = certs.findIndex(c => c.id === id);
        if (idx >= 0) certs[idx] = updated;
        showToast('Certification updated!', 'success');
      } else {
        const created = await certificationApi.createCertification(payload);
        certs.unshift(created);
        showToast('Certification added!', 'success');
      }

      modal.hide();
      form.reset();
      renderCerts();
    } catch (err) {
      showToast(err.message || 'Failed to save certification', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Save Certification';
    }
  });
});
