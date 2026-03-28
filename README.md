# WordPress Vite Boilerplate

**WordPress Bedrock + Docker + Vite** boilerplate with interactive setup, Block Theme (FSE), ACF Blocks v3, TypeScript, SCSS, and optional remote sync.

## Requirements

- [Node.js](http://nodejs.org/) >= 18
- [Docker](https://www.docker.com/) & Docker Compose (for local dev)
- [Composer](https://getcomposer.org/download/) (or use it inside the container)

## Quick Start

```sh
# 1. Clone the repo
git clone https://github.com/your-user/wordpress-vite-boilerplate.git my-project
cd my-project

# 2. Run the interactive setup
node setup.js

# 3. Follow the on-screen instructions
```

The setup script will ask for your theme name, namespace, dev mode (Docker / Remote Sync / Both), and optional features (WooCommerce, ACF). It then configures everything automatically.

## Dev Modes

### Docker (local development)

Full local stack: PHP 8.2-fpm, Nginx, MariaDB 11, MailHog, phpMyAdmin.

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

```sh
# Configure .env with REMOTE_USER, REMOTE_HOST, REMOTE_THEME_PATH
npm run setup:remote    # Verify dependencies and SSH connection
npm run sync            # Watch + auto-sync
npm run sync:push       # Manual push
npm run sync:pull       # Manual pull
npm run tunnel          # Expose remote site via tunnel
```

## Project Structure

```
project/
├── docker-compose.yml           # Docker services
├── docker/
│   ├── nginx/default.conf       # Nginx config
│   └── php/Dockerfile           # PHP 8.2-fpm-alpine
├── scripts/                     # Remote sync scripts
│   ├── sync-watch.sh
│   ├── sync-push.sh
│   ├── sync-pull.sh
│   ├── tunnel.sh
│   └── setup-remote.sh
├── app/                         # Bedrock root
│   ├── composer.json
│   ├── config/
│   └── web/app/themes/<theme>/  # Block Theme (FSE)
└── setup.js                     # Interactive setup script
```

## Theme Structure

```
app/web/app/themes/<theme>/
├── blocks/                  # ACF Blocks v3 (block.json + render.php)
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
├── public/                  # Vite build output (gitignored)
├── theme.json               # Design tokens
├── vite.config.js           # Vite build config
└── functions.php            # Theme bootstrap
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

## Production Deployment

```sh
cd app/web/app/themes/<your-theme>
npm run production

cd app
composer install --no-dev --optimize-autoloader
```
