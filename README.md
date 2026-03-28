# WordPress Vite Boilerplate

**WordPress Bedrock + Docker + Vite** boilerplate with interactive setup, Block Theme (FSE), ACF Blocks v3, TypeScript, SCSS, and remote sync (SSH or FTP).

## Requirements

- [Node.js](http://nodejs.org/) >= 18
- [Git](https://git-scm.com/) (includes Git Bash on Windows)

All other dependencies are checked automatically by the setup script.

## Quick Start

```sh
# 1. Clone the repo
git clone https://github.com/reandimo/wordpress-vite-boilerplate.git my-project
cd my-project

# 2. Run the interactive setup
node setup.js

# 3. Follow the on-screen instructions
```

The setup script detects your OS, asks for your preferences, checks dependencies, and configures everything. See the [Setup Guide](docs/setup-guide.md) for details.

## Dev Modes

| Mode | Description | Sync Protocol |
|------|-------------|---------------|
| **docker** | Full local stack (PHP, Nginx, MariaDB, MailHog, phpMyAdmin) | — |
| **remote-sync** | Edit locally, auto-sync to remote server | SSH (rsync) or FTP (lftp) |
| **both** | Docker local + remote sync | SSH or FTP |

## Sync Protocols

| | SSH (rsync) | FTP (lftp) |
|--|------------|------------|
| **Speed** | Fast (delta sync) | Slower (full mirror) |
| **Auth** | SSH key | Username + password |
| **Requires** | SSH access on server | Any FTP hosting |
| **Install** | `choco install rsync` | `choco install lftp` |

## Documentation

| Page | Description |
|------|-------------|
| [Setup Guide](docs/setup-guide.md) | Interactive setup walkthrough and configuration options |
| [Docker Development](docs/docker-development.md) | Local Docker stack, services, and daily workflow |
| [Remote Sync](docs/remote-sync.md) | SSH/FTP sync, watch mode, tunnels, and troubleshooting |
| [Theme Development](docs/theme-development.md) | Vite, HMR, SCSS, TypeScript, and asset pipeline |
| [ACF Blocks](docs/acf-blocks.md) | Creating custom blocks with ACF v3 |
| [Deployment](docs/deployment.md) | Production builds and server deployment |
| [Windows Setup](docs/windows-setup.md) | Windows-specific configuration and troubleshooting |

## Project Structure

```
project/
├── setup.js                     # Interactive setup (run once)
├── docker-compose.yml           # Docker services
├── docker/                      # PHP 8.2-fpm + Nginx configs
├── scripts/                     # Remote sync scripts
│   ├── _env.sh                  # Shared env (PATH fix for Windows)
│   ├── _sync.sh                 # Shared sync logic (SSH + FTP)
│   ├── sync-watch.sh            # Watch + auto-sync
│   ├── sync-push.sh / pull.sh   # Manual sync
│   ├── tunnel.sh                # Public tunnel (cloudflared/ngrok)
│   └── setup-remote.sh          # Dependency + connection check
├── app/                         # Bedrock root
│   ├── composer.json
│   ├── config/                  # WordPress config (environments)
│   └── web/app/themes/<theme>/  # Block Theme (FSE)
├── .cursor/rules/               # Cursor IDE coding standards (9 rule files)
└── package.json                 # Root scripts (sync, tunnel, setup)
```

## Theme Structure

```
app/web/app/themes/<theme>/
├── blocks/example-cta/      # Example ACF Block v3
├── includes/
│   ├── ACF/                 # ACF field groups
│   ├── Helpers/ViteHelper.php
│   └── Theme/ThemeSetup.php
├── parts/                   # header.html, footer.html
├── templates/               # FSE templates (index, page, single, 404...)
├── resources/
│   ├── fonts/               # Custom fonts (Vite copies to public/)
│   ├── scripts/frontend/main.ts
│   └── styles/
│       ├── base/            # _variables.scss, _media-queries.scss
│       ├── sections/        # Block/section styles
│       └── frontend/main.scss
├── theme.json               # Design tokens
├── vite.config.js           # Vite 5 + HMR
└── functions.php            # PSR-4 autoloader + bootstrap
```

## Author

Created by **Renan Diaz** — [reandimo.dev](https://reandimo.dev)

## License

GPL-2.0-or-later
