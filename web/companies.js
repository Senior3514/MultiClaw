const statusEl = document.getElementById('companiesStatus');
const gridEl = document.getElementById('companiesGrid');

function setStatus(message, kind = 'idle') {
  statusEl.textContent = message;
  statusEl.className = `status-banner status-${kind}`;
}

function renderCompanyCard(company) {
  return `
    <article class="panel feature-card company-card">
      <div class="eyebrow">${company.companyId}</div>
      <h2>${company.projectName}</h2>
      <p>${company.description}</p>
      <div class="company-meta">
        <span>${company.archetype}</span>
        <span>${company.stage}</span>
        <span>${company.rolesCount} leads</span>
      </div>
      <div class="company-footer">
        <small>Generated: ${company.generatedAt}</small>
      </div>
    </article>
  `;
}

async function loadCompanies() {
  try {
    const response = await fetch('/api/companies');
    if (!response.ok) throw new Error(`Failed with status ${response.status}`);
    const companies = await response.json();

    if (!companies.length) {
      setStatus('No generated companies yet. Use the generator to create the first one.', 'idle');
      gridEl.innerHTML = '';
      return;
    }

    setStatus(`Loaded ${companies.length} generated compan${companies.length === 1 ? 'y' : 'ies'}.`, 'success');
    gridEl.innerHTML = companies.map(renderCompanyCard).join('');
  } catch (error) {
    console.error(error);
    setStatus('Failed to load generated companies.', 'error');
  }
}

loadCompanies();
