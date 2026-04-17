import { mountSession, requireAuth } from './auth.js';

await requireAuth();
mountSession();

const statusEl = document.getElementById('companiesStatus');
const gridEl = document.getElementById('companiesGrid');
const searchEl = document.getElementById('companiesSearch');
const productOriginEl = document.getElementById('companiesProductOrigin');
const autonomyModeEl = document.getElementById('companiesAutonomyMode');
let allCompanies = [];

function setStatus(message, kind = 'idle') {
  statusEl.textContent = message;
  statusEl.className = `status-banner status-${kind}`;
}

function renderCompanyCard(company) {
  const execution = company.executionState || {};

  return `
    <article class="panel feature-card company-card">
      <div class="eyebrow">${company.companyId}</div>
      <h2>${company.projectName}</h2>
      <p>${company.description}</p>
      <div class="company-meta">
        <span>${company.archetype}</span>
        <span>${company.stage}</span>
        <span>${company.productOrigin || 'Existing product'}</span>
        <span>${company.autonomyMode || 'Operator-assisted'}</span>
        <span>${company.rolesCount} leads</span>
      </div>
      <div class="route-card">
        <small>${execution.status || 'unknown'}</small>
        <strong>${execution.focus || 'Awaiting visible focus'}</strong>
        <p>${execution.summary || 'Execution summary not available yet.'}</p>
      </div>
      <div class="company-footer">
        <small>Generated: ${company.generatedAt}</small>
        <small>Last activity: ${execution.lastActivityAt || 'n/a'}</small>
      </div>
      <div class="cta-row">
        <a class="button-link secondary" href="./company.html?id=${encodeURIComponent(company.companyId)}">Open company</a>
      </div>
    </article>
  `;
}

function applyFilters() {
  const query = (searchEl.value || '').trim().toLowerCase();
  const productOrigin = productOriginEl.value;
  const autonomyMode = autonomyModeEl.value;

  const filtered = allCompanies.filter((company) => {
    const haystack = [company.projectName, company.description, company.companyId]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesQuery = !query || haystack.includes(query);
    const matchesOrigin = !productOrigin || (company.productOrigin || 'Existing product') === productOrigin;
    const matchesAutonomy = !autonomyMode || (company.autonomyMode || 'Operator-assisted') === autonomyMode;
    return matchesQuery && matchesOrigin && matchesAutonomy;
  });

  if (!allCompanies.length) {
    setStatus('No generated companies yet. Use the generator to create the first one.', 'idle');
    gridEl.innerHTML = '';
    return;
  }

  if (!filtered.length) {
    setStatus('No companies matched the current filters.', 'idle');
    gridEl.innerHTML = '';
    return;
  }

  setStatus(`Showing ${filtered.length} of ${allCompanies.length} compan${filtered.length === 1 ? 'y' : 'ies'}.`, 'success');
  gridEl.innerHTML = filtered.map(renderCompanyCard).join('');
}

async function loadCompanies() {
  try {
    const response = await fetch('/api/companies');
    if (!response.ok) throw new Error(`Failed with status ${response.status}`);
    const companies = await response.json();
    allCompanies = companies;
    applyFilters();
  } catch (error) {
    console.error(error);
    setStatus('Failed to load generated companies.', 'error');
  }
}

searchEl.addEventListener('input', applyFilters);
productOriginEl.addEventListener('change', applyFilters);
autonomyModeEl.addEventListener('change', applyFilters);

loadCompanies();
