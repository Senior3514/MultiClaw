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
const readinessScoreEl = document.getElementById('readinessScore');
const readinessFillEl = document.getElementById('readinessFill');
const readinessCaptionEl = document.getElementById('readinessCaption');
const cognitiveLoadValueEl = document.getElementById('cognitiveLoadValue');
const cognitiveLoadFillEl = document.getElementById('cognitiveLoadFill');
const memoryDepthValueEl = document.getElementById('memoryDepthValue');
const memoryDepthFillEl = document.getElementById('memoryDepthFill');
const heroRuntimeTagEl = document.getElementById('heroRuntimeTag');
const strategicHeadlineEl = document.getElementById('strategicHeadline');
const strategicDetailEl = document.getElementById('strategicDetail');
const strategicCtaEl = document.getElementById('strategicCta');
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

function countUp(element, target, { duration = 900 } = {}) {
  if (!element) return;
  const start = Number(element.dataset.current || 0);
  const end = Number.isFinite(target) ? target : 0;
  if (start === end) {
    element.textContent = String(end);
    element.dataset.current = String(end);
    return;
  }
  const startedAt = performance.now();
  const step = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(start + (end - start) * eased);
    element.textContent = String(value);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.dataset.current = String(end);
    }
  };
  requestAnimationFrame(step);
}

function renderCompany(company) {
  const execution = company.executionState || {};
  const autopilot = company.autopilotState || execution.autopilot || {};

  return `
    <div class="route-card">
      <small>${escapeHtml(company.generatedAt)}</small>
      <strong>${escapeHtml(company.projectName)}</strong>
      <p>${escapeHtml(company.archetype)}</p>
      <small>${escapeHtml(execution.status || 'unknown')}</small>
      <p>${escapeHtml(execution.focus || 'Awaiting visible focus')}</p>
      <small>${escapeHtml(autopilot.enabled ? `Autopilot ${autopilot.intervalMinutes || 30}m` : 'Autopilot paused')}</small>
      <div class="cta-row">
        <a class="button-link secondary" href="./company.html?id=${encodeURIComponent(company.companyId)}">View company</a>
      </div>
    </div>
  `;
}

function computeCognitiveLoad(stats, companies) {
  const events = companies.reduce((acc, company) => acc + (company?.executionState?.eventsCount || 0), 0);
  const cycles = companies.reduce((acc, company) => {
    const state = company?.executionState || {};
    return acc + (state.cyclesCount || 0);
  }, 0);
  const signal = events * 3 + cycles * 6 + (stats.companies || 0) * 12 + (stats.artifacts || 0);
  const saturation = Math.min(100, Math.round((signal / 120) * 100));
  const label = saturation >= 75 ? 'saturated' : saturation >= 40 ? 'engaged' : saturation >= 10 ? 'warming' : 'idle';
  return { saturation, label, events };
}

function computeMemoryDepth(stats) {
  const artifacts = stats.artifacts || 0;
  const companies = stats.companies || 0;
  if (artifacts >= 24 || companies >= 3) return { label: 'Deepening', ratio: 0.9 };
  if (artifacts >= 8 || companies >= 1) return { label: 'Execution-visible', ratio: 0.55 };
  return { label: 'Surface-only', ratio: 0.15 };
}

function computeReadiness(stats, cognitive, depth) {
  const runtimeHealthy = 50;
  const companyPulse = Math.min(25, (stats.companies || 0) * 8 + (stats.artifacts || 0));
  const cognitivePulse = Math.round(cognitive.saturation * 0.15);
  const depthPulse = Math.round(depth.ratio * 10);
  const score = Math.max(0, Math.min(100, runtimeHealthy + companyPulse + cognitivePulse + depthPulse));
  const verdict = score >= 90 ? 'System ready' : score >= 70 ? 'System stabilizing' : 'System warming up';
  return { score, verdict };
}

function computeStrategicRecommendation(stats, cognitive, depth) {
  if ((stats.companies || 0) === 0) {
    return {
      headline: 'Generate the first company to activate the command center.',
      detail: 'MultiClaw is online. The fastest next move is standing up one operating company and seeding the vector memory.',
      cta: { label: 'Generate a company', href: './generator.html' },
    };
  }
  if (cognitive.saturation < 20) {
    return {
      headline: 'Steer the company to build visible execution memory.',
      detail: 'The runtime is healthy. Running a steering cycle will deepen memory and unlock autopilot quality.',
      cta: { label: 'Open companies', href: './companies.html' },
    };
  }
  if (depth.ratio < 0.5) {
    return {
      headline: 'Deepen memory with another execution cycle.',
      detail: 'Memory is execution-visible. Another cycle moves it toward deepening and strengthens the company pulse.',
      cta: { label: 'Run a cycle', href: './companies.html' },
    };
  }
  return {
    headline: 'Command center is at operating strength.',
    detail: 'All surfaces are healthy. Consider onboarding another company or shipping the first external surface.',
    cta: { label: 'Tour platform', href: './platform.html' },
  };
}

