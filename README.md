<p align="center">
  <img src="https://img.shields.io/badge/WordPress-Bedrock-21759b?style=for-the-badge&logo=wordpress&logoColor=white" alt="WordPress" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

<h1 align="center">WordPress Vite Boilerplate</h1>

<p align="center">
  <b>Bedrock + Docker + Vite + Block Theme (FSE)</b><br/>
  Interactive setup, ACF Blocks v3, TypeScript, SCSS, and remote sync via SSH/FTP.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PHP-8.2-777BB4?style=flat-square&logo=php&logoColor=white" alt="PHP" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/SCSS-BEM-CC6699?style=flat-square&logo=sass&logoColor=white" alt="SCSS" />
  <img src="https://img.shields.io/badge/license-GPL--2.0-green?style=flat-square" alt="License" />
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-dev-modes">Dev Modes</a> ·
  <a href="docs/setup-guide.md">Setup Guide</a> ·
  <a href="docs/theme-development.md">Theme Dev</a> ·
  <a href="docs/acf-blocks.md">ACF Blocks</a>
</p>

---

## The Problem

```
😩 Classic WordPress                    ✨ With This Boilerplate
─────────────────────                   ─────────────────────────
Edit via FTP or cPanel editor           Edit locally, auto-sync to server
No HMR, manual browser refresh         Vite HMR — instant CSS/JS updates
Vanilla CSS / jQuery spaghetti          TypeScript + SCSS + BEM
No version control structure            Bedrock + Docker + Composer
"Works on my machine"                   Same stack everywhere
Create blocks with copy-paste PHP       ACF Blocks v3 with field groups
```

Think **`shopify theme dev`**, but for WordPress.

---

## 📦 Requirements

