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
const activityNowEl = document.getElementById('companyActivityNow');
const alertsEl = document.getElementById('companyAlerts');
const topologyEl = document.getElementById('companyTopology');
const rolesEl = document.getElementById('companyRoles');
const missionsEl = document.getElementById('companyMissions');
const nextStepsEl = document.getElementById('companyNextSteps');
const eventsEl = document.getElementById('companyEvents');
const routingHistoryEl = document.getElementById('companyRoutingHistory');
const artifactsEl = document.getElementById('companyArtifacts');
const downloadCompanyPackBtn = document.getElementById('downloadCompanyPackBtn');
const refineCompanyBtn = document.getElementById('refineCompanyBtn');
const runCompanyCycleBtn = document.getElementById('runCompanyCycleBtn');
const toggleAutopilotBtn = document.getElementById('toggleAutopilotBtn');
const runAutopilotBtn = document.getElementById('runAutopilotBtn');
const companyCycleResult = document.getElementById('companyCycleResult');
const companyAutopilotResult = document.getElementById('companyAutopilotResult');
const companyAskInput = document.getElementById('companyAskInput');
const companyAskBtn = document.getElementById('companyAskBtn');
const companyAskResult = document.getElementById('companyAskResult');
let currentAutopilotState = null;

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

function parseUtcTimestamp(value) {
  if (!value) return null;
  const parsed = Date.parse(value.replace(' UTC', 'Z'));
  return Number.isFinite(parsed) ? new Date(parsed) : null;
}

