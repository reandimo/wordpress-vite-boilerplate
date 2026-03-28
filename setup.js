#!/usr/bin/env node

/**
 * WordPress Vite Boilerplate — Interactive Setup
 *
 * Configures theme name, namespace, dev mode, and optional features.
 * Run: node setup.js
 */

import { createInterface } from 'readline';
import { readFileSync, writeFileSync, renameSync, rmSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, extname } from 'path';

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

  // Foreground
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Bright foreground
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Background
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
  bgBrightBlack: '\x1b[100m',
};

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
  '.gitignore', '.htaccess', '.conf',
]);

function isTextFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  const basename = filePath.split(/[\\/]/).pop();
  if (basename === '.env.example' || basename === '.gitignore' || basename === '.editorconfig') return true;
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

    if (devMode === 'remote-sync' || devMode === 'both') {
      console.log('');
      printSection('Remote Server', '🌐');
      remoteHost = await prompt(rl, 'Remote host', '');
      remoteUser = await prompt(rl, 'Remote SSH user', '');
      remoteThemePath = await prompt(rl, 'Remote theme path', `/var/www/html/wp-content/themes/${themeSlug}`);
    }

    // ── Features ────────────────────────────────────────────────
    printSection('Optional Features', '🧩');
    const includeWoo = await promptYesNo(rl, 'Include WooCommerce?', 'n');
    const includeACF = await promptYesNo(rl, 'Include ACF Pro blocks?', 'y');

    rl.close();

    // ── Summary before proceeding ───────────────────────────────
    printSection('Review', '📋');
    console.log('');
    console.log(`  ${c.dim}Theme:${c.reset}        ${c.bold}${c.brightWhite}${themeName}${c.reset} ${c.dim}(${themeSlug})${c.reset}`);
    console.log(`  ${c.dim}Namespace:${c.reset}    ${c.bold}${c.brightCyan}${namespace}\\${c.reset}`);
    console.log(`  ${c.dim}Author:${c.reset}       ${authorName || c.dim + 'not set' + c.reset}`);
    console.log(`  ${c.dim}Dev mode:${c.reset}     ${c.bold}${devMode}${c.reset}`);
    console.log(`  ${c.dim}WooCommerce:${c.reset}  ${includeWoo ? c.green + '✓ Yes' : c.dim + '✗ No'}${c.reset}`);
    console.log(`  ${c.dim}ACF Blocks:${c.reset}   ${includeACF ? c.green + '✓ Yes' : c.dim + '✗ No'}${c.reset}`);
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
    let totalReplacements = 0;

    await animateProgress('Replacing placeholders', 25, 1500);

    walkDir(ROOT, (filePath) => {
      if (replaceInFile(filePath, replacements)) {
        filesChanged++;
      }
    });

    // Count total replacements for display
    for (const val of Object.values(replacements)) {
      if (val) totalReplacements++;
    }
    printSuccess(`Updated ${c.bold}${filesChanged}${c.reset} files with your configuration`);

    // Step 3: Update .gitignore
    const gitignorePath = join(ROOT, '.gitignore');
    if (existsSync(gitignorePath) && themeSlug !== 'starter-theme') {
      let gi = readFileSync(gitignorePath, 'utf8');
      gi = gi.split('starter-theme').join(themeSlug);
      writeFileSync(gitignorePath, gi, 'utf8');
    }

    // Step 4: Dev mode cleanup
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

    // Step 5: Remote sync env
    if (devMode === 'remote-sync' || devMode === 'both') {
      await animateSpinner('Configuring remote sync...', 300);
      const envPath = join(ROOT, '.env.example');
      if (existsSync(envPath)) {
        let env = readFileSync(envPath, 'utf8');
        if (remoteHost) env = env.replace('# REMOTE_HOST=servidor.com', `REMOTE_HOST=${remoteHost}`);
        if (remoteUser) env = env.replace('# REMOTE_USER=usuario', `REMOTE_USER=${remoteUser}`);
        if (remoteThemePath) env = env.replace(`# REMOTE_THEME_PATH=/var/www/html/wp-content/themes/${themeSlug}`, `REMOTE_THEME_PATH=${remoteThemePath}`);
        env = env.replace('# SYNC_EXCLUDE=', 'SYNC_EXCLUDE=');
        env = env.replace('# SYNC_DELETE=', 'SYNC_DELETE=');
        writeFileSync(envPath, env, 'utf8');
      }
      printSuccess('Remote sync configured in .env.example');
    }

    // Step 6: WooCommerce
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

    // Step 7: ACF cleanup
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

    // Step 8: Self-destruct
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
