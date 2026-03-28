# Setup Guide

## Running the Setup

```sh
node setup.js
```

The setup script walks you through all configuration in a single interactive session.

## What It Asks

### 1. Theme Configuration

| Prompt | Default | Description |
|--------|---------|-------------|
| Theme name | My Theme | Display name in WordPress |
| Theme slug | auto from name | Directory name, handles, textdomain (kebab-case) |
| PHP namespace | auto from name | PSR-4 namespace for PHP classes (PascalCase) |
| Description | WordPress Block Theme | Theme description |
| Author name | — | Your name or company |
| Author URL | — | Your website |

### 2. Development Mode

| Mode | When to use |
|------|-------------|
| **docker** | You want a full local WordPress environment |
| **remote-sync** | You have an existing server and want to edit locally |
| **both** | Docker for local dev + sync scripts for staging/production |

### 3. Remote Server (if remote-sync or both)

| Prompt | Default | Description |
|--------|---------|-------------|
| Sync protocol | ssh | `ssh` (rsync) or `ftp` (lftp) |
| Remote host | — | Server hostname (e.g. `myserver.com`) |
| Remote user | — | SSH or FTP username |
| SSH port / FTP port | 22 / 21 | Connection port |
| FTP password | — | Only for FTP protocol |
| Remote theme path | auto | Full path to theme on server |
| Delete remote files? | No | Whether to remove files on remote that don't exist locally |

### 4. Optional Features

| Feature | Default | Description |
|---------|---------|-------------|
| WooCommerce | No | Adds `wpackagist-plugin/woocommerce` to Composer |
| ACF Pro blocks | Yes | Keeps ACF block system + example block |

## What It Does

1. **Detects your OS** (Windows/macOS/Linux) and Node version
2. **Checks dependencies** based on your chosen mode and shows install commands
3. **Renames** `starter-theme/` to your theme slug
4. **Replaces placeholders** (`__THEME_NAME__`, `__NAMESPACE__`, etc.) across all files
5. **On Windows**: creates `.npmrc` pointing to Git Bash so scripts work from PowerShell
6. **Removes unused files** based on mode (Docker files or sync scripts)
7. **Configures `.env.example`** with your remote server settings
8. **Moves itself** to `.setup-backup/` (can be restored if needed)

## Placeholders

The boilerplate uses these placeholders in all template files:

| Placeholder | Example Value |
|-------------|---------------|
| `__THEME_NAME__` | My Theme |
| `__THEME_SLUG__` | my-theme |
| `__NAMESPACE__` | MyTheme |
| `__DESCRIPTION__` | WordPress Block Theme |
| `__AUTHOR__` | John Doe |
| `__AUTHOR_URI__` | https://example.com |
| `__THEME_URI__` | https://example.com |
| `__PROJECT_SLUG__` | my-theme |

## Re-running Setup

If you need to run setup again:

```sh
# Restore the setup script
cp .setup-backup/setup.js setup.js
node setup.js
```

Note: re-running on an already-configured project will try to replace placeholders that no longer exist. It's designed to run once on a fresh clone.

---

*Part of [WordPress Vite Boilerplate](https://github.com/reandimo/wordpress-vite-boilerplate) by [Renan Diaz](https://reandimo.dev)*
