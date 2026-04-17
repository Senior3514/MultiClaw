import { hasServerSession } from './auth.js';

const tryGeneratorBtn = document.getElementById('tryGeneratorBtn');
const openWorkspaceBtn = document.getElementById('openWorkspaceBtn');

const session = await hasServerSession();

if (session?.email) {
  document.querySelectorAll('[data-auth-dashboard]').forEach((link) => {
    link.href = './dashboard.html';
  });
  if (tryGeneratorBtn) tryGeneratorBtn.href = './generator.html';
  if (openWorkspaceBtn) {
    openWorkspaceBtn.href = './dashboard.html';
    openWorkspaceBtn.textContent = 'Open workspace';
  }
} else {
  if (tryGeneratorBtn) tryGeneratorBtn.href = './login.html';
  if (openWorkspaceBtn) {
    openWorkspaceBtn.href = './signup.html';
    openWorkspaceBtn.textContent = 'Create account';
  }
}