- [Node.js](http://nodejs.org/) >= 18
- [Git](https://git-scm.com/) (includes Git Bash on Windows)

Everything else is checked automatically by the setup script.

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/reandimo/wordpress-vite-boilerplate.git my-project
cd my-project

# Run the interactive setup
node setup.js

# Follow the on-screen instructions ✨
```

The setup script detects your OS, asks for your preferences, checks dependencies, and configures everything. See the [Setup Guide](docs/setup-guide.md) for details.

---

## 🔀 Dev Modes

The setup wizard lets you choose how you want to develop:

```
╭──────────────────────────────────────────────────────────────╮
│                                                              │
│   🐳  docker        Full local stack                        │
│                     PHP, Nginx, MariaDB, MailHog, phpMyAdmin │
│                                                              │
│   🔄  remote-sync   Edit locally, sync to remote            │
│                     SSH (rsync) or FTP (lftp)                │
│                                                              │
│   ⚡  both          Docker local + remote sync              │
│                     Best of both worlds                      │
│                                                              │
╰──────────────────────────────────────────────────────────────╯
```

---

## 🔄 Sync Protocols

```
┌──────────────────────┬──────────────────────┐
│  SSH (rsync)         │  FTP (lftp)          │
│  ══════════          │  ═════════           │
│  ✔ Delta transfer    │  ✔ Universal access  │
│  ✔ Encrypted         │  ✔ No server setup   │
│  ✔ Passwordless      │  ✔ Works everywhere  │
│  ✔ ~200 bytes/edit   │  ✘ Full file upload  │
│                      │                      │
│  ★ Recommended       │  ○ Fallback option   │
└──────────────────────┴──────────────────────┘
```

```bash
# Sync commands
npm run sync            # Watch + auto-sync
npm run sync:push       # One-time upload
npm run sync:pull       # One-time download
npm run tunnel          # Public URL for previews
npm run setup:remote    # Preflight check
```

---

## 📖 Documentation

| | Page | What you'll learn |
|:--|:-----|:------------------|
| 🧙 | [Setup Guide](docs/setup-guide.md) | Interactive setup walkthrough and config options |
| 🐳 | [Docker Development](docs/docker-development.md) | Local stack, services, and daily workflow |
| 🔄 | [Remote Sync](docs/remote-sync.md) | SSH/FTP sync, watch mode, tunnels |
| 🎨 | [Theme Development](docs/theme-development.md) | Vite, HMR, SCSS, TypeScript, asset pipeline |
| 🧱 | [ACF Blocks](docs/acf-blocks.md) | Creating custom blocks with ACF v3 |
| 🚀 | [Deployment](docs/deployment.md) | Production builds and server deployment |
| 🪟 | [Windows Setup](docs/windows-setup.md) | Windows-specific config and troubleshooting |

---

## 🏗️ Project Structure

```
project/
├── setup.js                        # Interactive setup (run once)
├── docker-compose.yml              # Docker services
├── docker/                         # PHP 8.2-fpm + Nginx configs
├── scripts/                        # Remote sync scripts
│   ├── _env.sh                     #   ├─ Shared env (PATH fix for Windows)
│   ├── _ui.sh                      #   ├─ Terminal UI (colors, banners)
│   ├── _sync.sh                    #   ├─ Sync logic (SSH + FTP)
│   ├── sync-watch.sh               #   ├─ Watch + auto-sync
│   ├── sync-push.sh / pull.sh      #   ├─ Manual sync
│   ├── tunnel.sh                   #   ├─ Public tunnel (cloudflared/ngrok)
│   └── setup-remote.sh             #   └─ Dependency + connection check
├── app/                            # Bedrock root
│   ├── composer.json               #   ├─ WP core + plugins (wpackagist)
│   ├── config/                     #   ├─ WordPress config (environments)
│   └── web/app/themes/<theme>/     #   └─ Your Block Theme ⬇
└── package.json                    # Root scripts (sync, tunnel, setup)
```

## 🎨 Theme Structure

```
app/web/app/themes/<theme>/
│
├── blocks/                         # ACF Blocks v3
│   └── example-cta/                #   └─ block.json + render.php
│
├── includes/                       # PHP classes (PSR-4)
│   ├── ACF/                        #   ├─ Field groups
│   ├── Helpers/ViteHelper.php      #   ├─ Vite asset loading
│   └── Theme/ThemeSetup.php        #   └─ Theme bootstrap
│
├── parts/                          # Template parts
│   ├── header.html                 #   ├─ Site header
│   └── footer.html                 #   └─ Site footer
│
├── templates/                      # FSE block templates
│   ├── index.html                  #   ├─ Default
│   ├── page.html                   #   ├─ Pages
│   ├── single.html                 #   ├─ Posts
│   └── 404.html                    #   └─ Not found
│
├── resources/
│   ├── fonts/                      # Custom fonts → copied to public/
│   ├── scripts/frontend/main.ts    # TS entry point
│   └── styles/
│       ├── base/                   #   ├─ Variables, media queries
│       ├── components/             #   ├─ Reusable component styles
│       ├── sections/               #   ├─ Block/section styles
│       └── frontend/main.scss      #   └─ SCSS entry point
│
├── theme.json                      # Design tokens + block settings
├── vite.config.js                  # Vite 5 + HMR config
└── functions.php                   # PSR-4 autoloader + bootstrap
```

---

## 🧱 ACF Blocks v3

Create custom blocks with a simple workflow:

```bash
# 1. Create block files
blocks/my-block/block.json          # Block definition
blocks/my-block/render.php          # Block template

# 2. Add ACF fields
includes/ACF/MyBlock.php            # Field group

# 3. Register
functions.php → $acf_files[]        # Add 'MyBlock'
ThemeSetup.php → $blocks[]          # Add 'my-block'

# 4. Style
resources/styles/sections/_my-block.scss
```

See the included `blocks/example-cta/` for a complete reference.

---

## ⚡ Vite + HMR

```bash
# Inside theme directory
npm run dev          # Start dev server (localhost:5173)
npm run build        # Build once
npm run production   # Optimized production build
```

- **Dev:** Vite dev server with HMR for instant CSS/JS updates
- **Build:** Assets compiled to `public/` with manifest.json
- **Fonts:** Automatically copied from `resources/fonts/` to `public/fonts/`
- **Docker:** `host.docker.internal` lets the PHP container reach Vite on your host

---

## 🐳 Docker Services

```bash
docker compose up -d                # Start everything
docker compose down                 # Stop everything
docker compose exec php sh          # Shell into PHP container
docker compose exec php wp cache flush   # WP-CLI
```

| Service | Port | Description |
|:--------|:-----|:------------|
| Nginx | `8080` | Web server |
| PHP-FPM | `9000` | PHP 8.2 |
| MariaDB | `3306` | Database |
| MailHog | `8025` | Email testing |
| phpMyAdmin | `8081` | Database GUI |

---

<p align="center">
  <a href="docs/setup-guide.md"><b>📖 Full Setup Guide</b></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/reandimo/wordpress-vite-boilerplate/issues"><b>🐛 Report Bug</b></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/reandimo/wordpress-vite-boilerplate/issues"><b>💡 Request Feature</b></a>
</p>

<p align="center">
  <sub>Built by <a href="https://reandimo.dev">Renan Diaz</a> · GPL-2.0-or-later</sub>
</p>
