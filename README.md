# WordPress Vite Boilerplate

**WordPress Bedrock + Docker + Vite** boilerplate with interactive setup, Block Theme (FSE), ACF Blocks v3, TypeScript, SCSS, and optional remote sync.

## Requirements

- [Node.js](http://nodejs.org/) >= 18
- [Git](https://git-scm.com/) (includes Git Bash on Windows)

Additional tools are checked automatically by the setup script based on your chosen dev mode.

## Quick Start

```sh
# 1. Clone the repo
git clone https://github.com/your-user/wordpress-vite-boilerplate.git my-project
cd my-project

# 2. Run the interactive setup
node setup.js

# 3. Follow the on-screen instructions
```

The setup script will:
- Detect your OS (Windows, macOS, Linux) and configure accordingly
- Ask for theme name, namespace, dev mode, and optional features
- Check all required dependencies and show install instructions for missing ones
- Replace all placeholders, rename directories, and configure `.env` files
- On Windows: auto-create `.npmrc` so bash scripts work from PowerShell

## Dev Modes

### Docker (local development)

Full local stack: PHP 8.2-fpm, Nginx, MariaDB 11, MailHog, phpMyAdmin.

**Requirements:** Docker, Docker Compose, Composer

```sh
cp .env.example .env
cp app/.env.example app/.env    # Edit: set DB_HOST=db, generate salts
cd app && composer install && cd ..
docker compose up -d
cd app/web/app/themes/<your-theme>
npm install && npm run dev
```

| URL | Service |
|-----|---------|
| http://localhost | WordPress |
| http://localhost:8080 | phpMyAdmin |
| http://localhost:8025 | MailHog |

### Remote Sync (like Shopify theme dev)

Edit locally, auto-sync to a remote server via rsync/SSH.

**Requirements:** rsync, SSH

```sh
# Configure .env with REMOTE_USER, REMOTE_HOST, REMOTE_THEME_PATH
npm run setup:remote    # Verify dependencies and SSH connection
npm run sync            # Watch + auto-sync
npm run sync:push       # Manual push
npm run sync:pull       # Manual pull
npm run tunnel          # Expose remote site via tunnel
```

#### Windows Notes

On Windows, bash scripts run through Git Bash (configured automatically via `.npmrc`). Tools installed via Chocolatey or Scoop are detected automatically by the shared `scripts/_env.sh` which extends the PATH.

```powershell
# Install rsync on Windows (PowerShell as Admin)
choco install rsync
```

## Project Structure

```
project/
├── setup.js                     # Interactive setup (run once)
├── docker-compose.yml           # Docker services
├── docker/
│   ├── nginx/default.conf       # Nginx config
│   └── php/Dockerfile           # PHP 8.2-fpm-alpine
├── scripts/                     # Remote sync scripts
│   ├── _env.sh                  # Shared env loader (PATH fix for Windows)
│   ├── sync-watch.sh            # Watch + auto-sync
│   ├── sync-push.sh             # Manual push to remote
│   ├── sync-pull.sh             # Manual pull from remote
│   ├── tunnel.sh                # Public tunnel (cloudflared/ngrok)
│   └── setup-remote.sh          # Verify deps + SSH connection
├── app/                         # Bedrock root
│   ├── composer.json
│   ├── config/
│   └── web/app/themes/<theme>/  # Block Theme (FSE)
├── .cursor/rules/               # Cursor IDE coding standards
├── .editorconfig
├── .npmrc                       # Auto-created on Windows (Git Bash shell)
└── package.json                 # Root scripts (sync, tunnel, setup)
```

## Theme Structure

```
app/web/app/themes/<theme>/
├── blocks/                  # ACF Blocks v3 (block.json + render.php)
│   └── example-cta/         # Example block for reference
├── includes/                # PHP classes (PSR-4)
│   ├── ACF/                 # ACF field groups
│   ├── Helpers/             # ViteHelper.php
│   └── Theme/               # ThemeSetup.php
├── parts/                   # Template parts (header.html, footer.html)
├── templates/               # Block templates (FSE)
├── resources/
│   ├── fonts/               # Custom fonts (copied to public/ by Vite)
│   ├── scripts/             # TypeScript (entry: frontend/main.ts)
│   └── styles/              # SCSS (entry: frontend/main.scss)
│       └── base/            # _variables.scss, _media-queries.scss
├── public/                  # Vite build output (gitignored)
├── theme.json               # Design tokens
├── vite.config.js           # Vite 5 build config
└── functions.php            # Theme bootstrap + PSR-4 autoloader
```

## Creating a New ACF Block

1. Create `blocks/my-block/block.json` + `blocks/my-block/render.php`
2. Create field group in `includes/ACF/MyBlock.php`
3. Add `'MyBlock'` to the `$acf_files` array in `functions.php`
4. Add `'my-block'` to the `$blocks` array in `ThemeSetup.php`
5. Create styles in `resources/styles/sections/_my-block.scss`
6. Import in `resources/styles/frontend/main.scss`

See `blocks/example-cta/` for a complete example.

## Asset Compilation

From the theme directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server with HMR (localhost:5173) |
| `npm run build` | Build assets once |
| `npm run production` | Optimized production build |

### How HMR Works

1. `npm run dev` starts Vite on `localhost:5173` and creates `public/hot`
2. `ViteHelper.php` detects the hot file and loads assets from the dev server
3. CSS changes appear instantly without page reload
4. `host.docker.internal` lets Docker's PHP reach Vite on the host

## Dependencies by Mode

| Tool | Docker | Remote Sync | Both |
|------|--------|-------------|------|
| Node.js >= 18 | required | required | required |
| Docker + Compose | required | - | required |
| Composer | required | - | required |
| rsync | - | required | required |
| SSH | - | required | required |
| fswatch (macOS) | - | recommended | recommended |
| inotify-tools (Linux) | - | recommended | recommended |
| cloudflared / ngrok | - | optional | optional |

The setup script checks all of these and shows install commands for your OS.

## Production Deployment

```sh
cd app/web/app/themes/<your-theme>
npm run production

cd app
composer install --no-dev --optimize-autoloader
```
