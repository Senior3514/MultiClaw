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
const supportsAnsi = Boolean(process.stdout.isTTY);
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function runtimeFileSuffix(bind) {
  return bind === 'local' ? 'local' : 'tailscale';
}

function runtimePidPath(bind) {
  return path.join(repoRoot, 'ops', `multiclaw-web.${runtimeFileSuffix(bind)}.pid`);
}

function runtimeStatePath(bind) {
  return path.join(repoRoot, 'ops', `multiclaw-web.${runtimeFileSuffix(bind)}.state.json`);
}

function processExists(pid) {
  if (!pid) return false;
  const result = spawnSync('kill', ['-0', String(pid)], { encoding: 'utf8' });
  return result.status === 0;
}

function tint(text, ...codes) {
  if (!supportsAnsi) return text;
  return `${codes.join('')}${text}${ANSI.reset}`;
}

function successMark() {
  return tint('[✓]', ANSI.green, ANSI.bold);
}

function warningMark() {
  return tint('[!]', ANSI.yellow, ANSI.bold);
}

function failureMark() {
  return tint('[!]', ANSI.red, ANSI.bold);
}

function printCliHeader(label = 'COMPANY OPERATOR RUNTIME') {
  console.log(tint('╔══════════════════════════════════════════════════════════════════════════╗', ANSI.cyan, ANSI.bold));
  console.log(tint('║  ███╗   ███╗██╗   ██╗██╗  ████████╗██╗ ██████╗██╗      █████╗ ██╗    ██║', ANSI.cyan, ANSI.bold));
  console.log(tint('║  ████╗ ████║██║   ██║██║  ╚══██╔══╝██║██╔════╝██║     ██╔══██╗██║    ██║', ANSI.cyan, ANSI.bold));
  console.log(tint('║  ██╔████╔██║██║   ██║██║     ██║   ██║██║     ██║     ███████║██║ █╗ ██║', ANSI.cyan, ANSI.bold));
  console.log(tint('║  ██║╚██╔╝██║██║   ██║██║     ██║   ██║██║     ██║     ██╔══██║██║███╗██║', ANSI.cyan, ANSI.bold));
  console.log(tint('║  ██║ ╚═╝ ██║╚██████╔╝███████╗██║   ██║╚██████╗███████╗██║  ██║╚███╔███╔╝', ANSI.cyan, ANSI.bold));
  console.log(tint('║  ╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚═╝   ╚═╝ ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ║', ANSI.cyan, ANSI.bold));
  console.log(tint('║          COMPANY · OPERATOR · RUNTIME                                   ║', ANSI.gray));
  console.log(tint('╚══════════════════════════════════════════════════════════════════════════╝', ANSI.cyan, ANSI.bold));
  console.log(tint(` ▸ ${label}`, ANSI.magenta, ANSI.bold));
  console.log('');
}

function renderProgressBar(progress, width = 32) {
  const clamped = Math.max(0, Math.min(1, Number(progress) || 0));
  const filled = Math.round(clamped * width);
  const bar = `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`;
  return `${tint(bar, ANSI.cyan, ANSI.bold)} ${Math.round(clamped * 100)}%`;
}

function printProgressStep(label, progress, detail = '') {
  const bar = renderProgressBar(progress);
  const tail = detail ? tint(detail, ANSI.gray) : '';
  console.log(`  ${bar}  ${tint(label, ANSI.bold)} ${tail}`.trimEnd());
}

function cognitiveLoadFromTelemetry(telemetry) {
  const signal = (telemetry?.events || 0) * 3 + (telemetry?.cycles || 0) * 6 + (telemetry?.companies || 0) * 12 + (telemetry?.artifacts || 0);
  const saturation = Math.min(100, Math.round((signal / 120) * 100));
  const label = saturation >= 75 ? 'saturated' : saturation >= 40 ? 'engaged' : saturation >= 10 ? 'warming' : 'idle';
  return { saturation, label };
}

