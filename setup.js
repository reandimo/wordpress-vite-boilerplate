#!/usr/bin/env node

/**
 * WordPress Vite Boilerplate — Interactive Setup
 *
 * Configures theme name, namespace, dev mode, and optional features.
 * Detects OS, checks dependencies, and auto-configures everything.
 * Run: node setup.js
 */

import { createInterface } from 'readline';
import { readFileSync, writeFileSync, renameSync, rmSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, extname } from 'path';
import { execSync } from 'child_process';
import { platform } from 'os';

const ROOT = resolve(import.meta.dirname || process.cwd());

// ---------------------------------------------------------------------------
// ANSI Colors & Styles
// ---------------------------------------------------------------------------

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
};

// ---------------------------------------------------------------------------
// OS Detection
// ---------------------------------------------------------------------------

function detectOS() {
  const p = platform();
  if (p === 'win32') return 'windows';
  if (p === 'darwin') return 'macos';
  return 'linux';
}

const OS = detectOS();

const OS_LABELS = {
  windows: `${c.cyan}Windows${c.reset}`,
  macos: `${c.brightWhite}macOS${c.reset}`,
  linux: `${c.yellow}Linux${c.reset}`,
};

// ---------------------------------------------------------------------------
// Dependency checking
// ---------------------------------------------------------------------------

function commandExists(cmd) {
  try {
    const check = OS === 'windows'
      ? `where ${cmd} 2>nul`
      : `command -v ${cmd} 2>/dev/null`;
    execSync(check, { stdio: 'pipe' });
    return true;
  } catch {
    // On Windows, also check common tool paths not in PATH
    if (OS === 'windows') {
      const winPaths = [
        `C:\\ProgramData\\chocolatey\\bin\\${cmd}.exe`,
        `C:\\ProgramData\\chocolatey\\lib\\${cmd}\\tools\\bin\\${cmd}.exe`,
        join(process.env.USERPROFILE || '', 'scoop', 'shims', `${cmd}.exe`),
        `C:\\Program Files\\Git\\usr\\bin\\${cmd}.exe`,
      ];
      return winPaths.some(p => existsSync(p));
    }
    return false;
  }
}

function getCommandVersion(cmd, flag = '--version') {
  try {
    const out = execSync(`${cmd} ${flag} 2>&1`, { stdio: 'pipe', encoding: 'utf8' });
    // Extract first line, trim, take first meaningful part
    const line = out.trim().split('\n')[0];
    // Try to extract version number
    const match = line.match(/(\d+\.\d+[\.\d]*)/);
    return match ? match[1] : line.slice(0, 40);
  } catch {
    return null;
  }
}

function checkGitBashRsync() {
  if (OS !== 'windows') return false;
  const gitBashPaths = [
    'C:\\Program Files\\Git\\usr\\bin\\rsync.exe',
    'C:\\Program Files (x86)\\Git\\usr\\bin\\rsync.exe',
  ];
  return gitBashPaths.some(p => existsSync(p));
}

function getGitBashPath() {
  const paths = [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
  ];
  return paths.find(p => existsSync(p)) || null;
}

/**
 * @returns {{ name: string, status: 'ok'|'missing'|'warn', version?: string, hint?: string }[]}
 */
