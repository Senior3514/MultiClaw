import { mountSession, requireAuth } from './auth.js';

await requireAuth();
mountSession();

const params = new URLSearchParams(window.location.search);
const companyId = params.get('id');

const titleEl = document.getElementById('companyTitle');
const statusEl = document.getElementById('companyStatus');
const overviewEl = document.getElementById('companyOverview');
const executionEl = document.getElementById('companyExecution');
const assetsEl = document.getElementById('companyAssets');
const soulEl = document.getElementById('companySoul');
const routingEl = document.getElementById('companyRouting');
const contactSurfacesEl = document.getElementById('companyContactSurfaces');
const topologyEl = document.getElementById('companyTopology');
const rolesEl = document.getElementById('companyRoles');
const missionsEl = document.getElementById('companyMissions');
const nextStepsEl = document.getElementById('companyNextSteps');
const eventsEl = document.getElementById('companyEvents');
const artifactsEl = document.getElementById('companyArtifacts');
const downloadCompanyPackBtn = document.getElementById('downloadCompanyPackBtn');
const refineCompanyBtn = document.getElementById('refineCompanyBtn');
const runCompanyCycleBtn = document.getElementById('runCompanyCycleBtn');
const companyCycleResult = document.getElementById('companyCycleResult');
const companyAskInput = document.getElementById('companyAskInput');
const companyAskBtn = document.getElementById('companyAskBtn');
const companyAskResult = document.getElementById('companyAskResult');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setStatus(message, kind = 'idle') {
  statusEl.textContent = message;
  statusEl.className = `status-banner status-${kind}`;
}

function renderRows(rows) {
  return rows.map(([label, value]) => `
    <div class="brand-row">
      <small>${escapeHtml(label)}</small>
      <strong>${escapeHtml(value)}</strong>
      <p>Generated company metadata.</p>
    </div>
  `).join('');
}

function renderExecution(state) {
  if (!state) {
    return '<div class="route-card"><strong>Unknown</strong><p>Execution state is not available yet.</p></div>';
  }

  const missionBoard = (state.missionBoard || []).slice(0, 3).map((mission) => `${escapeHtml(mission.status)}: ${escapeHtml(mission.title)}`).join(' • ');
  const nextStepBoard = (state.nextStepBoard || []).slice(0, 2).map((step) => `${escapeHtml(step.status)}: ${escapeHtml(step.title)}`).join(' • ');

  return `
    <div class="brand-row">
      <small>Status</small>
      <strong>${escapeHtml(state.status)}</strong>
      <p>${escapeHtml(state.summary)}</p>
    </div>
    <div class="brand-row">
      <small>Current focus</small>
      <strong>${escapeHtml(state.focus)}</strong>
      <p>What this company should concentrate on right now.</p>
    </div>
    <div class="brand-row">
      <small>Last visible activity</small>
      <strong>${escapeHtml(state.lastActivityAt)}</strong>
      <p>${escapeHtml(state.eventsCount)} events, ${escapeHtml(state.missionsCount)} missions, ${escapeHtml(state.nextStepsCount)} next steps.</p>
    </div>
    <div class="route-card">
      <small>Mission board</small>
      <strong>Execution posture</strong>
      <p>${missionBoard || 'No mission board yet.'}</p>
    </div>
    <div class="route-card">
      <small>Next-step board</small>
      <strong>Activation posture</strong>
      <p>${nextStepBoard || 'No next-step board yet.'}</p>
    </div>
  `;
}

function renderAssets(assets) {
  const list = assets?.length ? assets : ['No attached claws or systems declared yet.'];
  return list.map((asset) => `
    <div class="route-card">
      <strong>${escapeHtml(asset)}</strong>
      <p>Imported into the company context as an existing claw, system, or asset.</p>
    </div>
  `).join('');
}

function renderSoul(soul) {
  return Object.entries(soul || {}).map(([label, value]) => `
    <div class="brand-row">
      <small>${escapeHtml(label)}</small>
      <strong>${escapeHtml(value)}</strong>
      <p>Generated company identity and operating style.</p>
    </div>
  `).join('');
}

