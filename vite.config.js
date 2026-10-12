import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    host: 'localhost',
    open: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'pages/login.html'),
        register: resolve(__dirname, 'pages/register.html'),
        dashboard: resolve(__dirname, 'pages/dashboard.html'),
        profile: resolve(__dirname, 'pages/profile.html'),
        skills: resolve(__dirname, 'pages/skills.html'),
        jobRoles: resolve(__dirname, 'pages/job-roles.html'),
        skillGap: resolve(__dirname, 'pages/skill-gap.html'),
        assessment: resolve(__dirname, 'pages/assessment.html'),
        learningPath: resolve(__dirname, 'pages/learning-path.html'),
        projects: resolve(__dirname, 'pages/projects.html'),
        certifications: resolve(__dirname, 'pages/certifications.html'),
        progress: resolve(__dirname, 'pages/progress.html'),
        admin: resolve(__dirname, 'pages/admin.html')
      }
    }
  }
});