function printCommandSection(title, lines, color = ANSI.cyan) {
  console.log(tint(`[${title}]`, color, ANSI.bold));
  for (const line of lines) {
    console.log(`  ${line}`);
  }
  console.log('');
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

  const steps = [
    { label: 'Scaffold workspace tree', detail: slug },
    { label: 'Render brief and README', detail: 'brief.json + README.md' },
    { label: 'Compose brand DNA', detail: 'BRAND.md' },
    { label: 'Assemble company + org chart', detail: `${roles.length} roles` },
    { label: 'Lock charter and mission', detail: 'CHARTER.md + MISSION-001.md' },
    { label: 'Project 30-day roadmap', detail: 'ROADMAP-30.md' },
    { label: 'Spawn role files', detail: `${roles.length} leads` },
    { label: 'Seed workspaces and dashboards', detail: 'scaffolds ready' },
  ];

  const emitStep = (index) => printProgressStep(steps[index].label, (index + 1) / steps.length, steps[index].detail);

  printCliHeader('COMPANY ARCHITECTURE · BUILD PIPELINE');

  await mkdirp(outputDir);
  await mkdirp(path.join(outputDir, 'roles'));
  await mkdirp(path.join(outputDir, 'workspaces'));
  await mkdirp(path.join(outputDir, 'dashboards'));
  emitStep(0);

  await writeFile(path.join(outputDir, 'brief.json'), JSON.stringify({ ...data, archetype }, null, 2));
  await writeFile(path.join(outputDir, 'README.md'), renderReadme(data, roles, archetype));
  emitStep(1);

  await writeFile(path.join(outputDir, 'BRAND.md'), renderBrand(data, brand));
  emitStep(2);

  await writeFile(path.join(outputDir, 'COMPANY.md'), renderCompany(data, roles));
  await writeFile(path.join(outputDir, 'ORG-CHART.md'), renderOrgChart(roles));
  emitStep(3);

  await writeFile(path.join(outputDir, 'CHARTER.md'), renderCharterFile(charter));
  await writeFile(path.join(outputDir, 'MISSION-001.md'), renderMissionFile(mission));
  emitStep(4);

  await writeFile(path.join(outputDir, 'ROADMAP-30.md'), renderRoadmapFile(roadmap));
  emitStep(5);

  for (const role of roles) {
    await writeFile(path.join(outputDir, 'roles', `${role.key}.md`), renderRoleFile(role, data));
  }
  emitStep(6);

  await writeFile(path.join(outputDir, 'workspaces', 'README.md'), '# Workspaces\n\nCreate one isolated workspace per generated lead role when activating this company.\n');
  await writeFile(path.join(outputDir, 'dashboards', 'README.md'), '# Dashboards\n\nDashboard stubs live here. Add status, priorities, and team visibility surfaces here.\n');
  emitStep(7);

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
    const suffix = fallback ? ` ${tint(`(${fallback})`, ANSI.gray)}` : '';
    const hintText = hint ? `  ${tint(hint, ANSI.gray)}\n` : '';
    const prompt = `${hintText}${tint('▸', ANSI.cyan, ANSI.bold)} ${label}${suffix}: `;
    const answer = await rl.question(prompt);
    return answer.trim() || fallback;
  };

  const pickOne = async (label, options, fallback) => {
    console.log('');
    console.log(`${tint('▸', ANSI.cyan, ANSI.bold)} ${tint(label, ANSI.bold)}`);
    options.forEach((option, index) => {
      const selected = option === fallback ? tint('●', ANSI.green, ANSI.bold) : tint('○', ANSI.gray);
      console.log(`    ${tint(String(index + 1), ANSI.cyan)}) ${selected} ${option}`);
    });
    const answer = await rl.question(`  ${tint('select', ANSI.gray)} ${tint(`(1-${options.length} or name)`, ANSI.gray)} ${tint(`[${fallback}]`, ANSI.gray)}: `);
    const trimmed = answer.trim();
    if (!trimmed) return fallback;
    const numeric = Number(trimmed);
    if (Number.isInteger(numeric) && numeric >= 1 && numeric <= options.length) return options[numeric - 1];
    const match = options.find((option) => option.toLowerCase() === trimmed.toLowerCase());
    return match || fallback;
  };

  const pickMany = async (label, options, defaults = []) => {
    console.log('');
    console.log(`${tint('▸', ANSI.cyan, ANSI.bold)} ${tint(label, ANSI.bold)} ${tint('(comma-separated numbers, blank = keep defaults)', ANSI.gray)}`);
    options.forEach((option, index) => {
      const selected = defaults.includes(option) ? tint('●', ANSI.green, ANSI.bold) : tint('○', ANSI.gray);
      console.log(`    ${tint(String(index + 1), ANSI.cyan)}) ${selected} ${option}`);
    });
    const answer = await rl.question(`  ${tint('select', ANSI.gray)} ${tint(`[${defaults.map((value) => options.indexOf(value) + 1).filter((n) => n > 0).join(',') || 'none'}]`, ANSI.gray)}: `);
    const trimmed = answer.trim();
    if (!trimmed) return defaults;
    const picks = trimmed.split(/[,\s]+/).map((token) => Number(token)).filter((n) => Number.isInteger(n) && n >= 1 && n <= options.length);
    return [...new Set(picks.map((index) => options[index - 1]))];
  };

  try {
    printCliHeader('INTERACTIVE CONFIGURATION');
    console.log(tint('  Shape the runtime for this machine. Press Enter to keep defaults.', ANSI.gray));

    const bind = await pickOne('1. Access mode', ['tailscale', 'local'], existing.bind);
    const port = Number(await ask(`2. Port`, String(existing.port), 'TCP port exposed by the web runtime')) || existing.port;
    const provider = await pickOne(
      '3. Model provider',
      ['openai', 'anthropic', 'google', 'openrouter', 'groq', 'ollama'],
      existing.provider,
    );
    const model = await ask('4. Default model', existing.model, 'e.g. gpt-5.4, claude-opus-4-7, gemini-2.5-pro');
    const apiKeyEnv = await ask('5. API key env var', existing.apiKeyEnv, 'environment variable name MultiClaw will read');
    const apiKey = await ask('6. API key value', '', 'optional — leave blank to configure later');

    const pluginCatalog = ['web-dashboard', 'cli-operator', 'vector-memory', 'autopilot-loop', 'telegram-bridge'];
    const defaultPlugins = ['web-dashboard', 'cli-operator', 'autopilot-loop'];
    const plugins = await pickMany('7. Activate plugin surfaces', pluginCatalog, defaultPlugins);

    const config = { bind, port, provider, model, apiKeyEnv, plugins };
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
  const plugins = Array.isArray(config.plugins) && config.plugins.length ? config.plugins.join(', ') : 'default set';
  console.log(tint('[CONFIGURATION SAVED]', ANSI.green, ANSI.bold));
  console.log(`  ${successMark()} bind          ${tint(config.bind, ANSI.bold)}`);
  console.log(`  ${successMark()} port          ${tint(String(config.port), ANSI.bold)}`);
  console.log(`  ${successMark()} provider      ${tint(config.provider, ANSI.bold)}`);
  console.log(`  ${successMark()} model         ${tint(config.model, ANSI.bold)}`);
  console.log(`  ${successMark()} api key env   ${tint(config.apiKeyEnv, ANSI.bold)}`);
  console.log(`  ${successMark()} plugins       ${tint(plugins, ANSI.bold)}`);
  console.log(`  ${hasApiKey ? successMark() : warningMark()} runtime env   ${hasApiKey ? tint('saved', ANSI.green) : tint('not saved yet', ANSI.yellow)}`);
  console.log(`  ${tint('•', ANSI.gray)} config file   ${tint(runtimeConfigPath, ANSI.gray)}`);
  console.log('');
  console.log(tint('Strategic recommendation:', ANSI.magenta, ANSI.bold));
  if (hasApiKey) {
    console.log(`  Next: ${tint('multiclaw start', ANSI.cyan, ANSI.bold)} → ${tint('multiclaw verify', ANSI.cyan, ANSI.bold)} to close the loop.`);
  } else {
    console.log(`  Next: ${tint('multiclaw up --provider ' + config.provider + ' --model ' + config.model + ' --api-key <KEY>', ANSI.cyan, ANSI.bold)}`);
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

  const snapshot = await getRuntimeSnapshot();
  if (snapshot.health && snapshot.health.status === 0) {
    console.log('');
    console.log(`Next: open ${snapshot.url} or run 'multiclaw verify'`);
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

async function getWorkspaceTelemetry() {
  const companyEntries = await fs.readdir(generatedLiveRoot, { withFileTypes: true }).catch(() => []);
  const companies = companyEntries.filter((entry) => entry.isDirectory() && entry.name !== '.auth');
  let artifacts = 0;
  let events = 0;
  let cycles = 0;

  for (const company of companies) {
    const companyDir = path.join(generatedLiveRoot, company.name);
    const files = await fs.readdir(companyDir, { withFileTypes: true }).catch(() => []);
    for (const file of files) {
      if (!file.isFile()) continue;
      artifacts += 1;
      if (file.name === 'events.json') {
        const payload = await fs.readFile(path.join(companyDir, file.name), 'utf8').then((raw) => JSON.parse(raw)).catch(() => []);
        events += Array.isArray(payload) ? payload.length : 0;
      }
      if (/^CYCLE-\d+\.md$/i.test(file.name)) {
        cycles += 1;
      }
    }
  }

  const memoryDepth = events >= 8 || cycles >= 3
    ? 'deepening'
    : events >= 1 || cycles >= 1 || companies.length >= 1
      ? 'execution-visible'
      : 'surface-only';

  return {
    companies: companies.length,
    artifacts,
    events,
    cycles,
    memoryDepth,
  };
}

async function getRuntimeSnapshot() {
  const config = await loadRuntimeConfig();
  const bind = config.bind;
  const rawPid = await fs.readFile(runtimePidPath(bind), 'utf8').then((value) => value.trim()).catch(() => null);
  const state = await fs.readFile(runtimeStatePath(bind), 'utf8').then((value) => JSON.parse(value)).catch(() => null);
  const running = processExists(rawPid) ? rawPid : null;
  const staleState = Boolean((rawPid && !running) || (!rawPid && state));
  const host = state?.host || (bind === 'local' ? '127.0.0.1' : (getTailscaleIp() || 'tailscale-unavailable'));
  const port = state?.port || config.port;
  const url = state?.url || `http://${host}:${port}/`;
  const healthUrl = `${url.replace(/\/$/, '')}/api/health`;
  const health = (running || staleState)
    ? spawnSync('curl', ['--silent', '--show-error', '--max-time', '5', healthUrl], { encoding: 'utf8' })
    : null;

  return { config, rawPid, running, bind, host, port, url, health, staleState };
}

async function readCompanyEntries() {
  const companyEntries = await fs.readdir(generatedLiveRoot, { withFileTypes: true }).catch(() => []);
  return companyEntries.filter((entry) => entry.isDirectory() && entry.name !== '.auth');
}

async function printRoster() {
  printCliHeader('COMPANY ROSTER');
  const entries = await readCompanyEntries();
  if (!entries.length) {
    console.log(`${warningMark()} No companies found under ${tint('generated-live/', ANSI.bold)}`);
    console.log('');
    console.log(tint('Strategic recommendation:', ANSI.magenta, ANSI.bold));
    console.log(`  Run ${tint('multiclaw init', ANSI.cyan, ANSI.bold)} to generate the first operating company.`);
    return;
  }

  console.log(tint('[ACTIVE COMPANIES]', ANSI.cyan, ANSI.bold));
  for (const entry of entries) {
    const companyJsonPath = path.join(generatedLiveRoot, entry.name, 'company.json');
    const company = await fs.readFile(companyJsonPath, 'utf8').then((raw) => JSON.parse(raw)).catch(() => null);
    const name = company?.projectName || entry.name;
    const archetype = company?.archetype || 'unknown archetype';
    const roleCount = Array.isArray(company?.roles) ? company.roles.length : 0;
    console.log(`  ${successMark()} ${tint(name, ANSI.bold)} ${tint(`— ${archetype}`, ANSI.gray)}`);
    console.log(`    ${tint('id', ANSI.gray)} ${entry.name}   ${tint('roles', ANSI.gray)} ${roleCount}`);
  }
  console.log('');
  console.log(tint('Strategic recommendation:', ANSI.magenta, ANSI.bold));
  console.log(`  Steer the strongest company with ${tint('multiclaw recall --company <id> "next move"', ANSI.cyan, ANSI.bold)}.`);
}

async function printArtifacts() {
  printCliHeader('ARTIFACT LEDGER');
  const entries = await readCompanyEntries();
  if (!entries.length) {
    console.log(`${warningMark()} No generated companies yet.`);
    return;
  }

  let total = 0;
  for (const entry of entries) {
    const companyDir = path.join(generatedLiveRoot, entry.name);
    const files = await fs.readdir(companyDir, { withFileTypes: true }).catch(() => []);
    const names = files.filter((file) => file.isFile()).map((file) => file.name);
    total += names.length;
    console.log(`${tint('▸', ANSI.cyan, ANSI.bold)} ${tint(entry.name, ANSI.bold)} ${tint(`(${names.length} artifacts)`, ANSI.gray)}`);
    for (const name of names.slice(0, 6)) {
      console.log(`    ${tint('•', ANSI.gray)} ${name}`);
    }
    if (names.length > 6) console.log(`    ${tint(`• … +${names.length - 6} more`, ANSI.gray)}`);
  }
  console.log('');
  console.log(tint(`Total artifacts: ${total}`, ANSI.bold));
}

async function printNetwork() {
  printCliHeader('NETWORK POSTURE');
  const config = await loadRuntimeConfig();
  const tailscaleIp = getTailscaleIp();
  console.log(`  bind          ${tint(config.bind, ANSI.bold)}`);
  console.log(`  port          ${tint(String(config.port), ANSI.bold)}`);
  console.log(`  local host    ${tint('127.0.0.1', ANSI.bold)}`);
  console.log(`  tailscale ip  ${tailscaleIp ? tint(tailscaleIp, ANSI.green) : tint('not detected', ANSI.yellow)}`);
  const snapshot = await getRuntimeSnapshot();
  console.log(`  runtime url   ${tint(snapshot.url, ANSI.bold)}`);
  console.log('');
  console.log(tint('Strategic recommendation:', ANSI.magenta, ANSI.bold));
  if (!tailscaleIp && config.bind === 'tailscale') {
    console.log(`  ${warningMark()} Tailscale not detected. Switch to ${tint('multiclaw configure', ANSI.cyan, ANSI.bold)} and pick ${tint('local', ANSI.bold)}, or bring Tailscale up.`);
  } else {
    console.log(`  Network posture is healthy. Run ${tint('multiclaw verify', ANSI.cyan, ANSI.bold)} to lock it in.`);
  }
}

async function printStatus() {
  const snapshot = await getRuntimeSnapshot();
  const telemetry = await getWorkspaceTelemetry();
  const { config, rawPid, running, bind, port, url, health, staleState } = snapshot;
  const healthy = Boolean(health && health.status === 0);
  const summary = staleState
    ? 'Runtime: stale state detected'
    : !running
      ? 'Runtime: not started'
      : healthy
        ? 'Runtime: ready'
        : 'Runtime: started, health unreachable';
  const recommendation = staleState
    ? 'Clear stale runtime state, then relaunch the command center.'
    : !running
      ? 'Start the runtime, then run multiclaw verify.'
      : healthy && telemetry.companies === 0
        ? 'Generate the first company to activate the command center.'
        : healthy
          ? 'Open the workspace and steer the strongest company.'
          : 'Inspect the runtime log and restore a healthy state before continuing.';

  const cognitive = cognitiveLoadFromTelemetry(telemetry);
  const statusMark = staleState ? warningMark() : healthy ? successMark() : running ? warningMark() : failureMark();

  printCliHeader('OPERATOR STATUS');
  console.log(`${statusMark} ${tint(summary, ANSI.bold)}`);
  console.log('');
  console.log(tint('[RUNTIME]', ANSI.cyan, ANSI.bold));
  console.log(`  bind          ${tint(bind, ANSI.bold)}`);
  console.log(`  port          ${tint(String(port), ANSI.bold)}`);
  console.log(`  pid           ${running ? tint(String(running), ANSI.green) : rawPid ? tint(`${rawPid} (stale)`, ANSI.yellow) : tint('not running', ANSI.gray)}`);
  console.log(`  url           ${tint(url, ANSI.bold)}`);
  console.log(`  health        ${health ? (health.status === 0 ? tint(health.stdout.trim() || 'ok', ANSI.green) : tint('unreachable', ANSI.red)) : tint('runtime not started', ANSI.gray)}`);
  console.log('');
  console.log(tint('[MODEL LAYER]', ANSI.blue, ANSI.bold));
  console.log(`  provider      ${tint(config.provider, ANSI.bold)}`);
  console.log(`  model         ${tint(config.model, ANSI.bold)}`);
  console.log(`  api key env   ${tint(config.apiKeyEnv, ANSI.bold)}`);
  console.log('');
  console.log(tint('[AGI CORE · COGNITIVE TELEMETRY]', ANSI.magenta, ANSI.bold));
  console.log(`  companies     ${tint(String(telemetry.companies), ANSI.bold)}`);
  console.log(`  artifacts     ${tint(String(telemetry.artifacts), ANSI.bold)}`);
  console.log(`  events        ${tint(String(telemetry.events), ANSI.bold)}`);
  console.log(`  cycles        ${tint(String(telemetry.cycles), ANSI.bold)}`);
  console.log(`  memory depth  ${tint(telemetry.memoryDepth, ANSI.bold)}`);
  console.log(`  cognitive load ${renderProgressBar(cognitive.saturation / 100, 24)} ${tint(cognitive.label, ANSI.gray)}`);
  console.log('');
  console.log(tint('Strategic recommendation:', ANSI.magenta, ANSI.bold));
  console.log(`  ${recommendation}`);
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

async function printDoctor() {
  const checks = [
    ['git', ['--version']],
    ['node', ['--version']],
    ['npm', ['--version']],
    ['python3', ['--version']],
    ['curl', ['--version']],
  ];
  const results = [];
  const pushResult = (label, ok, detail) => {
    results.push({ label, ok, detail });
    console.log(`${ok ? successMark() : failureMark()} ${label}: ${detail}`);
  };

  printCliHeader('INFRASTRUCTURE DOCTOR');
  for (const [commandName, args] of checks) {
    const result = spawnSync(commandName, args, { encoding: 'utf8' });
    const ok = result.status === 0;
    const output = (result.stdout || result.stderr || '').trim().split(/\r?\n/)[0] || 'not available';
    pushResult(commandName, ok, output);
  }

  const tailscale = spawnSync('tailscale', ['status'], { encoding: 'utf8' });
  pushResult('tailscale', tailscale.status === 0, tailscale.status === 0 ? 'available' : 'not available or not connected');

  const config = await loadRuntimeConfig();
  pushResult('runtime config', true, `${config.bind}:${config.port}, ${config.provider}/${config.model}`);

  const runtimeEnv = await fs.readFile(runtimeEnvPath, 'utf8').then(() => 'present').catch(() => 'missing');
  pushResult('runtime env', runtimeEnv === 'present', runtimeEnv);

  const requiredPaths = [
    path.join(repoRoot, 'ops', 'start_local.sh'),
    path.join(repoRoot, 'ops', 'start_tailscale_only.sh'),
    path.join(repoRoot, 'ops', 'stop.sh'),
    path.join(repoRoot, 'ops', 'server.py'),
    path.join(repoRoot, 'web', 'index.html'),
  ];

  for (const requiredPath of requiredPaths) {
    const exists = await fs.access(requiredPath).then(() => true).catch(() => false);
    pushResult(`path ${path.relative(repoRoot, requiredPath)}`, exists, exists ? 'ok' : 'missing');
  }

  const generatedRootPath = path.join(repoRoot, 'generated-live');
  const generatedRootExists = await fs.access(generatedRootPath).then(() => true).catch(() => false);
  if (generatedRootExists) {
    const generatedRootWritable = spawnSync('bash', ['-lc', `[ -w '${shellEscapeSingle(generatedRootPath)}' ]`]);
    pushResult('generated-live writable', generatedRootWritable.status === 0, generatedRootWritable.status === 0 ? 'yes' : 'no');
  } else {
    const repoWritable = spawnSync('bash', ['-lc', `[ -w '${shellEscapeSingle(repoRoot)}' ]`]);
    pushResult('generated-live', repoWritable.status === 0, repoWritable.status === 0 ? 'not created yet, repo writable' : 'not created yet, repo not writable');
  }

  const snapshot = await getRuntimeSnapshot();
  if (snapshot.staleState) {
    pushResult('runtime state', false, 'stale files detected');
  }
  if (snapshot.health) {
    pushResult('runtime health', snapshot.health.status === 0, snapshot.health.status === 0 ? snapshot.health.stdout.trim() || 'reachable' : 'unreachable');
  } else {
    pushResult('runtime health', false, 'runtime not started');
  }

  const passed = results.filter((item) => item.ok).length;
  const score = Math.round((passed / results.length) * 100);
  const verdict = score >= 90 ? 'SYSTEM READY' : score >= 70 ? 'SYSTEM STABILIZING' : 'SYSTEM NOT READY';
  console.log('');
  console.log(tint(`${verdict}: ${score}%`, score >= 90 ? ANSI.green : score >= 70 ? ANSI.yellow : ANSI.red, ANSI.bold));
  console.log(tint('Strategic recommendation:', ANSI.magenta, ANSI.bold));
  console.log(`  ${snapshot.health && snapshot.health.status === 0 ? 'Run multiclaw verify, then steer the workspace from the dashboard.' : 'Restore a healthy runtime and close missing prerequisites before deeper work.'}`);
}

function printHelp() {
  printCliHeader('HIGH-DENSITY COMMAND MAP');
  printCommandSection('OPERATOR CONTROL', [
    `${tint('multiclaw start', ANSI.bold)}                    launch the command center with saved config`,
    `${tint('multiclaw stop', ANSI.bold)}                     shut the runtime down cleanly`,
    `${tint('multiclaw status', ANSI.bold)}                   live runtime, model, and cognitive telemetry`,
    `${tint('multiclaw up', ANSI.bold)} [--tailscale|--local] [--provider <p>] [--model <m>] [--api-key <K>]`,
  ], ANSI.green);
  printCommandSection('COMPANY ARCHITECTURE', [
    `${tint('multiclaw init', ANSI.bold)}                     generate a full operating company from a brief`,
    `${tint('multiclaw roster', ANSI.bold)}                   show live company roster and archetype summary`,
    `${tint('multiclaw artifacts', ANSI.bold)}                inspect generated artifacts across all companies`,
  ], ANSI.cyan);
  printCommandSection('AGI CORE / MEMORY', [
    `${tint('multiclaw ingest', ANSI.bold)} ${tint('(alias of init)', ANSI.gray)}  import a brief and seed vector memory`,
    `${tint('multiclaw recall', ANSI.bold)} [--company <id>] "question"  recall via the company operator`,
    `${tint('multiclaw evolve', ANSI.bold)} ${tint('(alias of verify)', ANSI.gray)}   sweep memory health and run a smoke cycle`,
  ], ANSI.magenta);
  printCommandSection('INFRASTRUCTURE', [
    `${tint('multiclaw doctor', ANSI.bold)}                   readiness score + prerequisite audit`,
    `${tint('multiclaw verify', ANSI.bold)}                   doctor + status + end-to-end smoke`,
    `${tint('multiclaw network', ANSI.bold)}                  network posture (bind, host, reachability)`,
  ], ANSI.yellow);
  printCommandSection('SETUP AND GUIDANCE', [
    `${tint('multiclaw configure', ANSI.bold)}                interactive configure with multi-select`,
    `${tint('multiclaw guide', ANSI.bold)}                    minimum-viable install and start`,
    `${tint('multiclaw walkthrough', ANSI.bold)}              fuller walkthrough for new operators`,
  ], ANSI.blue);
  console.log(tint('Notes', ANSI.bold));
  console.log(`  ${tint('•', ANSI.gray)} start uses the saved config and prints the URL`);
  console.log(`  ${tint('•', ANSI.gray)} up saves config and starts in one command`);
  console.log(`  ${tint('•', ANSI.gray)} verify runs doctor, status, and smoke when the runtime is up`);
  console.log('');
  console.log(tint('Strategic recommendation:', ANSI.magenta, ANSI.bold));
  console.log(`  Run ${tint('multiclaw configure', ANSI.cyan, ANSI.bold)}, then ${tint('multiclaw up --api-key <KEY>', ANSI.cyan, ANSI.bold)}, then ${tint('multiclaw verify', ANSI.cyan, ANSI.bold)}.`);
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

  if (command === 'ask' || command === 'recall') {
    await askCompanyCli();
    return;
  }

  if (command === 'roster') {
    await printRoster();
    return;
  }

  if (command === 'artifacts') {
    await printArtifacts();
    return;
  }

  if (command === 'network') {
    await printNetwork();
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

  if (command === 'verify' || command === 'evolve') {
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

  if (command !== 'init' && command !== 'ingest') {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const data = await collectInput();
  const result = await generateProject(data);

  console.log('');
  console.log(tint('[COMPANY SYNTHESIZED]', ANSI.green, ANSI.bold));
  console.log(`  ${successMark()} project       ${tint(data.projectName, ANSI.bold)}`);
  console.log(`  ${successMark()} archetype     ${tint(result.archetype, ANSI.bold)}`);
  console.log(`  ${successMark()} roles         ${tint(String(result.roles.length), ANSI.bold)}  ${tint(`(${result.roles.map((role) => role.title).join(', ')})`, ANSI.gray)}`);
  console.log(`  ${successMark()} artifacts at  ${tint(result.outputDir, ANSI.bold)}`);
  console.log('');
  console.log(tint('Strategic recommendation:', ANSI.magenta, ANSI.bold));
  console.log(`  Review the charter and mission, then run ${tint('multiclaw up --api-key <KEY>', ANSI.cyan, ANSI.bold)} to activate the first claw.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