function animateBar(element, percent) {
  if (!element) return;
  element.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

async function loadDashboard() {
  let stats = { companies: 0, users: 0, artifacts: 0, mode: 'multi-user' };
  let companies = [];

  try {
    const [statsResponse, companiesResponse] = await Promise.all([
      fetch('/api/stats'),
      fetch('/api/companies'),
    ]);
    if (!statsResponse.ok) throw new Error(`stats failed with ${statsResponse.status}`);
    if (!companiesResponse.ok) throw new Error(`companies failed with ${companiesResponse.status}`);
    stats = await statsResponse.json();
    companies = await companiesResponse.json();
  } catch (error) {
    console.error(error);
    statsCompaniesEl.textContent = '-';
    statsUsersEl.textContent = '-';
    statsArtifactsEl.textContent = '-';
    if (readinessCaptionEl) readinessCaptionEl.textContent = 'Command center metrics unavailable. Retry shortly.';
    if (recentCompaniesEl) recentCompaniesEl.innerHTML = '<div class="route-card"><strong>Failed to load companies</strong><p>Try again shortly.</p><div class="cta-row"><a class="button-link secondary" href="./companies.html">Companies</a></div></div>';
    return;
  }

  countUp(statsCompaniesEl, stats.companies || 0);
  countUp(statsUsersEl, stats.users || 0);
  countUp(statsArtifactsEl, stats.artifacts || 0);

  const cognitive = computeCognitiveLoad(stats, companies);
  const depth = computeMemoryDepth(stats);
  const readiness = computeReadiness(stats, cognitive, depth);
  const recommendation = computeStrategicRecommendation(stats, cognitive, depth);

  if (missionWorkspaceStateEl) {
    missionWorkspaceStateEl.textContent = stats.mode === 'single-user'
      ? 'Single-user command center online'
      : `${stats.users} workspace user${stats.users === 1 ? '' : 's'} online`;
  }
  if (missionWorkspaceCopyEl) {
    missionWorkspaceCopyEl.textContent = stats.mode === 'single-user'
      ? 'Low-friction operator access is active. The command surface is ready for steering and verification.'
      : 'Workspace flow active across install, steering, and company generation.';
  }
  if (missionCompaniesStateEl) missionCompaniesStateEl.textContent = `${stats.companies} company cell${stats.companies === 1 ? '' : 's'} live`;
  if (missionCompaniesCopyEl) missionCompaniesCopyEl.textContent = 'Topology, execution state, and operator control surfaces keep the company visible.';
  if (missionArtifactsStateEl) missionArtifactsStateEl.textContent = `Cognitive depth: ${depth.label}`;
  if (missionArtifactsCopyEl) missionArtifactsCopyEl.textContent = `${stats.artifacts} artifacts are currently shaping visible execution memory inside the workspace.`;

  if (readinessScoreEl) readinessScoreEl.textContent = `${readiness.score}%`;
  animateBar(readinessFillEl, readiness.score);
  if (readinessCaptionEl) readinessCaptionEl.textContent = `${readiness.verdict} · ${stats.companies} companies · ${stats.artifacts} artifacts · ${cognitive.events} events`;
  if (cognitiveLoadValueEl) cognitiveLoadValueEl.textContent = `${cognitive.label} · ${cognitive.saturation}%`;
  animateBar(cognitiveLoadFillEl, cognitive.saturation);
  if (memoryDepthValueEl) memoryDepthValueEl.textContent = depth.label;
  animateBar(memoryDepthFillEl, Math.round(depth.ratio * 100));

  if (heroRuntimeTagEl) {
    heroRuntimeTagEl.textContent = readiness.score >= 90
      ? 'runtime · ready'
      : readiness.score >= 70
        ? 'runtime · stabilizing'
        : 'runtime · warming up';
  }

  if (strategicHeadlineEl) strategicHeadlineEl.textContent = recommendation.headline;
  if (strategicDetailEl) strategicDetailEl.textContent = recommendation.detail;
  if (strategicCtaEl) {
    strategicCtaEl.textContent = recommendation.cta.label;
    strategicCtaEl.setAttribute('href', recommendation.cta.href);
  }

  if (!companies.length) {
    recentCompaniesEl.innerHTML = '<div class="route-card"><strong>No companies yet</strong><p>Generate the first one from the generator.</p><div class="cta-row"><a class="button-link primary" href="./generator.html">Generate first company</a></div></div>';
  } else {
    recentCompaniesEl.innerHTML = companies.slice(0, 3).map(renderCompany).join('');
  }
}

loadDashboard();
