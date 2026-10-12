/**
 * Navigation Bar Component
 * Renders the top application header and brand element.
 */
export function renderNavbar(containerId = 'navbar-root') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div class="container">
        <a class="navbar-brand fw-bold d-flex align-items-center gap-2" href="#">
          <span class="fs-4">🎓</span>
          <span>SkillGap &amp; Placement Readiness</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-controls="navMenu" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMenu">
          <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link active" aria-current="page" href="#main-content">Overview</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#tech-stack-section">Tech Stack</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#folder-structure-section">Verification</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  `;
}
