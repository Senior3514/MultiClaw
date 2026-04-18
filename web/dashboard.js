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
    ? 'Welcome to your MultiClaw workspace.'
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
    recentCompaniesEl.innerHTML = '<div class="route-card"><strong>Failed to load companies</strong><p>Try again shortly.</p><div class="cta-row"><a class="button-link secondary" href="./companies.html">Companies</a></div></div>';
  }
}

const pulseMemoryEl = document.getElementById('pulseMemory');
const pulseLoadEl = document.getElementById('pulseLoad');
const pulseLatestEl = document.getElementById('pulseLatest');
const pulseLatestDetailEl = document.getElementById('pulseLatestDetail');
const pulseRecommendationEl = document.getElementById('pulseRecommendation');
const pulseTimestampEl = document.getElementById('pulseTimestamp');

function buildRecommendation(pulse) {
  if (!pulse.companies) {
    return 'Generate the first company to bring the workspace to life.';
  }
  if (!pulse.events) {
    return 'Open the latest company and run a cycle to create visible activity.';
  }
  return 'Refine the latest company, run another cycle, or start a new one.';
}

async function loadPulse() {
  if (!pulseMemoryEl) return;
  try {
    const response = await fetch('/api/pulse');
    if (!response.ok) throw new Error(`Failed with status ${response.status}`);
    const pulse = await response.json();

    pulseMemoryEl.textContent = `${pulse.companies} compan${pulse.companies === 1 ? 'y' : 'ies'} · ${pulse.artifacts} artifacts`;
    pulseLoadEl.textContent = pulse.cognitiveLoad || 'idle';
    if (pulse.latestCompany) {
      pulseLatestEl.textContent = pulse.latestCompany.projectName;
      pulseLatestDetailEl.textContent = pulse.latestActivityAt
        ? `Last activity ${pulse.latestActivityAt}.`
        : 'No timestamped activity yet.';
    } else {
      pulseLatestEl.textContent = 'None yet';
      pulseLatestDetailEl.textContent = 'No company has been generated on this runtime.';
    }
    pulseRecommendationEl.textContent = buildRecommendation(pulse);
    if (pulseTimestampEl) {
      pulseTimestampEl.textContent = pulse.pulseAt
        ? `Pulse ${pulse.pulseAt}`
        : 'Live telemetry';
    }
  } catch (error) {
    console.error(error);
    pulseMemoryEl.textContent = '-';
    pulseLoadEl.textContent = '-';
    pulseLatestEl.textContent = '-';
    pulseRecommendationEl.textContent = 'Pulse unavailable. Retry shortly.';
  }
}

loadStats();
loadRecentCompanies();
loadPulse();
