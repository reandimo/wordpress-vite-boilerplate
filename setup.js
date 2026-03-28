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
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  return new Promise(resolve => {
    rl.question(`  ${question}${suffix}: `, answer => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

function promptChoice(rl, question, choices, defaultValue) {
  const choiceStr = choices.join(' / ');
  return new Promise(resolve => {
    const ask = () => {
      rl.question(`  ${question} [${choiceStr}] (${defaultValue}): `, answer => {
        const val = answer.trim().toLowerCase() || defaultValue;
        if (choices.includes(val)) {
          resolve(val);
        } else {
          console.log(`    Please choose: ${choiceStr}`);
          ask();
        }
      });
    };
    ask();
  });
}

function promptYesNo(rl, question, defaultValue = 'n') {
  return new Promise(resolve => {
    rl.question(`  ${question} (y/n) (${defaultValue}): `, answer => {
      const val = (answer.trim().toLowerCase() || defaultValue);
      resolve(val === 'y' || val === 'yes');
    });
  });
}

// ---------------------------------------------------------------------------
// File processing
// ---------------------------------------------------------------------------

const TEXT_EXTENSIONS = new Set([
  '.php', '.js', '.ts', '.scss', '.css', '.json', '.html', '.md',
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
  if (!isTextFile(filePath)) return;
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
  console.log('');
  console.log('  ================================================');
  console.log('  WordPress Vite Boilerplate — Setup');
  console.log('  ================================================');
  console.log('');

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  try {
    // --- Gather info ---
    const themeName = await prompt(rl, 'Theme name', 'My Theme');
    const themeSlug = await prompt(rl, 'Theme slug (kebab-case)', toSlug(themeName));
    const namespace = await prompt(rl, 'PHP namespace (PascalCase)', toPascalCase(themeName));
    const description = await prompt(rl, 'Description', 'WordPress Block Theme');
    const authorName = await prompt(rl, 'Author name', '');
    const authorUrl = await prompt(rl, 'Author URL', '');

    console.log('');
    console.log('  --- Development Mode ---');
    const devMode = await promptChoice(rl, 'Dev mode', ['docker', 'remote-sync', 'both'], 'docker');

    let projectSlug = themeSlug;
    let remoteHost = '';
    let remoteUser = '';
    let remoteThemePath = '';

    if (devMode === 'docker' || devMode === 'both') {
      projectSlug = await prompt(rl, 'Docker project prefix', themeSlug);
    }

    if (devMode === 'remote-sync' || devMode === 'both') {
      remoteHost = await prompt(rl, 'Remote host', '');
      remoteUser = await prompt(rl, 'Remote SSH user', '');
      remoteThemePath = await prompt(rl, 'Remote theme path', `/var/www/html/wp-content/themes/${themeSlug}`);
    }

    console.log('');
    console.log('  --- Optional Features ---');
    const includeWoo = await promptYesNo(rl, 'Include WooCommerce?', 'n');
    const includeACF = await promptYesNo(rl, 'Include ACF Pro blocks?', 'y');

    rl.close();

    console.log('');
    console.log('  Configuring project...');

    // --- Rename theme directory ---
    const oldThemeDir = join(ROOT, 'app', 'web', 'app', 'themes', 'starter-theme');
    const newThemeDir = join(ROOT, 'app', 'web', 'app', 'themes', themeSlug);

    if (existsSync(oldThemeDir) && themeSlug !== 'starter-theme') {
      renameSync(oldThemeDir, newThemeDir);
    }

    const themeDir = existsSync(newThemeDir) ? newThemeDir : oldThemeDir;

    // --- Placeholder replacements ---
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

    // Replace in all files
    walkDir(ROOT, (filePath) => {
      replaceInFile(filePath, replacements);
    });

    // --- Update .gitignore with actual theme slug ---
    const gitignorePath = join(ROOT, '.gitignore');
    if (existsSync(gitignorePath) && themeSlug !== 'starter-theme') {
      let gi = readFileSync(gitignorePath, 'utf8');
      gi = gi.split('starter-theme').join(themeSlug);
      writeFileSync(gitignorePath, gi, 'utf8');
    }

    // --- Dev mode cleanup ---
    if (devMode === 'remote-sync') {
      // Remove Docker files
      removeIfExists(join(ROOT, 'docker-compose.yml'));
      removeIfExists(join(ROOT, 'docker'));
    }

    if (devMode === 'docker') {
      // Remove sync scripts
      removeIfExists(join(ROOT, 'scripts'));
    }

    // --- Update .env.example with remote sync values ---
    if (devMode === 'remote-sync' || devMode === 'both') {
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
    }

    // --- WooCommerce ---
    if (includeWoo) {
      // Add WooCommerce to app/composer.json
      const composerPath = join(ROOT, 'app', 'composer.json');
      if (existsSync(composerPath)) {
        const composer = JSON.parse(readFileSync(composerPath, 'utf8'));
        composer.require['wpackagist-plugin/woocommerce'] = '^10.5';
        writeFileSync(composerPath, JSON.stringify(composer, null, 2) + '\n', 'utf8');
      }
    }

    // --- ACF ---
    if (!includeACF) {
      // Remove example block and ACF directory
      removeIfExists(join(themeDir, 'blocks'));
      removeIfExists(join(themeDir, 'includes', 'ACF'));

      // Clean functions.php — remove acf/init action
      const functionsPath = join(themeDir, 'functions.php');
      if (existsSync(functionsPath)) {
        let fn = readFileSync(functionsPath, 'utf8');
        // Remove the ACF field group loading block
        fn = fn.replace(/\/\*\*\n \* Load ACF field groups[\s\S]*?\}\);\s*$/m, '');
        writeFileSync(functionsPath, fn, 'utf8');
      }

      // Clean ThemeSetup.php — remove ACF block registration
      const setupPath = join(themeDir, 'includes', 'Theme', 'ThemeSetup.php');
      if (existsSync(setupPath)) {
        let setup = readFileSync(setupPath, 'utf8');
        setup = setup.replace(/        add_action\('acf\/init', \$this->register_acf_blocks\(\.\.\.\)\);\n/, '');
        writeFileSync(setupPath, setup, 'utf8');
      }

      // Clean main.scss — remove example-cta import
      const scssPath = join(themeDir, 'resources', 'styles', 'frontend', 'main.scss');
      if (existsSync(scssPath)) {
        let scss = readFileSync(scssPath, 'utf8');
        scss = scss.replace('@use "../sections/example-cta";\n', '');
        writeFileSync(scssPath, scss, 'utf8');
      }
    }

    // --- Move setup.js to backup ---
    const backupDir = join(ROOT, '.setup-backup');
    mkdirSync(backupDir, { recursive: true });
    const setupSrc = join(ROOT, 'setup.js');
    if (existsSync(setupSrc)) {
      renameSync(setupSrc, join(backupDir, 'setup.js'));
    }

    // --- Summary ---
    console.log('');
    console.log('  ================================================');
    console.log('  Setup complete!');
    console.log('  ================================================');
    console.log('');
    console.log(`  Theme:     ${themeName} (${themeSlug})`);
    console.log(`  Namespace: ${namespace}`);
    console.log(`  Dev mode:  ${devMode}`);
    console.log(`  WooCommerce: ${includeWoo ? 'Yes' : 'No'}`);
    console.log(`  ACF Blocks:  ${includeACF ? 'Yes' : 'No'}`);
    console.log('');

    if (devMode === 'docker' || devMode === 'both') {
      console.log('  Next steps (Docker):');
      console.log('    1. cp .env.example .env');
      console.log('    2. cp app/.env.example app/.env  (edit: set DB_HOST=db, generate salts)');
      console.log('    3. cd app && composer install');
      console.log('    4. docker compose up -d');
      console.log(`    5. cd app/web/app/themes/${themeSlug}`);
      console.log('    6. npm install && npm run dev');
      console.log('');
    }

    if (devMode === 'remote-sync' || devMode === 'both') {
      console.log('  Next steps (Remote Sync):');
      console.log('    1. cp .env.example .env  (verify remote settings)');
      console.log('    2. npm run setup:remote  (check dependencies + SSH)');
      console.log('    3. npm run sync          (start watching + syncing)');
      console.log('');
    }

  } catch (err) {
    rl.close();
    console.error('  Setup failed:', err.message);
    process.exit(1);
  }
}

main();