function renderRouting(profile) {
  return Object.entries(profile).map(([label, value]) => `
    <div class="route-card">
      <small>${escapeHtml(label)}</small>
      <strong>${escapeHtml(value)}</strong>
      <p>Current default routing choice for this capability.</p>
    </div>
  `).join('');
}

function renderContactSurfaces(surfaces) {
  return (surfaces || []).map((surface) => `
    <div class="route-card">
      <small>${escapeHtml(surface.status)}</small>
      <strong>${escapeHtml(surface.name)}</strong>
      <p>${escapeHtml(surface.purpose)}</p>
      <small>${escapeHtml(surface.substrate)}</small>
    </div>
  `).join('');
}

function renderTopology(roles) {
  const labels = roles.slice(0, 4).map((role) => role.title);
  const [top = 'Leadership', right = 'Growth', bottom = 'Operations', left = 'Trust'] = labels;

  return `
    <div class="topology-core">Primary operator</div>
    <div class="topology-node node-top">${escapeHtml(top)}</div>
    <div class="topology-node node-right">${escapeHtml(right)}</div>
    <div class="topology-node node-bottom">${escapeHtml(bottom)}</div>
    <div class="topology-node node-left">${escapeHtml(left)}</div>
  `;
}

function renderRoles(roles) {
  return roles.map((role) => `
    <div class="role-card">
      <h4>${escapeHtml(role.title)}</h4>
      <p>${escapeHtml(role.scope)}</p>
    </div>
  `).join('');
}

function renderMissions(missions) {
  return missions.map((mission, index) => `
    <div class="mission-card">
      <small>Mission ${index + 1}</small>
      <strong>${escapeHtml(mission)}</strong>
      <p>Immediate operating focus for this generated company.</p>
    </div>
  `).join('');
}

function renderNextSteps(steps) {
  return steps.map((step, index) => `
    <div class="mission-card">
      <small>Step ${index + 1}</small>
      <strong>${escapeHtml(step)}</strong>
      <p>Recommended next move to activate the company further.</p>
    </div>
  `).join('');
}

function renderEvents(events) {
  const list = events?.length ? events : [{ title: 'No activity yet', detail: 'This company has not logged any visible events yet.', timestamp: 'Waiting', kind: 'idle' }];
  return list.map((event) => `
    <div class="mission-card">
      <small>${escapeHtml(event.timestamp)}</small>
      <strong>${escapeHtml(event.title)}</strong>
      <p>${escapeHtml(event.detail)}</p>
    </div>
  `).join('');
}

function renderArtifacts(artifacts) {
  return artifacts.map((artifact) => `
    <div class="route-card">
      <small>${escapeHtml(artifact.size)} bytes</small>
      <strong>${escapeHtml(artifact.name)}</strong>
      <p>Generated artifact saved by the backend for this company.</p>
      <div class="cta-row">
        <a class="button-link secondary" href="/api/company/${encodeURIComponent(companyId)}/artifact/${encodeURIComponent(artifact.name)}">Download</a>
      </div>
    </div>
  `).join('');
}

function renderAskResult(result) {
  return `
    <div class="mission-card">
      <small>${escapeHtml(result.speaker)}</small>
      <strong>${escapeHtml(result.reply)}</strong>
      <p>${(result.suggestedActions || []).map(escapeHtml).join(' • ')}</p>
    </div>
  `;
}

function renderCycleResult(result) {
  return `
    <div class="mission-card">
      <small>Cycle ${escapeHtml(result.cycleNumber)}</small>
      <strong>${escapeHtml(result.focus)}</strong>
      <p>${escapeHtml(result.summary)} Artifact: ${escapeHtml(result.artifact)}</p>
    </div>
  `;
}