function checkDependencies(devMode, syncProtocol = 'ssh') {
  const deps = [];

  // -- Always needed --
  deps.push(checkDep('node', 'node', '-v', null));
  deps.push(checkDep('npm', 'npm', '-v', null));

  // -- Docker mode --
  if (devMode === 'docker' || devMode === 'both') {
    deps.push(checkDep('docker', 'docker', '-v', {
      windows: 'Install Docker Desktop: https://www.docker.com/products/docker-desktop/',
      macos: 'brew install --cask docker',
      linux: 'curl -fsSL https://get.docker.com | sh',
    }));

    // docker compose (v2 plugin)
    const composeExists = (() => {
      try {
        execSync('docker compose version 2>&1', { stdio: 'pipe' });
        return true;
      } catch { return false; }
    })();
    if (composeExists) {
      const ver = getCommandVersion('docker compose', 'version');
      deps.push({ name: 'docker compose', status: 'ok', version: ver });
    } else {
      deps.push({
        name: 'docker compose',
        status: 'missing',
        hint: 'Included with Docker Desktop. Update Docker if missing.',
      });
    }

    deps.push(checkDep('composer', 'composer', '-V', {
      windows: 'Install: https://getcomposer.org/download/ or choco install composer',
      macos: 'brew install composer',
      linux: 'curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer',
    }));
  }

  // -- Remote sync mode --
  if (devMode === 'remote-sync' || devMode === 'both') {

    if (syncProtocol === 'ftp') {
      // FTP mode: lftp
      deps.push(checkDep('lftp', 'lftp', '--version', {
        windows: 'choco install lftp',
        macos: 'brew install lftp',
        linux: 'sudo apt install lftp',
      }));
    } else {
      // SSH mode: rsync + ssh
      if (commandExists('rsync')) {
        deps.push({ name: 'rsync', status: 'ok', version: getCommandVersion('rsync') });
      } else if (OS === 'windows' && checkGitBashRsync()) {
        deps.push({ name: 'rsync', status: 'ok', version: 'via Git Bash' });
      } else {
        deps.push({
          name: 'rsync',
          status: 'missing',
          hint: OS === 'windows'
            ? 'choco install rsync'
            : OS === 'macos'
              ? 'brew install rsync'
              : 'sudo apt install rsync',
        });
      }

      deps.push(checkDep('ssh', 'ssh', '-V', {
        windows: 'Included with Windows 10+. Enable in Settings > Apps > Optional Features.',
        macos: 'Pre-installed on macOS.',
        linux: 'sudo apt install openssh-client',
      }));
    }

    // File watcher (optional, polling fallback on Windows)
    if (OS === 'macos') {
      deps.push(checkDep('fswatch', 'fswatch', '--version', {
        macos: 'brew install fswatch',
      }));
    } else if (OS === 'linux') {
      if (commandExists('inotifywait')) {
        deps.push({ name: 'inotifywait', status: 'ok', version: getCommandVersion('inotifywait') });
      } else {
        deps.push({
          name: 'inotifywait',
          status: 'warn',
          hint: 'sudo apt install inotify-tools  (falls back to polling without it)',
        });
      }
    } else {
      deps.push({ name: 'file watcher', status: 'warn', hint: 'Windows uses polling mode (no extra install needed)' });
    }

    // Tunnel tools (optional)
    const hasCloudflared = commandExists('cloudflared');
    const hasNgrok = commandExists('ngrok');
    if (hasCloudflared || hasNgrok) {
      const tool = hasCloudflared ? 'cloudflared' : 'ngrok';
      deps.push({ name: `tunnel (${tool})`, status: 'ok', version: getCommandVersion(tool) });
    } else {
      deps.push({
        name: 'tunnel (optional)',
        status: 'warn',
        hint: 'Install cloudflared or ngrok for public tunnels. Not required.',
      });
    }
  }

  return deps;
}

function checkDep(name, cmd, versionFlag, installHints) {
  if (commandExists(cmd)) {
    return { name, status: 'ok', version: getCommandVersion(cmd, versionFlag) };
  }
  return {
    name,
    status: 'missing',
    hint: installHints ? (installHints[OS] || Object.values(installHints)[0]) : null,
  };
}

// ---------------------------------------------------------------------------
// Visual helpers
// ---------------------------------------------------------------------------

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const PROGRESS_FILLED = '█';
const PROGRESS_EMPTY = '░';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function clearLine() {
  process.stdout.write('\r\x1b[K');
}

async function animateSpinner(text, duration = 800) {
  const start = Date.now();
  let i = 0;
  while (Date.now() - start < duration) {
    clearLine();
    process.stdout.write(`  ${c.cyan}${SPINNER_FRAMES[i % SPINNER_FRAMES.length]}${c.reset} ${text}`);
    i++;
    await sleep(60);
  }
  clearLine();
}

