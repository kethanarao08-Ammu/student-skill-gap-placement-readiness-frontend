/**
 * Main Frontend Application Entry Point
 * Student Skill Gap & Placement Readiness System
 */
import { renderNavbar } from './components/navbar.js';
import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  // Render layout components
  renderNavbar('navbar-root');

  const statusOutput = document.getElementById('runtime-check-output');
  if (statusOutput) {
    const timestamp = new Date().toLocaleString();
    statusOutput.innerHTML = `
      <div><strong>[System Initialized]</strong> Vite Frontend Runtime Active</div>
      <div><strong>[Timestamp]</strong> ${timestamp}</div>
      <div><strong>[API Gateway Target]</strong> ${API_BASE_URL}</div>
      <div><strong>[Phase Status]</strong> Phase 1 Directory Structure &amp; Configurations Ready</div>
    `;
  }

  console.log('[SkillGap] Phase 1 Frontend Scaffold Initialized Successfully.');
});