async function runCompanyCycle() {
  if (!runCompanyCycleBtn) return;

  runCompanyCycleBtn.disabled = true;
  if (companyCycleResult) {
    companyCycleResult.innerHTML = '<div class="route-card"><strong>Running cycle...</strong><p>Advancing the company execution loop.</p></div>';
  }

  try {
    const response = await fetch(`/api/company/${encodeURIComponent(companyId)}/cycle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Failed with status ${response.status}`);
    if (companyCycleResult) {
      companyCycleResult.innerHTML = renderCycleResult(result);
    }
    await loadCompany();
  } catch (error) {
    console.error(error);
    if (companyCycleResult) {
      companyCycleResult.innerHTML = '<div class="route-card"><strong>Cycle failed</strong><p>The company could not advance this execution cycle.</p></div>';
    }
  } finally {
    runCompanyCycleBtn.disabled = false;
  }
}

async function askCompany() {
  const prompt = companyAskInput?.value?.trim();
  if (!prompt) return;

  companyAskBtn.disabled = true;
  companyAskResult.innerHTML = '<div class="route-card"><strong>Thinking...</strong><p>Contacting the company operator surface.</p></div>';

  try {
    const response = await fetch(`/api/company/${encodeURIComponent(companyId)}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Failed with status ${response.status}`);
    companyAskResult.innerHTML = renderAskResult(result);
    await loadCompany();
  } catch (error) {
    console.error(error);
    companyAskResult.innerHTML = '<div class="route-card"><strong>Request failed</strong><p>The company did not answer this request.</p></div>';
  } finally {
    companyAskBtn.disabled = false;
  }
}

async function loadCompany() {
  if (!companyId) {
    titleEl.textContent = 'Missing company ID';
    setStatus('No company ID was provided in the URL.', 'error');
    return;
  }

  try {
    if (downloadCompanyPackBtn) {
      downloadCompanyPackBtn.href = `/api/company/${encodeURIComponent(companyId)}/download`;
    }
    if (refineCompanyBtn) {
      refineCompanyBtn.href = `./generator.html?companyId=${encodeURIComponent(companyId)}`;
    }

    const response = await fetch(`/api/company/${encodeURIComponent(companyId)}`);
    if (!response.ok) throw new Error(`Failed with status ${response.status}`);
    const company = await response.json();
    const artifactsResponse = await fetch(`/api/company/${encodeURIComponent(companyId)}/artifacts`);
    const artifacts = artifactsResponse.ok ? await artifactsResponse.json() : [];
    const eventsResponse = await fetch(`/api/company/${encodeURIComponent(companyId)}/events`);
    const events = eventsResponse.ok ? await eventsResponse.json() : [];

    titleEl.textContent = company.projectName;
    setStatus(`Loaded company ${company.companyId}.`, 'success');

    overviewEl.innerHTML = renderRows([
      ['Company ID', company.companyId],
      ['Archetype', company.archetype],
      ['Audience', company.audience],
      ['Business model', company.businessModel],
      ['Stage', company.stage],
      ['Generated', company.generatedAt],
    ]);
    if (executionEl) executionEl.innerHTML = renderExecution(company.executionState);
    assetsEl.innerHTML = renderAssets(company.existingAssets);
    soulEl.innerHTML = renderSoul(company.companySoul);
    routingEl.innerHTML = renderRouting(company.routing);
    contactSurfacesEl.innerHTML = renderContactSurfaces(company.contactSurfaces);
    topologyEl.innerHTML = renderTopology(company.roles);
    rolesEl.innerHTML = renderRoles(company.roles);
    missionsEl.innerHTML = renderMissions(company.missions);
    nextStepsEl.innerHTML = renderNextSteps(company.nextSteps || []);
    if (eventsEl) eventsEl.innerHTML = renderEvents(events);
    artifactsEl.innerHTML = renderArtifacts(artifacts);
  } catch (error) {
    console.error(error);
    titleEl.textContent = companyId;
    setStatus('Failed to load company data.', 'error');
  }
}

runCompanyCycleBtn?.addEventListener('click', runCompanyCycle);
companyAskBtn?.addEventListener('click', askCompany);
companyAskInput?.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    askCompany();
  }
});

loadCompany();