async function animateProgress(label, steps = 20, duration = 1200) {
  for (let i = 0; i <= steps; i++) {
    clearLine();
    const pct = Math.round((i / steps) * 100);
    const filled = PROGRESS_FILLED.repeat(i);
    const empty = PROGRESS_EMPTY.repeat(steps - i);
    const color = pct < 40 ? c.blue : pct < 75 ? c.cyan : c.green;
    process.stdout.write(`  ${c.dim}${label}${c.reset} ${color}${filled}${c.dim}${empty}${c.reset} ${c.bold}${pct}%${c.reset}`);
    await sleep(duration / steps);
  }
  clearLine();
  process.stdout.write(`  ${c.green}✓${c.reset} ${label}\n`);
}

function printBanner() {
  console.log('');
  console.log(`${c.cyan}${c.bold}  ╔══════════════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.cyan}${c.bold}  ║${c.reset}                                                              ${c.cyan}${c.bold}║${c.reset}`);
  console.log(`${c.cyan}${c.bold}  ║${c.reset}   ${c.brightWhite}${c.bold}██╗    ██╗██████╗     ██╗   ██╗██╗████████╗███████╗${c.reset}     ${c.cyan}${c.bold}║${c.reset}`);
  console.log(`${c.cyan}${c.bold}  ║${c.reset}   ${c.brightWhite}${c.bold}██║    ██║██╔══██╗    ██║   ██║██║╚══██╔══╝██╔════╝${c.reset}     ${c.cyan}${c.bold}║${c.reset}`);
  console.log(`${c.cyan}${c.bold}  ║${c.reset}   ${c.brightCyan}${c.bold}██║ █╗ ██║██████╔╝    ██║   ██║██║   ██║   █████╗${c.reset}       ${c.cyan}${c.bold}║${c.reset}`);
  console.log(`${c.cyan}${c.bold}  ║${c.reset}   ${c.blue}${c.bold}██║███╗██║██╔═══╝     ╚██╗ ██╔╝██║   ██║   ██╔══╝${c.reset}       ${c.cyan}${c.bold}║${c.reset}`);
  console.log(`${c.cyan}${c.bold}  ║${c.reset}   ${c.magenta}${c.bold}╚███╔███╔╝██║          ╚████╔╝ ██║   ██║   ███████╗${c.reset}     ${c.cyan}${c.bold}║${c.reset}`);
  console.log(`${c.cyan}${c.bold}  ║${c.reset}   ${c.magenta}${c.bold} ╚══╝╚══╝ ╚═╝           ╚═══╝  ╚═╝   ╚═╝   ╚══════╝${c.reset}     ${c.cyan}${c.bold}║${c.reset}`);
  console.log(`${c.cyan}${c.bold}  ║${c.reset}                                                              ${c.cyan}${c.bold}║${c.reset}`);
  console.log(`${c.cyan}${c.bold}  ║${c.reset}   ${c.dim}WordPress Bedrock + Docker + Vite Boilerplate${c.reset}               ${c.cyan}${c.bold}║${c.reset}`);
  console.log(`${c.cyan}${c.bold}  ║${c.reset}   ${c.dim}Block Theme (FSE) · ACF Blocks v3 · TypeScript · SCSS${c.reset}       ${c.cyan}${c.bold}║${c.reset}`);
  console.log(`${c.cyan}${c.bold}  ║${c.reset}                                                              ${c.cyan}${c.bold}║${c.reset}`);
  console.log(`${c.cyan}${c.bold}  ╚══════════════════════════════════════════════════════════════╝${c.reset}`);
  console.log('');
}

function printSection(title, icon = '◆') {
  console.log('');
  console.log(`  ${c.cyan}${c.bold}${icon} ${title}${c.reset}`);
  console.log(`  ${c.dim}${'─'.repeat(56)}${c.reset}`);
}

function printSuccess(text) {
  console.log(`  ${c.green}${c.bold}✓${c.reset} ${text}`);
}

function printWarn(text) {
  console.log(`  ${c.yellow}${c.bold}⚠${c.reset} ${text}`);
}

function printFail(text) {
  console.log(`  ${c.red}${c.bold}✗${c.reset} ${text}`);
}

