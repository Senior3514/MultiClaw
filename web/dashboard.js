import { getSession, isSingleUserSession, mountSession, requireAuth } from './auth.js';

await requireAuth();
mountSession();

const titleEl = document.getElementById('dashboardTitle');
const recentCompaniesEl = document.getElementById('recentCompanies');
const statsCompaniesEl = document.getElementById('statsCompanies');
const statsUsersEl = document.getElementById('statsUsers');
const statsArtifactsEl = document.getElementById('statsArtifacts');
const missionWorkspaceStateEl = document.getElementById('missionWorkspaceState');
const missionWorkspaceCopyEl = document.getElementById('missionWorkspaceCopy');
const missionCompaniesStateEl = document.getElementById('missionCompaniesState');
const missionCompaniesCopyEl = document.getElementById('missionCompaniesCopy');
const missionArtifactsStateEl = document.getElementById('missionArtifactsState');
const missionArtifactsCopyEl = document.getElementById('missionArtifactsCopy');
const session = getSession();

if (session?.email) {
  titleEl.textContent = isSingleUserSession(session)
    ? 'Welcome to your MultiClaw command center.'
    : `Welcome back, ${session.email}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderCompany(company) {
  const execution = company.executionState || {};

  return `
    <div class="route-card">
      <small>${escapeHtml(company.generatedAt)}</small>
      <strong>${escapeHtml(company.projectName)}</strong>
      <p>${escapeHtml(company.archetype)}</p>
      <small>${escapeHtml(execution.status || 'unknown')}</small>
      <p>${escapeHtml(execution.focus || 'Awaiting visible focus')}</p>
      <div class="cta-row">
        <a class="button-link secondary" href="./company.html?id=${encodeURIComponent(company.companyId)}">View company</a>
      </div>
    </div>
  `;
}

async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    if (!response.ok) throw new Error(`Failed with status ${response.status}`);
    const stats = await response.json();
    statsCompaniesEl.textContent = stats.companies;
    statsUsersEl.textContent = stats.users;
    statsArtifactsEl.textContent = stats.artifacts;

    const cognitiveDepth = stats.artifacts >= 24
      ? 'Deepening'
      : stats.artifacts >= 8 || stats.companies >= 1
        ? 'Execution-visible'
        : 'Surface-only';
    if (missionWorkspaceStateEl) missionWorkspaceStateEl.textContent = stats.mode === 'single-user' ? 'Single-user command center online' : `${stats.users} workspace user${stats.users === 1 ? '' : 's'} online`;
    if (missionWorkspaceCopyEl) missionWorkspaceCopyEl.textContent = stats.mode === 'single-user'
      ? 'Low-friction operator access is active. The command surface is ready for steering and verification.'
      : 'Workspace flow active across install, steering, and company generation.';
    if (missionCompaniesStateEl) missionCompaniesStateEl.textContent = `${stats.companies} company cell${stats.companies === 1 ? '' : 's'} live`;
    if (missionCompaniesCopyEl) missionCompaniesCopyEl.textContent = 'The company layer is visible through topology, execution state, activity feed, and operator control surfaces.';
    if (missionArtifactsStateEl) missionArtifactsStateEl.textContent = `Cognitive depth: ${cognitiveDepth}`;
    if (missionArtifactsCopyEl) missionArtifactsCopyEl.textContent = `${stats.artifacts} artifacts are currently shaping visible execution memory inside the workspace.`;
  } catch (error) {
    console.error(error);
    statsCompaniesEl.textContent = '-';
    statsUsersEl.textContent = '-';
    statsArtifactsEl.textContent = '-';
  }
}

async function loadRecentCompanies() {
  try {
    const response = await fetch('/api/companies');
    if (!response.ok) throw new Error(`Failed with status ${response.status}`);
    const companies = await response.json();

    if (!companies.length) {
      recentCompaniesEl.innerHTML = '<div class="route-card"><strong>No companies yet</strong><p>Generate the first one from the generator.</p><div class="cta-row"><a class="button-link primary" href="./generator.html">Generate first company</a></div></div>';
      return;
    }

    recentCompaniesEl.innerHTML = companies.slice(0, 3).map(renderCompany).join('');
  } catch (error) {
    console.error(error);
    recentCompaniesEl.innerHTML = '<div class="route-card"><strong>Failed to load companies</strong><p>Try again shortly.</p><div class="cta-row"><a class="button-link secondary" href="./companies.html">Companies</a></div></div>';
  }
}

loadStats();
loadRecentCompanies();
