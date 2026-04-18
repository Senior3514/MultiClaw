#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const command = argv[0] || 'help';
const isDemo = argv.includes('--demo');
const cwd = process.cwd();
const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const runtimeDir = path.join(cwd, '.multiclaw');
const runtimeConfigPath = path.join(runtimeDir, 'config.json');
const runtimeEnvPath = path.join(runtimeDir, 'runtime.env');
const generatedLiveRoot = path.join(repoRoot, 'generated-live');

const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const ANSI = useColor
  ? {
      reset: '\x1b[0m',
      bold: '\x1b[1m',
      dim: '\x1b[2m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      cyan: '\x1b[36m',
      gray: '\x1b[90m',
    }
  : { reset: '', bold: '', dim: '', red: '', green: '', yellow: '', cyan: '', gray: '' };

const MARK_OK = `${ANSI.green}[✓]${ANSI.reset}`;
const MARK_FAIL = `${ANSI.red}[!]${ANSI.reset}`;
const MARK_WARN = `${ANSI.yellow}[~]${ANSI.reset}`;
const MARK_INFO = `${ANSI.cyan}[·]${ANSI.reset}`;

function paintBanner() {
  const l = `${ANSI.cyan}${ANSI.bold}`;
  const r = ANSI.reset;
  const d = ANSI.dim;
  console.log(`${l}  ╔══════════════════════════════════════════════════════╗${r}`);
  console.log(`${l}  ║  MULTICLAW · AI COMPANY RUNTIME                      ║${r}`);
  console.log(`${l}  ║${r}  ${d}Operator command · Company architecture layer${r}      ${l}║${r}`);
  console.log(`${l}  ╚══════════════════════════════════════════════════════╝${r}`);
}

function sectionHeader(title) {
  return `${ANSI.bold}${ANSI.cyan}${title}${ANSI.reset}`;
}

function nextLine(text) {
  return `${ANSI.bold}${ANSI.yellow}Next:${ANSI.reset} ${text}`;
}


function runtimeFileSuffix(bind) {
  return bind === 'local' ? 'local' : 'tailscale';
}

function runtimePidPath(bind) {
  return path.join(repoRoot, 'ops', `multiclaw-web.${runtimeFileSuffix(bind)}.pid`);
}

function runtimeStatePath(bind) {
  return path.join(repoRoot, 'ops', `multiclaw-web.${runtimeFileSuffix(bind)}.state.json`);
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'multiclaw-project';
}

function inferArchetype({ businessModel, description }) {
  const text = `${businessModel} ${description}`.toLowerCase();
  if (text.includes('marketplace')) return 'marketplace';
  if (text.includes('ecommerce') || text.includes('e-commerce') || text.includes('shop')) return 'e-commerce';
  if (text.includes('content') || text.includes('media') || text.includes('newsletter')) return 'content/media';
  if (text.includes('lead') || text.includes('agency')) return 'lead-generation';
  if (text.includes('internal') || text.includes('ops') || text.includes('operations') || text.includes('vps')) return 'internal-ops';
  return 'saas-product';
}

function buildRoles(archetype) {
  const base = [
    { key: 'operator', title: 'Operator', scope: 'Runs the whole company rhythm, priorities, coordination, and delivery.' },
    { key: 'cto', title: 'CTO / Systems Lead', scope: 'Owns architecture, tooling, runtime choices, and technical integrity.' },
    { key: 'product', title: 'Product Lead', scope: 'Turns goals into roadmap, specs, and product decisions.' },
    { key: 'growth', title: 'Growth Lead', scope: 'Owns acquisition, activation, messaging, and conversion loops.' },
    { key: 'qa', title: 'QA / Reliability Lead', scope: 'Owns quality, testing, stability, and release confidence.' },
  ];

  const optional = {
    'marketplace': [
      { key: 'supply', title: 'Supply Operations Lead', scope: 'Owns marketplace-side inventory, onboarding, and quality.' },
      { key: 'demand', title: 'Demand Operations Lead', scope: 'Owns buyer-side growth, matching, and funnel performance.' },
    ],
    'e-commerce': [
      { key: 'catalog', title: 'Catalog Operations Lead', scope: 'Owns product catalog quality, pricing presentation, and merchandising flow.' },
      { key: 'retention', title: 'Retention Lead', scope: 'Owns repeat purchase, lifecycle messaging, and LTV growth.' },
    ],
    'content/media': [
      { key: 'content', title: 'Content Lead', scope: 'Owns publishing cadence, asset quality, and editorial execution.' },
      { key: 'audience', title: 'Audience Lead', scope: 'Owns reach, engagement, and community growth.' },
    ],
    'lead-generation': [
      { key: 'salesops', title: 'Sales Ops Lead', scope: 'Owns intake, qualification, routing, and booked meetings.' },
      { key: 'retention', title: 'Follow-up Lead', scope: 'Owns lead recovery, reminders, and close support.' },
    ],
    'internal-ops': [
      { key: 'automation', title: 'Automation Lead', scope: 'Owns process automation, runbooks, and efficiency systems.' },
      { key: 'support', title: 'Support Lead', scope: 'Owns internal adoption, request handling, and operational feedback.' },
    ],
    'saas-product': [
      { key: 'support', title: 'Support Lead', scope: 'Owns user issues, support patterns, and feedback loops.' },
      { key: 'research', title: 'Research Lead', scope: 'Owns market research, user insight, and strategic discovery.' },
    ],
  };

  return [...base, ...(optional[archetype] || [])];
}

function buildMission(data) {
  return [
    `1. Turn ${data.projectName} into a coherent operating company, not just a product.`,
    `2. Focus the first week on the top goals: ${data.topGoals}.`,
    '3. Create one visible delivery loop every day.',
    '4. Keep reporting compact, high-signal, and tied to outcomes.',
    '5. Protect speed without sacrificing structure or trust.',
  ];
}

function buildRoadmap(data, roles) {
  return {
    week1: [
      'Finalize brand, positioning, and project structure.',
      'Stand up the first working operating company files.',
      'Define ownership and output format for every lead role.',
      'Launch first internal coordination surface.',
    ],
    week2: [
      'Build or tighten the first product-critical workflow.',
      'Add monitoring, QA checkpoints, and recovery paths.',
      'Start metrics tracking around the primary business loop.',
    ],
    week3: [
      'Refine growth, onboarding, and activation surfaces.',
      'Remove friction, duplication, and weak ownership.',
      `Deepen role specialization across ${roles.length} core leads.`,
    ],
    week4: [
      'Package the operating model into reusable templates.',
      'Document what should become productized or automated next.',
      'Prepare the next 30-day plan based on live learning.',
    ],
  };
}

function buildBrand(data) {
  return {
    oneLiner: `${data.projectName} is ${data.description}`,
    promise: `MultiClaw gives ${data.projectName} a full AI company behind the scenes.`,
    traits: ['sharp', 'operational', 'clear', 'coordinated', 'trustworthy'],
  };
}

function buildCharter(data) {
  return [
    'Act, then report when safe.',
    'Keep coordination tight and outputs compact.',
    'Protect user trust, data boundaries, and project isolation.',
    'Prefer useful execution over ornamental complexity.',
    `Optimize for the current stage: ${data.stage}.`,
  ];
}

async function mkdirp(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeFile(filePath, content) {
  await mkdirp(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
}

function renderReadme(data, roles, archetype) {
  return `# ${data.projectName}\n\nGenerated by MultiClaw.\n\n## Overview\n\n${data.projectName} is ${data.description}.\n\n- Target audience: ${data.audience}\n- Business model: ${data.businessModel}\n- Stage: ${data.stage}\n- Archetype: ${archetype}\n- Channels: ${data.channels}\n- Tone: ${data.tone}\n\n## Top goals\n\n${data.topGoals.split(',').map((goal) => `- ${goal.trim()}`).join('\n')}\n\n## Generated company\n\nThis company was generated to operate ${data.projectName} with a focused AI leadership structure and clear ownership.\n\n## Core roles\n\n${roles.map((role) => `- **${role.title}**: ${role.scope}`).join('\n')}\n`;
}

function renderBrand(data, brand) {
  return `# Brand\n\n## Project\n${data.projectName}\n\n## One-line description\n${brand.oneLiner}\n\n## Promise\n${brand.promise}\n\n## Voice\n${data.tone}\n\n## Traits\n${brand.traits.map((trait) => `- ${trait}`).join('\n')}\n`;
}

function renderCompany(data, roles) {
  return `# Company\n\n## Mission\nBuild and operate ${data.projectName} as a coordinated AI company that pushes the product forward every day.\n\n## Leadership\n- Operator\n- CTO / Systems Lead\n\n## Departments\n${roles.map((role) => `- ${role.title}`).join('\n')}\n\n## Risk sensitivity\n${data.riskSensitivity}\n`;
}

function renderOrgChart(roles) {
  const leadership = roles.slice(0, 2);
  const rest = roles.slice(2);
  return `# Org Chart\n\n## Leadership\n${leadership.map((role) => `- ${role.title}`).join('\n')}\n\n## Core leads\n${rest.map((role) => `- ${role.title}`).join('\n')}\n`;
}

function renderCharterFile(items) {
  return `# Charter\n\n${items.map((item, index) => `${index + 1}. ${item}`).join('\n')}\n`;
}

function renderMissionFile(items) {
  return `# Mission 001\n\n${items.map((item) => `- ${item}`).join('\n')}\n`;
}

function renderRoadmapFile(roadmap) {
  return `# 30-Day Roadmap\n\n## Week 1\n${roadmap.week1.map((item) => `- ${item}`).join('\n')}\n\n## Week 2\n${roadmap.week2.map((item) => `- ${item}`).join('\n')}\n\n## Week 3\n${roadmap.week3.map((item) => `- ${item}`).join('\n')}\n\n## Week 4\n${roadmap.week4.map((item) => `- ${item}`).join('\n')}\n`;
}

function renderRoleFile(role, data) {
  return `# ${role.title}\n\n## Scope\n${role.scope}\n\n## Current project\n${data.projectName}\n\n## Operating rule\nKeep output compact, useful, and tied to outcomes.\n`;
}

function getArgValue(name, fallback = null) {
  const exact = argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = argv.indexOf(name);
  if (index >= 0 && argv[index + 1]) return argv[index + 1];
  return fallback;
}

function defaultRuntimeConfig() {
  return {
    bind: 'tailscale',
    port: 8813,
    provider: 'openai',
    model: 'gpt-5.4',
    apiKeyEnv: 'OPENAI_API_KEY',
  };
}

async function loadRuntimeConfig() {
  try {
    const raw = await fs.readFile(runtimeConfigPath, 'utf8');
    return { ...defaultRuntimeConfig(), ...JSON.parse(raw) };
  } catch {
    return defaultRuntimeConfig();
  }
}

async function saveRuntimeConfig(config) {
  await mkdirp(runtimeDir);
  await fs.writeFile(runtimeConfigPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

function shellEscapeSingle(value) {
  return String(value).replace(/'/g, `'"'"'`);
}

async function saveRuntimeEnv(name, value) {
  await mkdirp(runtimeDir);
  const content = `${name}='${shellEscapeSingle(value)}'\n`;
  await fs.writeFile(runtimeEnvPath, content, 'utf8');
}

async function collectInput() {
  if (isDemo) {
    return {
      projectName: 'PulseBoard',
      description: 'a premium AI operating layer for high-ticket service businesses',
      audience: 'high-ticket service businesses',
      businessModel: 'SaaS with optional services',
      stage: 'MVP',
      topGoals: 'ship MVP, prove value, close first users',
      tone: 'sharp, premium, operational',
      techStack: 'TypeScript, Node.js, MultiClaw runtime, web dashboard',
      channels: 'web, Telegram, email',
      riskSensitivity: 'high',
    };
  }

  const rl = readline.createInterface({ input, output });
  const ask = async (label, fallback) => {
    const answer = await rl.question(`${label}${fallback ? ` [${fallback}]` : ''}: `);
    return answer.trim() || fallback;
  };

  try {
    return {
      projectName: await ask('Project name', 'My Project'),
      description: await ask('One-line description', 'an ambitious AI product'),
      audience: await ask('Target audience', 'builders'),
      businessModel: await ask('Business model', 'SaaS'),
      stage: await ask('Current stage', 'MVP'),
      topGoals: await ask('Top 3 goals (comma-separated)', 'ship, validate, grow'),
      tone: await ask('Preferred tone / culture', 'sharp, clean, operational'),
      techStack: await ask('Tech stack', 'TypeScript, Node.js'),
      channels: await ask('Channels in use', 'web'),
      riskSensitivity: await ask('Risk sensitivity', 'medium'),
    };
  } finally {
    rl.close();
  }
}

async function generateProject(data) {
  const archetype = inferArchetype(data);
  const roles = buildRoles(archetype);
  const brand = buildBrand(data);
  const charter = buildCharter(data);
  const mission = buildMission(data);
  const roadmap = buildRoadmap(data, roles);
  const slug = slugify(data.projectName);
  const outputDir = path.join(cwd, 'generated', slug);

  await mkdirp(outputDir);
  await mkdirp(path.join(outputDir, 'roles'));
  await mkdirp(path.join(outputDir, 'workspaces'));
  await mkdirp(path.join(outputDir, 'dashboards'));

  await writeFile(path.join(outputDir, 'brief.json'), JSON.stringify({ ...data, archetype }, null, 2));
  await writeFile(path.join(outputDir, 'README.md'), renderReadme(data, roles, archetype));
  await writeFile(path.join(outputDir, 'BRAND.md'), renderBrand(data, brand));
  await writeFile(path.join(outputDir, 'COMPANY.md'), renderCompany(data, roles));
  await writeFile(path.join(outputDir, 'ORG-CHART.md'), renderOrgChart(roles));
  await writeFile(path.join(outputDir, 'CHARTER.md'), renderCharterFile(charter));
  await writeFile(path.join(outputDir, 'MISSION-001.md'), renderMissionFile(mission));
  await writeFile(path.join(outputDir, 'ROADMAP-30.md'), renderRoadmapFile(roadmap));

  for (const role of roles) {
    await writeFile(path.join(outputDir, 'roles', `${role.key}.md`), renderRoleFile(role, data));
  }

  await writeFile(path.join(outputDir, 'workspaces', 'README.md'), '# Workspaces\n\nCreate one isolated workspace per generated lead role when activating this company.\n');
  await writeFile(path.join(outputDir, 'dashboards', 'README.md'), '# Dashboards\n\nDashboard stubs live here. Add status, priorities, and team visibility surfaces here.\n');

  return { outputDir, archetype, roles };
}

async function setupRuntime() {
  const existing = await loadRuntimeConfig();
  const modeFlag = argv.includes('--local') ? 'local' : argv.includes('--tailscale') ? 'tailscale' : null;
  const portFlag = Number(getArgValue('--port', existing.port)) || existing.port;
  const providerFlag = getArgValue('--provider', existing.provider);
  const modelFlag = getArgValue('--model', existing.model);
  const apiKeyEnvFlag = getArgValue('--api-key-env', existing.apiKeyEnv);
  const apiKeyValue = getArgValue('--api-key');
  const hasInlineConfig = modeFlag || argv.includes('--provider') || argv.some((arg) => arg.startsWith('--provider=')) || argv.includes('--model') || argv.some((arg) => arg.startsWith('--model=')) || argv.includes('--api-key-env') || argv.some((arg) => arg.startsWith('--api-key-env=')) || argv.includes('--api-key') || argv.some((arg) => arg.startsWith('--api-key='));

  if (hasInlineConfig) {
    const config = {
      bind: modeFlag || existing.bind,
      port: portFlag,
      provider: providerFlag,
      model: modelFlag,
      apiKeyEnv: apiKeyEnvFlag,
    };
    await saveRuntimeConfig(config);
    if (apiKeyValue) {
      await saveRuntimeEnv(config.apiKeyEnv, apiKeyValue);
    }
    printConfigSummary(config, Boolean(apiKeyValue));
    return;
  }

  const rl = readline.createInterface({ input, output });
  const ask = async (label, fallback, hint = '') => {
    const suffix = fallback ? ` [${fallback}]` : '';
    const prompt = hint ? `${label}${suffix} - ${hint}: ` : `${label}${suffix}: `;
    const answer = await rl.question(prompt);
    return answer.trim() || fallback;
  };

  try {
    console.log('MultiClaw configure');
    console.log('Choose the cleanest runtime path for this machine. Press Enter to keep defaults.');
    console.log('');
    const bindAnswer = (await ask('1. Access mode', existing.bind, 'tailscale or local')).toLowerCase();
    const bind = bindAnswer === 'local' ? 'local' : 'tailscale';
    const port = Number(await ask('2. Port', String(existing.port), 'default web port')) || existing.port;
    const provider = await ask('3. Provider', existing.provider, 'openai, anthropic, google, openrouter, groq, ollama');
    const model = await ask('4. Model', existing.model, 'for example gpt-5.4');
    const apiKeyEnv = await ask('5. API key env var', existing.apiKeyEnv, 'env name to save/read');
    const apiKey = await ask('6. API key value', '', 'optional, press Enter to skip for now');
    const config = { bind, port, provider, model, apiKeyEnv };
    await saveRuntimeConfig(config);
    if (apiKey) {
      await saveRuntimeEnv(config.apiKeyEnv, apiKey);
    }
    console.log('');
    printConfigSummary(config, Boolean(apiKey));
  } finally {
    rl.close();
  }
}

function runScript(scriptName, args = []) {
  const result = spawnSync('bash', [path.join(repoRoot, 'ops', scriptName), ...args], {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exitCode = result.status || 1;
  }
}

function getTailscaleIp() {
  const result = spawnSync('tailscale', ['ip', '-4'], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || null;
}

function printConfigSummary(config, hasApiKey) {
  console.log('MultiClaw configure');
  console.log(`- bind: ${config.bind}`);
  console.log(`- port: ${config.port}`);
  console.log(`- provider: ${config.provider}`);
  console.log(`- model: ${config.model}`);
  console.log(`- api key env: ${config.apiKeyEnv}`);
  console.log(`- config: ${runtimeConfigPath}`);
  console.log(`- runtime env: ${hasApiKey ? 'saved' : 'not saved yet'}`);
  console.log('');
  console.log('Next:');
  if (hasApiKey) {
    console.log('  1. multiclaw start');
    console.log('  2. multiclaw verify');
    console.log('  3. multiclaw stop');
  } else {
    console.log('  1. multiclaw start');
    console.log('  2. Open the URL it prints');
    console.log('  3. If you want AI immediately: multiclaw up --provider openai --model gpt-5.4 --api-key YOUR_KEY');
  }
}

async function startRuntime(forceBind = null) {
  const config = await loadRuntimeConfig();
  const bind = forceBind || config.bind;
  const port = String(Number(getArgValue('--port', config.port)) || config.port);

  if (bind === 'local') {
    runScript('start_local.sh', [port]);
  } else {
    runScript('start_tailscale_only.sh', [port]);
  }

  if (process.exitCode) return;

  const snapshot = await getRuntimeSnapshot(bind);
  if (snapshot.health && snapshot.health.status === 0) {
    const memory = await computeMemoryDepth();
    console.log('');
    console.log(`  ${MARK_OK} runtime online   ${ANSI.dim}${snapshot.url}${ANSI.reset}`);
    console.log(`  ${MARK_INFO} memory depth    ${ANSI.dim}${memory.companies} compan${memory.companies === 1 ? 'y' : 'ies'} · ${memory.artifacts} artifacts${ANSI.reset}`);
    console.log('');
    if (memory.companies === 0) {
      console.log(nextLine(`open ${ANSI.bold}${snapshot.url}${ANSI.reset} or run ${ANSI.bold}multiclaw init${ANSI.reset} to generate the first company`));
    } else {
      console.log(nextLine(`open ${ANSI.bold}${snapshot.url}${ANSI.reset} or run ${ANSI.bold}multiclaw verify${ANSI.reset}`));
    }
  }
}

async function upRuntime() {
  const existing = await loadRuntimeConfig();
  const modeFlag = argv.includes('--local') ? 'local' : argv.includes('--tailscale') ? 'tailscale' : null;
  const portFlag = Number(getArgValue('--port', existing.port)) || existing.port;
  const providerFlag = getArgValue('--provider', existing.provider);
  const modelFlag = getArgValue('--model', existing.model);
  const apiKeyEnvFlag = getArgValue('--api-key-env', existing.apiKeyEnv);
  const apiKeyValue = getArgValue('--api-key');

  const config = {
    bind: modeFlag || existing.bind,
    port: portFlag,
    provider: providerFlag,
    model: modelFlag,
    apiKeyEnv: apiKeyEnvFlag,
  };

  await saveRuntimeConfig(config);
  if (apiKeyValue) {
    await saveRuntimeEnv(config.apiKeyEnv, apiKeyValue);
  }
  await startRuntime(config.bind);
}

async function detectActiveBind(fallbackBind) {
  for (const candidate of ['local', 'tailscale']) {
    const pid = await fs.readFile(runtimePidPath(candidate), 'utf8').then((value) => value.trim()).catch(() => null);
    if (!pid) continue;
    try {
      process.kill(Number(pid), 0);
      return candidate;
    } catch {
      // stale pid file
    }
  }
  return fallbackBind;
}

async function getRuntimeSnapshot(forceBind = null) {
  const config = await loadRuntimeConfig();
  const bind = forceBind || await detectActiveBind(config.bind);
  const running = await fs.readFile(runtimePidPath(bind), 'utf8').then((value) => value.trim()).catch(() => null);
  const state = await fs.readFile(runtimeStatePath(bind), 'utf8').then((value) => JSON.parse(value)).catch(() => null);
  const host = state?.host || (bind === 'local' ? '127.0.0.1' : (getTailscaleIp() || 'tailscale-unavailable'));
  const port = state?.port || config.port;
  const url = state?.url || `http://${host}:${port}/`;
  const healthUrl = `${url.replace(/\/$/, '')}/api/health`;
  const health = running
    ? spawnSync('curl', ['--silent', '--show-error', '--max-time', '5', healthUrl], { encoding: 'utf8' })
    : null;

  return { config, running, bind, host, port, url, health };
}

async function printStatus() {
  const snapshot = await getRuntimeSnapshot();
  const { config, running, bind, port, url, health } = snapshot;
  const healthy = Boolean(health && health.status === 0);
  const runtimeMark = !running ? MARK_WARN : healthy ? MARK_OK : MARK_FAIL;
  const runtimeLabel = !running
    ? 'not started'
    : healthy
      ? 'ready'
      : 'started, health unreachable';
  const cognitiveLoad = !running ? 'idle' : healthy ? 'active (0 in-flight)' : 'stalled';
  const memory = await computeMemoryDepth();

  paintBanner();
  console.log('');
  console.log(sectionHeader('RUNTIME STATE'));
  console.log(`  ${runtimeMark} ${'runtime'.padEnd(12)} ${ANSI.dim}${runtimeLabel}${ANSI.reset}`);
  console.log(`  ${MARK_INFO} ${'bind'.padEnd(12)} ${ANSI.dim}${bind}:${port}${ANSI.reset}`);
  console.log(`  ${MARK_INFO} ${'provider'.padEnd(12)} ${ANSI.dim}${config.provider} / ${config.model}${ANSI.reset}`);
  console.log(`  ${MARK_INFO} ${'api key env'.padEnd(12)} ${ANSI.dim}${config.apiKeyEnv}${ANSI.reset}`);
  console.log(`  ${MARK_INFO} ${'pid'.padEnd(12)} ${ANSI.dim}${running || 'not running'}${ANSI.reset}`);
  console.log(`  ${MARK_INFO} ${'url'.padEnd(12)} ${ANSI.dim}${url}${ANSI.reset}`);
  console.log('');
  console.log(sectionHeader('COMPANY TELEMETRY'));
  console.log(`  ${MARK_INFO} ${'memory depth'.padEnd(14)} ${ANSI.dim}${memory.companies} compan${memory.companies === 1 ? 'y' : 'ies'} · ${memory.artifacts} artifacts${ANSI.reset}`);
  console.log(`  ${MARK_INFO} ${'cognitive load'.padEnd(14)} ${ANSI.dim}${cognitiveLoad}${ANSI.reset}`);

  console.log('');
  if (!running) {
    console.log(nextLine(`run ${ANSI.bold}multiclaw start${ANSI.reset}`));
  } else if (healthy) {
    if (memory.companies === 0) {
      console.log(nextLine(`open ${ANSI.bold}${url}${ANSI.reset} or run ${ANSI.bold}multiclaw init${ANSI.reset} to generate the first company`));
    } else {
      console.log(nextLine(`open ${ANSI.bold}${url}${ANSI.reset} or run ${ANSI.bold}multiclaw verify${ANSI.reset}`));
    }
  } else {
    console.log(nextLine(`check ops/multiclaw-web.${runtimeFileSuffix(bind)}.log`));
  }
}

async function verifyRuntime() {
  await printDoctor();
  console.log('');
  await printStatus();
  console.log('');

  const snapshot = await getRuntimeSnapshot();
  if (!snapshot.running) {
    console.log('MultiClaw verify');
    console.log('- smoke: skipped (runtime not started)');
    return;
  }

  console.log('MultiClaw verify');
  const smoke = spawnSync('bash', [path.join(repoRoot, 'scripts', 'e2e-smoke.sh'), snapshot.url.replace(/\/$/, '')], {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  if (smoke.status !== 0) {
    process.exitCode = smoke.status || 1;
  }
}

function buildLocalCompanyReply(company, prompt) {
  const normalizedPrompt = String(prompt || '').trim();
  const promptLower = normalizedPrompt.toLowerCase();
  const roles = company.roles || [];
  const missions = company.missions || [];
  const nextSteps = company.nextSteps || [];
  const operator = roles[0]?.title || 'Primary Operator';

  let reply = `${company.projectName || 'This company'} is active and ready for operator direction.`;
  let suggestedActions = nextSteps.slice(0, 3);

  if (promptLower.includes('next') || promptLower.includes('priority') || promptLower.includes('fix')) {
    reply = 'Here is the strongest near-term operating focus.';
    suggestedActions = nextSteps.slice(0, 3);
  } else if (promptLower.includes('mission') || promptLower.includes('goal') || promptLower.includes('plan')) {
    reply = 'These are the mission-level directions currently shaping the company.';
    suggestedActions = missions.slice(0, 3);
  } else if (promptLower.includes('company') || promptLower.includes('operate') || promptLower.includes('work')) {
    reply = 'This company is structured to operate through clear ownership, mission focus, and next-step execution.';
    suggestedActions = [...nextSteps.slice(0, 2), ...missions.slice(0, 1)];
  }

  return { speaker: operator, reply, suggestedActions };
}

async function askCompanyCli() {
  const companyId = getArgValue('--company');
  const prompt = argv.slice(1).filter((arg, index, list) => {
    const previous = list[index - 1];
    return !arg.startsWith('--') && previous !== '--company';
  }).join(' ').trim();

  if (!prompt) {
    console.error('Usage: multiclaw ask [--company <companyId>] "your question"');
    process.exitCode = 1;
    return;
  }

  const companyDirs = await fs.readdir(generatedLiveRoot, { withFileTypes: true }).catch(() => []);
  const candidates = companyDirs.filter((entry) => entry.isDirectory() && entry.name !== '.auth');
  if (!candidates.length) {
    console.error('No generated companies found under generated-live/.');
    process.exitCode = 1;
    return;
  }

  let selectedCompanyId = companyId;
  if (!selectedCompanyId) {
    const dated = await Promise.all(candidates.map(async (entry) => ({
      companyId: entry.name,
      mtime: (await fs.stat(path.join(generatedLiveRoot, entry.name))).mtimeMs,
    })));
    dated.sort((a, b) => b.mtime - a.mtime);
    selectedCompanyId = dated[0]?.companyId;
  }

  const companyPath = path.join(generatedLiveRoot, selectedCompanyId, 'company.json');
  const company = await fs.readFile(companyPath, 'utf8').then((raw) => JSON.parse(raw)).catch(() => null);
  if (!company) {
    console.error(`Company not found: ${selectedCompanyId}`);
    process.exitCode = 1;
    return;
  }

  const result = buildLocalCompanyReply(company, prompt);
  console.log(`${result.speaker}`);
  console.log(result.reply);
  for (const action of result.suggestedActions || []) {
    console.log(`- ${action}`);
  }
}

function printGuide() {
  console.log(`MultiClaw guide

Most people should do this:

1. Install
   cd ~ && curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/bootstrap.sh | bash

2. Start
   multiclaw start

3. Verify
   multiclaw verify

4. Stop when done
   multiclaw stop
`);
}

function printWalkthrough() {
  console.log(`MultiClaw walkthrough

Base install:
  cd ~ && curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/bootstrap.sh | bash

Then:
  multiclaw start
  multiclaw verify
  multiclaw stop

If you want to save the API key and start in one command:
  multiclaw up --provider openai --model gpt-5.4 --api-key YOUR_KEY

Uninstall:
  cd ~ && curl -fsSL https://raw.githubusercontent.com/Senior3514/MultiClaw/main/scripts/uninstall.sh | bash
`);
}

async function computeMemoryDepth() {
  const entries = await fs.readdir(generatedLiveRoot, { withFileTypes: true }).catch(() => []);
  let companies = 0;
  let artifacts = 0;
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    companies += 1;
    const files = await fs.readdir(path.join(generatedLiveRoot, entry.name), { withFileTypes: true }).catch(() => []);
    artifacts += files.filter((f) => f.isFile()).length;
  }
  return { companies, artifacts };
}

async function printDoctor() {
  paintBanner();
  console.log('');
  console.log(sectionHeader('READINESS REPORT'));

  const binaries = [
    ['git', ['--version']],
    ['node', ['--version']],
    ['npm', ['--version']],
    ['python3', ['--version']],
    ['curl', ['--version']],
  ];

  let passed = 0;
  let total = 0;

  for (const [commandName, args] of binaries) {
    const result = spawnSync(commandName, args, { encoding: 'utf8' });
    const ok = result.status === 0;
    const versionLine = (result.stdout || result.stderr || '').trim().split(/\r?\n/)[0] || 'not available';
    total += 1;
    if (ok) passed += 1;
    const mark = ok ? MARK_OK : MARK_FAIL;
    console.log(`  ${mark} ${commandName.padEnd(10)} ${ANSI.dim}${versionLine}${ANSI.reset}`);
  }

  const tailscale = spawnSync('tailscale', ['status'], { encoding: 'utf8' });
  const tailscaleOk = tailscale.status === 0;
  console.log(`  ${tailscaleOk ? MARK_OK : MARK_WARN} ${'tailscale'.padEnd(10)} ${ANSI.dim}${tailscaleOk ? 'connected' : 'optional, not connected'}${ANSI.reset}`);

  const requiredPaths = [
    path.join(repoRoot, 'ops', 'start_local.sh'),
    path.join(repoRoot, 'ops', 'start_tailscale_only.sh'),
    path.join(repoRoot, 'ops', 'stop.sh'),
    path.join(repoRoot, 'ops', 'server.py'),
    path.join(repoRoot, 'web', 'index.html'),
  ];

  for (const requiredPath of requiredPaths) {
    const exists = await fs.access(requiredPath).then(() => true).catch(() => false);
    total += 1;
    if (exists) passed += 1;
    const mark = exists ? MARK_OK : MARK_FAIL;
    console.log(`  ${mark} ${'path'.padEnd(10)} ${ANSI.dim}${path.relative(repoRoot, requiredPath)}${ANSI.reset}`);
  }

  const generatedRootPath = path.join(repoRoot, 'generated-live');
  const generatedRootExists = await fs.access(generatedRootPath).then(() => true).catch(() => false);
  let writable;
  if (generatedRootExists) {
    writable = spawnSync('bash', ['-lc', `[ -w '${shellEscapeSingle(generatedRootPath)}' ]`]).status === 0;
  } else {
    writable = spawnSync('bash', ['-lc', `[ -w '${shellEscapeSingle(repoRoot)}' ]`]).status === 0;
  }
  total += 1;
  if (writable) passed += 1;
  console.log(`  ${writable ? MARK_OK : MARK_FAIL} ${'writable'.padEnd(10)} ${ANSI.dim}${generatedRootExists ? 'generated-live' : 'repo (generated-live pending)'}${ANSI.reset}`);

  const config = await loadRuntimeConfig();
  const runtimeEnvPresent = await fs.access(runtimeEnvPath).then(() => true).catch(() => false);
  console.log(`  ${MARK_INFO} ${'config'.padEnd(10)} ${ANSI.dim}${config.bind}:${config.port} · ${config.provider}/${config.model}${ANSI.reset}`);
  console.log(`  ${runtimeEnvPresent ? MARK_OK : MARK_WARN} ${'api key'.padEnd(10)} ${ANSI.dim}${runtimeEnvPresent ? 'runtime.env present' : 'not saved yet (optional)'}${ANSI.reset}`);

  const state = await fs.readFile(runtimeStatePath(config.bind), 'utf8').then((value) => JSON.parse(value)).catch(() => null);
  let runtimeHealthy = false;
  if (state?.url) {
    const health = spawnSync('curl', ['--silent', '--show-error', '--max-time', '5', `${state.url.replace(/\/$/, '')}/api/health`], { encoding: 'utf8' });
    runtimeHealthy = health.status === 0;
    const mark = runtimeHealthy ? MARK_OK : MARK_WARN;
    console.log(`  ${mark} ${'runtime'.padEnd(10)} ${ANSI.dim}${runtimeHealthy ? `healthy at ${state.url}` : 'started but health unreachable'}${ANSI.reset}`);
  } else {
    console.log(`  ${MARK_INFO} ${'runtime'.padEnd(10)} ${ANSI.dim}not started${ANSI.reset}`);
  }

  const score = Math.round((passed / total) * 100);
  const band = score === 100 ? 'READY' : score >= 80 ? 'MOSTLY READY' : 'NEEDS SETUP';
  const color = score === 100 ? ANSI.green : score >= 80 ? ANSI.yellow : ANSI.red;
  console.log('');
  console.log(`  ${ANSI.bold}${color}SYSTEM ${band}: ${score}% (${passed}/${total})${ANSI.reset}`);

  const memory = await computeMemoryDepth();
  console.log(`  ${ANSI.dim}Memory depth: ${memory.companies} compan${memory.companies === 1 ? 'y' : 'ies'} · ${memory.artifacts} artifacts${ANSI.reset}`);

  console.log('');
  if (score < 100) {
    console.log(nextLine(`resolve the ${MARK_FAIL} items above, then rerun ${ANSI.bold}multiclaw doctor${ANSI.reset}`));
  } else if (!state?.url) {
    console.log(nextLine(`run ${ANSI.bold}multiclaw start${ANSI.reset} to bring the runtime online`));
  } else if (!runtimeHealthy) {
    console.log(nextLine(`check ops/multiclaw-web logs and rerun ${ANSI.bold}multiclaw doctor${ANSI.reset}`));
  } else {
    console.log(nextLine(`run ${ANSI.bold}multiclaw verify${ANSI.reset} for the end-to-end smoke`));
  }
}

function printHelp() {
  paintBanner();
  console.log('');
  console.log(sectionHeader('OPERATOR CONTROL'));
  console.log(`  ${ANSI.bold}start${ANSI.reset}        Start the runtime using the saved bind mode`);
  console.log(`  ${ANSI.bold}dev${ANSI.reset}          Start on 127.0.0.1 for local work`);
  console.log(`  ${ANSI.bold}stop${ANSI.reset}         Stop the runtime cleanly`);
  console.log(`  ${ANSI.bold}status${ANSI.reset}       Runtime readiness, bind, and memory depth`);
  console.log(`  ${ANSI.bold}up${ANSI.reset}           Save config and start in one command`);
  console.log('');
  console.log(sectionHeader('COMPANY ARCHITECTURE'));
  console.log(`  ${ANSI.bold}init${ANSI.reset}         Generate a company package under ./generated/`);
  console.log(`  ${ANSI.bold}ask${ANSI.reset}          Talk to the latest generated company`);
  console.log(`  ${ANSI.bold}configure${ANSI.reset}    Guided runtime setup (bind, port, provider, model)`);
  console.log('');
  console.log(sectionHeader('INFRASTRUCTURE'));
  console.log(`  ${ANSI.bold}doctor${ANSI.reset}       Environment readiness with score`);
  console.log(`  ${ANSI.bold}verify${ANSI.reset}       Doctor + status + end-to-end smoke`);
  console.log(`  ${ANSI.bold}guide${ANSI.reset}        Short step-by-step setup`);
  console.log(`  ${ANSI.bold}walkthrough${ANSI.reset}  Full command walkthrough`);
  console.log('');
  console.log(sectionHeader('FLAGS'));
  console.log(`  ${ANSI.dim}--tailscale | --local     bind mode${ANSI.reset}`);
  console.log(`  ${ANSI.dim}--port <port>             runtime port (default 8813)${ANSI.reset}`);
  console.log(`  ${ANSI.dim}--provider <name>         openai | anthropic | openrouter | groq | ollama${ANSI.reset}`);
  console.log(`  ${ANSI.dim}--model <name>            model id${ANSI.reset}`);
  console.log(`  ${ANSI.dim}--api-key-env <name>      env var name to persist${ANSI.reset}`);
  console.log(`  ${ANSI.dim}--api-key <value>         api key value to save${ANSI.reset}`);
  console.log('');
  console.log(nextLine(`run ${ANSI.bold}multiclaw doctor${ANSI.reset} to see system readiness`));
}

async function main() {
  if (command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'guide') {
    printGuide();
    return;
  }

  if (command === 'ask') {
    await askCompanyCli();
    return;
  }

  if (command === 'walkthrough') {
    printWalkthrough();
    return;
  }

  if (command === 'doctor') {
    await printDoctor();
    return;
  }

  if (command === 'verify') {
    await verifyRuntime();
    return;
  }

  if (command === 'configure' || command === 'setup') {
    await setupRuntime();
    return;
  }

  if (command === 'up') {
    await upRuntime();
    return;
  }

  if (command === 'start') {
    await startRuntime();
    return;
  }

  if (command === 'dev') {
    await startRuntime('local');
    return;
  }

  if (command === 'stop') {
    runScript('stop.sh');
    return;
  }

  if (command === 'status') {
    await printStatus();
    return;
  }

  if (command !== 'init') {
    printHelp();
    process.exitCode = 1;
    return;
  }

  paintBanner();
  console.log('');
  console.log(sectionHeader('COMPANY BIRTH'));
  const data = await collectInput();
  const result = await generateProject(data);
  const relPath = path.relative(cwd, result.outputDir) || result.outputDir;

  console.log('');
  console.log(`  ${MARK_OK} project        ${ANSI.dim}${data.projectName}${ANSI.reset}`);
  console.log(`  ${MARK_OK} archetype      ${ANSI.dim}${result.archetype}${ANSI.reset}`);
  console.log(`  ${MARK_OK} roster         ${ANSI.dim}${result.roles.length} lead roles${ANSI.reset}`);
  console.log(`  ${MARK_OK} artifacts      ${ANSI.dim}README · BRAND · COMPANY · ORG-CHART · CHARTER · MISSION · ROADMAP${ANSI.reset}`);
  console.log(`  ${MARK_OK} output         ${ANSI.dim}${relPath}${ANSI.reset}`);
  console.log('');
  console.log(nextLine(`start the runtime with ${ANSI.bold}multiclaw start${ANSI.reset} and open the dashboard`));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
