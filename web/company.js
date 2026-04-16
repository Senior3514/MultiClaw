import { mountSession, requireAuth } from './auth.js';

await requireAuth();
mountSession();

const params = new URLSearchParams(window.location.search);
const companyId = params.get('id');

const titleEl = document.getElementById('companyTitle');
const statusEl = document.getElementById('companyStatus');
const overviewEl = document.getElementById('companyOverview');
const soulEl = document.getElementById('companySoul');
const routingEl = document.getElementById('companyRouting');
const contactSurfacesEl = document.getElementById('companyContactSurfaces');
const topologyEl = document.getElementById('companyTopology');
const rolesEl = document.getElementById('companyRoles');
const missionsEl = document.getElementById('companyMissions');
const nextStepsEl = document.getElementById('companyNextSteps');
const artifactsEl = document.getElementById('companyArtifacts');
const downloadCompanyPackBtn = document.getElementById('downloadCompanyPackBtn');

function setStatus(message, kind = 'idle') {
  statusEl.textContent = message;
  statusEl.className = `status-banner status-${kind}`;
}

function renderRows(rows) {
  return rows.map(([label, value]) => `
    <div class="brand-row">
      <small>${label}</small>
      <strong>${value}</strong>
      <p>Generated company metadata.</p>
    </div>
  `).join('');
}

function renderSoul(soul) {
  return Object.entries(soul || {}).map(([label, value]) => `
    <div class="brand-row">
      <small>${label}</small>
      <strong>${value}</strong>
      <p>Generated company identity and operating style.</p>
    </div>
  `).join('');
}

function renderRouting(profile) {
  return Object.entries(profile).map(([label, value]) => `
    <div class="route-card">
      <small>${label}</small>
      <strong>${value}</strong>
      <p>Current default routing choice for this capability.</p>
    </div>
  `).join('');
}

function renderContactSurfaces(surfaces) {
  return (surfaces || []).map((surface) => `
    <div class="route-card">
      <small>${surface.status}</small>
      <strong>${surface.name}</strong>
      <p>${surface.purpose}</p>
      <small>${surface.substrate}</small>
    </div>
  `).join('');
}

function renderTopology(roles) {
  const labels = roles.slice(0, 4).map((role) => role.title);
  const [top = 'Leadership', right = 'Growth', bottom = 'Operations', left = 'Trust'] = labels;

  return `
    <div class="topology-core">Primary operator</div>
    <div class="topology-node node-top">${top}</div>
    <div class="topology-node node-right">${right}</div>
    <div class="topology-node node-bottom">${bottom}</div>
    <div class="topology-node node-left">${left}</div>
  `;
}

function renderRoles(roles) {
  return roles.map((role) => `
    <div class="role-card">
      <h4>${role.title}</h4>
      <p>${role.scope}</p>
    </div>
  `).join('');
}

function renderMissions(missions) {
  return missions.map((mission, index) => `
    <div class="mission-card">
      <small>Mission ${index + 1}</small>
      <strong>${mission}</strong>
      <p>Immediate operating focus for this generated company.</p>
    </div>
  `).join('');
}

function renderNextSteps(steps) {
  return steps.map((step, index) => `
    <div class="mission-card">
      <small>Step ${index + 1}</small>
      <strong>${step}</strong>
      <p>Recommended next move to activate the company further.</p>
    </div>
  `).join('');
}

function renderArtifacts(artifacts) {
  return artifacts.map((artifact) => `
    <div class="route-card">
      <small>${artifact.size} bytes</small>
      <strong>${artifact.name}</strong>
      <p>Generated artifact saved by the backend for this company.</p>
      <div class="cta-row">
        <a class="button-link secondary" href="/api/company/${encodeURIComponent(companyId)}/artifact/${encodeURIComponent(artifact.name)}">Download</a>
      </div>
    </div>
  `).join('');
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

    const response = await fetch(`/api/company/${encodeURIComponent(companyId)}`);
    if (!response.ok) throw new Error(`Failed with status ${response.status}`);
    const company = await response.json();
    const artifactsResponse = await fetch(`/api/company/${encodeURIComponent(companyId)}/artifacts`);
    const artifacts = artifactsResponse.ok ? await artifactsResponse.json() : [];

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
    soulEl.innerHTML = renderSoul(company.companySoul);
    routingEl.innerHTML = renderRouting(company.routing);
    contactSurfacesEl.innerHTML = renderContactSurfaces(company.contactSurfaces);
    topologyEl.innerHTML = renderTopology(company.roles);
    rolesEl.innerHTML = renderRoles(company.roles);
    missionsEl.innerHTML = renderMissions(company.missions);
    nextStepsEl.innerHTML = renderNextSteps(company.nextSteps || []);
    artifactsEl.innerHTML = renderArtifacts(artifacts);
  } catch (error) {
    console.error(error);
    titleEl.textContent = companyId;
    setStatus('Failed to load company data.', 'error');
  }
}

loadCompany();
