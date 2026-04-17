import { getSession, mountSession, requireAuth } from './auth.js';

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
  titleEl.textContent = `Welcome back, ${session.email}`;
}

function renderCompany(company) {
  const execution = company.executionState || {};

  return `
    <div class="route-card">
      <small>${company.generatedAt}</small>
      <strong>${company.projectName}</strong>
      <p>${company.archetype}</p>
      <small>${execution.status || 'unknown'}</small>
      <p>${execution.focus || 'Awaiting visible focus'}</p>
      <div class="cta-row">
        <a class="button-link secondary" href="./company.html?id=${encodeURIComponent(company.companyId)}">Open company</a>
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

    if (missionWorkspaceStateEl) missionWorkspaceStateEl.textContent = `${stats.users} workspace user${stats.users === 1 ? '' : 's'} online`;
    if (missionWorkspaceCopyEl) missionWorkspaceCopyEl.textContent = 'Workspace flow active across install, steering, and company generation.';
    if (missionCompaniesStateEl) missionCompaniesStateEl.textContent = `${stats.companies} generated compan${stats.companies === 1 ? 'y' : 'ies'}`;
    if (missionCompaniesCopyEl) missionCompaniesCopyEl.textContent = 'The company layer is visible through topology, execution state, activity feed, and company control surfaces.';
    if (missionArtifactsStateEl) missionArtifactsStateEl.textContent = `${stats.artifacts} artifacts live`;
    if (missionArtifactsCopyEl) missionArtifactsCopyEl.textContent = 'Generated outputs are accumulating as tangible proof that the product is doing real work.';
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
    recentCompaniesEl.innerHTML = '<div class="route-card"><strong>Failed to load companies</strong><p>Try again shortly.</p><div class="cta-row"><a class="button-link secondary" href="./companies.html">Open companies</a></div></div>';
  }
}

loadStats();
loadRecentCompanies();