function printInfo(text) {
  console.log(`  ${c.blue}ℹ${c.reset} ${text}`);
}

function printStep(text) {
  console.log(`  ${c.dim}→${c.reset} ${text}`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toPascalCase(name) {
  return name
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function prompt(rl, question, defaultValue = '') {
  const def = defaultValue ? `${c.dim}(${defaultValue})${c.reset}` : '';
  return new Promise(resolve => {
    rl.question(`  ${c.brightWhite}${question}${c.reset} ${def}${c.cyan}${c.bold} › ${c.reset}`, answer => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

function promptChoice(rl, question, choices, defaultValue) {
  const choiceStr = choices.map(ch =>
    ch === defaultValue
      ? `${c.cyan}${c.bold}${c.underline}${ch}${c.reset}`
      : `${c.dim}${ch}${c.reset}`
  ).join(`${c.dim} / ${c.reset}`);

  return new Promise(resolve => {
    const ask = () => {
      rl.question(`  ${c.brightWhite}${question}${c.reset} [${choiceStr}]${c.cyan}${c.bold} › ${c.reset}`, answer => {
        const val = answer.trim().toLowerCase() || defaultValue;
        if (choices.includes(val)) {
          resolve(val);
        } else {
          console.log(`    ${c.yellow}⚠${c.reset} ${c.dim}Choose one: ${choices.join(', ')}${c.reset}`);
          ask();
        }
      });
    };
    ask();
  });
}

function promptYesNo(rl, question, defaultValue = 'n') {
  const yesNo = defaultValue === 'y'
    ? `${c.green}${c.bold}Y${c.reset}${c.dim}/n${c.reset}`
    : `${c.dim}y/${c.reset}${c.red}${c.bold}N${c.reset}`;

  return new Promise(resolve => {
    rl.question(`  ${c.brightWhite}${question}${c.reset} [${yesNo}]${c.cyan}${c.bold} › ${c.reset}`, answer => {
      const val = (answer.trim().toLowerCase() || defaultValue);
      resolve(val === 'y' || val === 'yes');
    });
  });
}

// ---------------------------------------------------------------------------
// File processing
// ---------------------------------------------------------------------------

const TEXT_EXTENSIONS = new Set([
  '.php', '.js', '.ts', '.scss', '.css', '.json', '.html', '.md', '.mdc',
  '.yml', '.yaml', '.xml', '.txt', '.sh', '.env', '.editorconfig',
  '.gitignore', '.htaccess', '.conf', '.npmrc',
]);

function isTextFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  const basename = filePath.split(/[\\/]/).pop();
  if (['.env.example', '.gitignore', '.editorconfig', '.npmrc'].includes(basename)) return true;
  return TEXT_EXTENSIONS.has(ext);
}

function walkDir(dir, callback) {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (entry === 'node_modules' || entry === '.git' || entry === 'vendor' || entry === '.setup-backup') continue;
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

function replaceInFile(filePath, replacements) {
  if (!isTextFile(filePath)) return false;
  let content = readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [search, replace] of Object.entries(replacements)) {
    if (content.includes(search)) {
      content = content.split(search).join(replace);
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(filePath, content, 'utf8');
  }
  return changed;
}

function removeIfExists(path) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  printBanner();

  // ── System Detection ────────────────────────────────────────
  printSection('System Detection', '🔍');
  console.log(`  ${c.dim}OS:${c.reset}   ${OS_LABELS[OS]}`);
  console.log(`  ${c.dim}Node:${c.reset} ${c.brightWhite}${getCommandVersion('node', '-v') || 'unknown'}${c.reset}`);
  console.log(`  ${c.dim}npm:${c.reset}  ${c.brightWhite}${getCommandVersion('npm', '-v') || 'unknown'}${c.reset}`);

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    // ── Theme Info ──────────────────────────────────────────────
    printSection('Theme Configuration', '🎨');

    const themeName = await prompt(rl, 'Theme name', 'My Theme');
    const themeSlug = await prompt(rl, 'Theme slug (kebab-case)', toSlug(themeName));
    const namespace = await prompt(rl, 'PHP namespace (PascalCase)', toPascalCase(themeName));
    const description = await prompt(rl, 'Description', 'WordPress Block Theme');
    const authorName = await prompt(rl, 'Author name', '');
    const authorUrl = await prompt(rl, 'Author URL', '');

    // ── Dev Mode ────────────────────────────────────────────────
    printSection('Development Mode', '⚡');
    console.log(`  ${c.dim}docker       ${c.reset}Local stack (PHP, Nginx, MariaDB, MailHog, phpMyAdmin)`);
    console.log(`  ${c.dim}remote-sync  ${c.reset}Edit local, auto-sync to remote server via rsync/SSH`);
    console.log(`  ${c.dim}both         ${c.reset}Docker local + remote sync scripts`);
    console.log('');

    const devMode = await promptChoice(rl, 'Dev mode', ['docker', 'remote-sync', 'both'], 'docker');

    let projectSlug = themeSlug;
    let remoteHost = '';
    let remoteUser = '';
    let remoteThemePath = '';

    if (devMode === 'docker' || devMode === 'both') {
      projectSlug = await prompt(rl, 'Docker project prefix', themeSlug);
    }

    let syncProtocol = 'ssh';
    let remotePort = '22';
    let remotePassword = '';
    let syncDelete = false;

    if (devMode === 'remote-sync' || devMode === 'both') {
      console.log('');
      printSection('Remote Server', '🌐');
      console.log(`  ${c.dim}ssh  ${c.reset}rsync over SSH (fast, secure, requires SSH access)`);
      console.log(`  ${c.dim}ftp  ${c.reset}lftp mirror (works with any FTP/SFTP hosting)`);
      console.log('');
      syncProtocol = await promptChoice(rl, 'Sync protocol', ['ssh', 'ftp'], 'ssh');
      remoteHost = await prompt(rl, 'Remote host (e.g. myserver.com)', '');
      remoteUser = await prompt(rl, 'Remote user', '');

      if (syncProtocol === 'ftp') {
        remotePassword = await prompt(rl, 'FTP password', '');
        remotePort = await prompt(rl, 'FTP port', '21');
        remoteThemePath = await prompt(rl, 'Remote theme path', `/wp-content/themes/${themeSlug}`);
      } else {
        remotePort = await prompt(rl, 'SSH port', '22');
        remoteThemePath = await prompt(rl, 'Remote theme path', `/var/www/html/wp-content/themes/${themeSlug}`);
      }

      syncDelete = await promptYesNo(rl, 'Delete remote files not present locally?', 'n');
      if (syncDelete) {
        printWarn(`${c.dim}Files deleted locally will also be deleted on the remote server.${c.reset}`);
      }
    }

    // ── Features ────────────────────────────────────────────────
    printSection('Optional Features', '🧩');
    const includeWoo = await promptYesNo(rl, 'Include WooCommerce?', 'n');
    const includeACF = await promptYesNo(rl, 'Include ACF Pro blocks?', 'y');

    rl.close();

    // ── Dependency Check ────────────────────────────────────────
    printSection('Checking Dependencies', '🔧');
    console.log('');

    await animateSpinner('Scanning installed tools...', 600);

    const deps = checkDependencies(devMode, syncProtocol);
    let hasMissing = false;
    let hasWarning = false;

    for (const dep of deps) {
      if (dep.status === 'ok') {
        const ver = dep.version ? ` ${c.dim}(${dep.version})${c.reset}` : '';
        printSuccess(`${dep.name}${ver}`);
      } else if (dep.status === 'warn') {
        printWarn(`${dep.name} ${c.dim}— ${dep.hint}${c.reset}`);
        hasWarning = true;
      } else {
        printFail(`${dep.name} ${c.red}not found${c.reset}`);
        if (dep.hint) {
          console.log(`    ${c.dim}Install: ${c.reset}${c.yellow}${dep.hint}${c.reset}`);
        }
        hasMissing = true;
      }
    }

    if (hasMissing) {
      console.log('');
      printWarn(`Some required tools are missing. The project will be configured,`);
      printWarn(`but you'll need to install them before running.`);
    }

    // ── Summary ─────────────────────────────────────────────────
    printSection('Review', '📋');
    console.log('');
    console.log(`  ${c.dim}Theme:${c.reset}        ${c.bold}${c.brightWhite}${themeName}${c.reset} ${c.dim}(${themeSlug})${c.reset}`);
    console.log(`  ${c.dim}Namespace:${c.reset}    ${c.bold}${c.brightCyan}${namespace}\\${c.reset}`);
    console.log(`  ${c.dim}Author:${c.reset}       ${authorName || c.dim + 'not set' + c.reset}`);
    console.log(`  ${c.dim}Dev mode:${c.reset}     ${c.bold}${devMode}${c.reset}${(devMode !== 'docker') ? ` ${c.dim}(${syncProtocol})${c.reset}` : ''}`);
    console.log(`  ${c.dim}WooCommerce:${c.reset}  ${includeWoo ? c.green + '✓ Yes' : c.dim + '✗ No'}${c.reset}`);
    console.log(`  ${c.dim}ACF Blocks:${c.reset}   ${includeACF ? c.green + '✓ Yes' : c.dim + '✗ No'}${c.reset}`);
    console.log(`  ${c.dim}Platform:${c.reset}     ${OS_LABELS[OS]}`);
    console.log('');

    // ── Execute ─────────────────────────────────────────────────
    printSection('Building your project', '🚀');
    console.log('');

    // Step 1: Rename theme directory
    const oldThemeDir = join(ROOT, 'app', 'web', 'app', 'themes', 'starter-theme');
    const newThemeDir = join(ROOT, 'app', 'web', 'app', 'themes', themeSlug);

    await animateSpinner('Renaming theme directory...', 400);
    if (existsSync(oldThemeDir) && themeSlug !== 'starter-theme') {
      renameSync(oldThemeDir, newThemeDir);
    }
    printSuccess(`Theme directory → ${c.cyan}app/web/app/themes/${themeSlug}/${c.reset}`);

    const themeDir = existsSync(newThemeDir) ? newThemeDir : oldThemeDir;

    // Step 2: Replace placeholders
    const replacements = {
      '__THEME_NAME__': themeName,
      '__THEME_SLUG__': themeSlug,
      '__NAMESPACE__': namespace,
      '__DESCRIPTION__': description,
      '__AUTHOR__': authorName,
      '__AUTHOR_URI__': authorUrl,
      '__THEME_URI__': authorUrl,
      '__PROJECT_SLUG__': projectSlug,
    };

    let filesChanged = 0;

    await animateProgress('Replacing placeholders', 25, 1500);

    walkDir(ROOT, (filePath) => {
      if (replaceInFile(filePath, replacements)) {
        filesChanged++;
      }
    });

    printSuccess(`Updated ${c.bold}${filesChanged}${c.reset} files with your configuration`);

    // Step 3: Update .gitignore
    const gitignorePath = join(ROOT, '.gitignore');
    if (existsSync(gitignorePath) && themeSlug !== 'starter-theme') {
      let gi = readFileSync(gitignorePath, 'utf8');
      gi = gi.split('starter-theme').join(themeSlug);
      writeFileSync(gitignorePath, gi, 'utf8');
    }

    // Step 4: Windows — create .npmrc for Git Bash shell
    if (OS === 'windows') {
      await animateSpinner('Configuring npm for Windows (Git Bash)...', 300);
      const gitBash = getGitBashPath();
      if (gitBash) {
        const npmrcPath = join(ROOT, '.npmrc');
        const escaped = gitBash.replace(/\\/g, '\\\\');
        writeFileSync(npmrcPath, `script-shell=${escaped}\n`, 'utf8');
        printSuccess(`Created .npmrc → scripts use Git Bash`);
      } else {
        printWarn('Git Bash not found. npm scripts using bash may not work in PowerShell.');
        printInfo('Install Git for Windows: https://git-scm.com/download/win');
      }
    }

    // Step 5: Dev mode cleanup
    if (devMode === 'remote-sync') {
      await animateSpinner('Removing Docker files (remote-sync mode)...', 300);
      removeIfExists(join(ROOT, 'docker-compose.yml'));
      removeIfExists(join(ROOT, 'docker'));
      printSuccess('Docker files removed (not needed for remote-sync)');
    }

    if (devMode === 'docker') {
      await animateSpinner('Removing sync scripts (docker mode)...', 300);
      removeIfExists(join(ROOT, 'scripts'));
      printSuccess('Sync scripts removed (not needed for docker mode)');
    }

    // Step 6: Remote sync env
    if (devMode === 'remote-sync' || devMode === 'both') {
      await animateSpinner('Configuring remote sync...', 300);
      const envPath = join(ROOT, '.env.example');
      if (existsSync(envPath)) {
        let env = readFileSync(envPath, 'utf8');
        env = env.replace('# SYNC_PROTOCOL=ssh', `SYNC_PROTOCOL=${syncProtocol}`);
        if (remoteHost) env = env.replace('# REMOTE_HOST=servidor.com', `REMOTE_HOST=${remoteHost}`);
        if (remoteUser) env = env.replace('# REMOTE_USER=usuario', `REMOTE_USER=${remoteUser}`);
        env = env.replace('# REMOTE_PORT=22', `REMOTE_PORT=${remotePort}`);
        if (remoteThemePath) {
          const defaultPath = syncProtocol === 'ftp'
            ? `/wp-content/themes/${themeSlug}`
            : `/var/www/html/wp-content/themes/${themeSlug}`;
          env = env.replace(`# REMOTE_THEME_PATH=${defaultPath}`, `REMOTE_THEME_PATH=${remoteThemePath}`);
          // Fallback if default path didn't match template
          env = env.replace(/# REMOTE_THEME_PATH=.*/, `REMOTE_THEME_PATH=${remoteThemePath}`);
        }
        if (syncProtocol === 'ftp' && remotePassword) {
          env = env.replace('# REMOTE_PASSWORD=', `REMOTE_PASSWORD=${remotePassword}`);
        }
        env = env.replace('# SYNC_EXCLUDE=', 'SYNC_EXCLUDE=');
        env = env.replace('# SYNC_DELETE=false', `SYNC_DELETE=${syncDelete}`);
        writeFileSync(envPath, env, 'utf8');
      }
      printSuccess(`Remote sync configured in .env.example (${syncProtocol})`);
    }

    // Step 7: WooCommerce
    if (includeWoo) {
      await animateSpinner('Adding WooCommerce to dependencies...', 300);
      const composerPath = join(ROOT, 'app', 'composer.json');
      if (existsSync(composerPath)) {
        const composer = JSON.parse(readFileSync(composerPath, 'utf8'));
        composer.require['wpackagist-plugin/woocommerce'] = '^10.5';
        writeFileSync(composerPath, JSON.stringify(composer, null, 2) + '\n', 'utf8');
      }
      printSuccess('WooCommerce added to app/composer.json');
    }

    // Step 8: ACF cleanup
    if (!includeACF) {
      await animateSpinner('Removing ACF block system...', 300);
      removeIfExists(join(themeDir, 'blocks'));
      removeIfExists(join(themeDir, 'includes', 'ACF'));

      const functionsPath = join(themeDir, 'functions.php');
      if (existsSync(functionsPath)) {
        let fn = readFileSync(functionsPath, 'utf8');
        fn = fn.replace(/\/\*\*\n \* Load ACF field groups[\s\S]*?\}\);\s*$/m, '');
        writeFileSync(functionsPath, fn, 'utf8');
      }

      const setupPath = join(themeDir, 'includes', 'Theme', 'ThemeSetup.php');
      if (existsSync(setupPath)) {
        let setup = readFileSync(setupPath, 'utf8');
        setup = setup.replace(/        add_action\('acf\/init', \$this->register_acf_blocks\(\.\.\.\)\);\n/, '');
        writeFileSync(setupPath, setup, 'utf8');
      }

      const scssPath = join(themeDir, 'resources', 'styles', 'frontend', 'main.scss');
      if (existsSync(scssPath)) {
        let scss = readFileSync(scssPath, 'utf8');
        scss = scss.replace('@use "../sections/example-cta";\n', '');
        writeFileSync(scssPath, scss, 'utf8');
      }
      printSuccess('ACF blocks removed (vanilla WordPress blocks only)');
    }

    // Step 9: Self-destruct
    await animateSpinner('Cleaning up setup files...', 300);
    const backupDir = join(ROOT, '.setup-backup');
    mkdirSync(backupDir, { recursive: true });
    const setupSrc = join(ROOT, 'setup.js');
    if (existsSync(setupSrc)) {
      renameSync(setupSrc, join(backupDir, 'setup.js'));
    }
    printSuccess('Setup script moved to .setup-backup/');

    // ── Final output ────────────────────────────────────────────
    console.log('');
    console.log(`${c.green}${c.bold}  ╔══════════════════════════════════════════════════════════════╗${c.reset}`);
    console.log(`${c.green}${c.bold}  ║${c.reset}                                                              ${c.green}${c.bold}║${c.reset}`);
    console.log(`${c.green}${c.bold}  ║${c.reset}   ${c.green}${c.bold}✓  Setup complete!${c.reset}                                       ${c.green}${c.bold}║${c.reset}`);
    console.log(`${c.green}${c.bold}  ║${c.reset}                                                              ${c.green}${c.bold}║${c.reset}`);
    console.log(`${c.green}${c.bold}  ║${c.reset}   ${c.brightWhite}${c.bold}${themeName}${c.reset} is ready to go.                          ${c.green}${c.bold}${'║'.padStart(Math.max(1, 38 - themeName.length))}${c.reset}`);
    console.log(`${c.green}${c.bold}  ║${c.reset}                                                              ${c.green}${c.bold}║${c.reset}`);
    console.log(`${c.green}${c.bold}  ╚══════════════════════════════════════════════════════════════╝${c.reset}`);

    if (devMode === 'docker' || devMode === 'both') {
      console.log('');
      console.log(`  ${c.cyan}${c.bold}Docker quick start:${c.reset}`);
      console.log('');
      printStep(`${c.dim}cp .env.example .env${c.reset}`);
      printStep(`${c.dim}cp app/.env.example app/.env${c.reset}  ${c.brightBlack}# set DB_HOST=db, generate salts${c.reset}`);
      printStep(`${c.dim}cd app && composer install${c.reset}`);
      printStep(`${c.dim}docker compose up -d${c.reset}`);
      printStep(`${c.dim}cd app/web/app/themes/${themeSlug}${c.reset}`);
      printStep(`${c.dim}npm install && npm run dev${c.reset}`);
      console.log('');
      printInfo(`Site: ${c.underline}http://localhost${c.reset}  phpMyAdmin: ${c.underline}http://localhost:8080${c.reset}  Mail: ${c.underline}http://localhost:8025${c.reset}`);
    }

    if (devMode === 'remote-sync' || devMode === 'both') {
      console.log('');
      console.log(`  ${c.magenta}${c.bold}Remote sync quick start:${c.reset}`);
      console.log('');
      printStep(`${c.dim}cp .env.example .env${c.reset}  ${c.brightBlack}# verify remote settings${c.reset}`);
      printStep(`${c.dim}npm run setup:remote${c.reset}  ${c.brightBlack}# check deps + SSH${c.reset}`);
      printStep(`${c.dim}npm run sync${c.reset}          ${c.brightBlack}# start watching + syncing${c.reset}`);
    }

    if (hasMissing) {
      console.log('');
      console.log(`  ${c.yellow}${c.bold}⚠  Missing dependencies detected above.${c.reset}`);
      console.log(`  ${c.dim}Install them before running the project.${c.reset}`);
    }

    console.log('');
    console.log(`  ${c.dim}Happy coding! 🎉${c.reset}`);
    console.log('');

  } catch (err) {
    rl.close();
    console.error(`\n  ${c.red}${c.bold}✗ Setup failed:${c.reset} ${err.message}\n`);
    process.exit(1);
  }
}

main();
