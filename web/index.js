import { hasServerSession } from './auth.js';

const tryGeneratorBtn = document.getElementById('tryGeneratorBtn');
const openDashboardBtn = document.getElementById('openDashboardBtn');

const session = await hasServerSession();

if (session?.email) {
  if (tryGeneratorBtn) tryGeneratorBtn.href = './generator.html';
  if (openDashboardBtn) openDashboardBtn.href = './dashboard.html';
} else {
  if (tryGeneratorBtn) tryGeneratorBtn.href = './login.html';
  if (openDashboardBtn) openDashboardBtn.href = './login.html';
}