function formatAgeLabel(value) {
  const stamp = parseUtcTimestamp(value);
  if (!stamp) return 'Unknown';
  const diffMinutes = Math.max(0, Math.round((Date.now() - stamp.getTime()) / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
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

  const autopilot = state.autopilot || {};
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
    <div class="route-card">
      <small>Background company loop</small>
      <strong>${escapeHtml(autopilot.enabled ? 'Autopilot enabled' : 'Autopilot paused')}</strong>
      <p>Runs: ${escapeHtml(autopilot.runCount ?? 0)} • Interval: ${escapeHtml(autopilot.intervalMinutes ?? 30)} min • Next run: ${escapeHtml(autopilot.nextRunAt || 'Not scheduled')}</p>
      <small>${escapeHtml(autopilot.lastResult || 'No autopilot result yet.')}</small>
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

function renderActivityNow(company, events) {
  const executionState = company.executionState || {};
  const autopilot = company.autopilotState || executionState.autopilot || {};
  const lastEvent = events?.[0];
  const currentFocus = executionState.focus || company.nextSteps?.[0] || company.missions?.[0] || 'Await first operator instruction.';
  const nextMove = autopilot.enabled
    ? `Autopilot will pulse again around ${escapeHtml(autopilot.nextRunAt || 'the next scheduled window')}.`
    : 'Autopilot is paused, so the next move should come from an operator cycle or direct ask.';

  return `
    <div class="route-card">
      <small>Current focus</small>
      <strong>${escapeHtml(currentFocus)}</strong>
      <p>${escapeHtml(executionState.summary || 'Execution state is still being established.')}</p>
    </div>
    <div class="route-card">
      <small>Latest visible move</small>
      <strong>${escapeHtml(lastEvent?.title || 'No visible move yet')}</strong>
      <p>${escapeHtml(lastEvent?.detail || 'Run a cycle or ask the company to create the first visible action.')}</p>
      <small>${escapeHtml(lastEvent?.timestamp ? `${lastEvent.timestamp} (${formatAgeLabel(lastEvent.timestamp)})` : 'Waiting')}</small>
    </div>
    <div class="route-card">
      <small>Next expected move</small>
      <strong>${escapeHtml(autopilot.enabled ? 'Background loop armed' : 'Operator action needed')}</strong>
      <p>${nextMove}</p>
    </div>
  `;
}

function deriveAlerts(company, events, artifacts) {
  const executionState = company.executionState || {};
  const autopilot = company.autopilotState || executionState.autopilot || {};
  const lastSeen = parseUtcTimestamp(events?.[0]?.timestamp || executionState.lastActivityAt);
  const ageMinutes = lastSeen ? Math.round((Date.now() - lastSeen.getTime()) / 60000) : null;
  const alerts = [];

  if (!events?.length) {
    alerts.push({
      severity: 'warning',
      title: 'No visible activity yet',
      detail: 'The company exists, but it still needs its first live cycle or operator interaction.',
    });
  }

  if (!autopilot.enabled) {
    alerts.push({
      severity: 'info',
      title: 'Autopilot is paused',
      detail: 'Background execution proof is currently paused. Enable autopilot if this company should keep moving on its own.',
    });
  }

  if (ageMinutes !== null && ageMinutes > 90) {
    alerts.push({
      severity: 'warning',
      title: 'Visible activity looks stale',
      detail: `Last visible movement was ${formatAgeLabel(events?.[0]?.timestamp || executionState.lastActivityAt)}. Run a cycle or ask the company for a fresh move.`,
    });
  }

  if (!artifacts?.length) {
    alerts.push({
      severity: 'info',
      title: 'No generated artifacts yet',
      detail: 'Artifact proof will become stronger once the company has produced a cycle, autopilot run, or downloaded bundle.',
    });
  }

  if (!alerts.length) {
    alerts.push({
      severity: 'ok',
      title: 'No immediate operator alerts',
      detail: 'The company has visible execution proof, recent activity, and no obvious recovery action needed right now.',
    });
  }

  return alerts;
}

function renderAlerts(alerts) {
  return alerts.map((alert) => `
    <div class="route-card alert-card alert-${escapeHtml(alert.severity)}">
      <small>${escapeHtml(alert.severity.toUpperCase())}</small>
      <strong>${escapeHtml(alert.title)}</strong>
      <p>${escapeHtml(alert.detail)}</p>
    </div>
  `).join('');
}

function renderRoutingHistory(events) {
  const interesting = (events || [])
    .filter((event) => ['execution-cycle', 'autopilot-cycle', 'operator-ask', 'autopilot-configured'].includes(event.kind))
    .slice(0, 6);

  if (!interesting.length) {
    return '<div class="route-card"><strong>No routing history yet</strong><p>Execution and operator signals will appear here once the company starts moving.</p></div>';
  }

  return interesting.map((event) => `
    <div class="route-card">
      <small>${escapeHtml(event.kind)}</small>
      <strong>${escapeHtml(event.title)}</strong>
      <p>${escapeHtml(event.detail)}</p>
      <small>${escapeHtml(event.timestamp)} • ${escapeHtml(formatAgeLabel(event.timestamp))}</small>
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

function renderAutopilotResult(result) {
  const autopilot = result.autopilot || result;
  const run = result.run;
  return `
    <div class="mission-card">
      <small>${escapeHtml(autopilot.enabled ? 'Autopilot enabled' : 'Autopilot paused')}</small>
      <strong>${escapeHtml(autopilot.lastResult || 'Autopilot updated')}</strong>
      <p>Interval: ${escapeHtml(autopilot.intervalMinutes)} min • Runs: ${escapeHtml(autopilot.runCount || 0)} • Next: ${escapeHtml(autopilot.nextRunAt || 'Not scheduled')}</p>
      ${run ? `<small>Latest run: ${escapeHtml(run.focus)} (${escapeHtml(run.artifact)})</small>` : ''}
    </div>
  `;
}

function syncAutopilotControls() {
  if (toggleAutopilotBtn) {
    toggleAutopilotBtn.textContent = currentAutopilotState?.enabled ? 'Pause autopilot' : 'Enable autopilot';
  }
}

async function updateAutopilot(payload) {
  if (!toggleAutopilotBtn || !runAutopilotBtn) return;

  toggleAutopilotBtn.disabled = true;
  runAutopilotBtn.disabled = true;
  if (companyAutopilotResult) {
    companyAutopilotResult.innerHTML = '<div class="route-card"><strong>Updating autopilot...</strong><p>Applying background company execution changes.</p></div>';
  }

  try {
    const response = await fetch(`/api/company/${encodeURIComponent(companyId)}/autopilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Failed with status ${response.status}`);
    currentAutopilotState = result.autopilot;
    syncAutopilotControls();
    if (companyAutopilotResult) {
      companyAutopilotResult.innerHTML = renderAutopilotResult(result);
    }
    await loadCompany();
  } catch (error) {
    console.error(error);
    if (companyAutopilotResult) {
      companyAutopilotResult.innerHTML = '<div class="route-card"><strong>Autopilot update failed</strong><p>The background execution layer could not be updated.</p></div>';
    }
  } finally {
    toggleAutopilotBtn.disabled = false;
    runAutopilotBtn.disabled = false;
  }
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
    currentAutopilotState = company.autopilotState || company.executionState?.autopilot || null;
    syncAutopilotControls();
    assetsEl.innerHTML = renderAssets(company.existingAssets);
    soulEl.innerHTML = renderSoul(company.companySoul);
    routingEl.innerHTML = renderRouting(company.routing);
    contactSurfacesEl.innerHTML = renderContactSurfaces(company.contactSurfaces);
    if (activityNowEl) activityNowEl.innerHTML = renderActivityNow(company, events);
    if (alertsEl) alertsEl.innerHTML = renderAlerts(deriveAlerts(company, events, artifacts));
    topologyEl.innerHTML = renderTopology(company.roles);
    rolesEl.innerHTML = renderRoles(company.roles);
    missionsEl.innerHTML = renderMissions(company.missions);
    nextStepsEl.innerHTML = renderNextSteps(company.nextSteps || []);
    if (eventsEl) eventsEl.innerHTML = renderEvents(events);
    if (routingHistoryEl) routingHistoryEl.innerHTML = renderRoutingHistory(events);
    artifactsEl.innerHTML = renderArtifacts(artifacts);
  } catch (error) {
    console.error(error);
    titleEl.textContent = companyId;
    setStatus('Failed to load company data.', 'error');
  }
}

runCompanyCycleBtn?.addEventListener('click', runCompanyCycle);
toggleAutopilotBtn?.addEventListener('click', () => updateAutopilot({ enabled: !currentAutopilotState?.enabled }));
runAutopilotBtn?.addEventListener('click', () => updateAutopilot({ enabled: true, runNow: true }));
companyAskBtn?.addEventListener('click', askCompany);
companyAskInput?.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    askCompany();
  }
});

loadCompany();
