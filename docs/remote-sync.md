# Remote Sync

Edit theme files locally and auto-sync them to a remote server — the same workflow Shopify developers get with `shopify theme dev`, but for WordPress.

No more FTP clients, no more manual uploads. Save a file locally and it's on your server in seconds. Pair it with Vite HMR for instant CSS updates and you have a modern development experience on any hosting.

## Protocols

### SSH (rsync) — Recommended

Fast delta sync over SSH. Only changed bytes are transferred.

**Requirements:** rsync, SSH access to server, SSH key configured

```sh
# Install (Windows)
choco install rsync

# Install (macOS)
brew install rsync    # Usually pre-installed

# Install (Linux)
sudo apt install rsync
```

### FTP (lftp)

Mirror sync over FTP. Works with any hosting that provides FTP access.

**Requirements:** lftp

```sh
# Install (Windows)
choco install lftp

# Install (macOS)
brew install lftp

# Install (Linux)
sudo apt install lftp
```

## Configuration

### .env Variables

```sh
# Protocol: ssh or ftp
SYNC_PROTOCOL=ssh

# Server connection
REMOTE_USER=username
REMOTE_HOST=myserver.com
REMOTE_PORT=22              # 22 for SSH, 21 for FTP
REMOTE_THEME_PATH=/var/www/html/wp-content/themes/my-theme

# FTP only
REMOTE_PASSWORD=mypassword

# Sync behavior
SYNC_EXCLUDE=.git,node_modules,.DS_Store,*.log,.env,public/hot
SYNC_DELETE=false           # true = delete remote files not present locally
```

### SSH Key Setup

```sh
# Generate a key (if you don't have one)
ssh-keygen -t ed25519

# Copy to server
ssh-copy-id -p 22 user@myserver.com

# Test connection
ssh -p 22 user@myserver.com
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run setup:remote` | Check dependencies and test connection |
| `npm run sync` | Watch for changes + auto-sync (Ctrl+C to stop) |
| `npm run sync:push` | One-time push to remote |
| `npm run sync:pull` | One-time pull from remote |
| `npm run tunnel` | Open public tunnel to remote site |
| `npm run sync:tunnel` | Watch + tunnel simultaneously |

## Watch Mode

`npm run sync` starts a file watcher that syncs on every change:

| OS | Watcher | Latency |
|----|---------|---------|
| macOS | fswatch | ~0.5s |
| Linux | inotifywait | ~0.5s |
| Windows | Polling | ~2s |

The watcher syncs only the theme directory, not the entire project.

## SYNC_DELETE Explained

| Value | Behavior |
|-------|----------|
| `false` (default) | Only uploads new/changed files. Never deletes anything on the remote server. Safe for shared environments. |
| `true` | Mirrors local state exactly. Files deleted locally are also deleted on the remote server. Use with caution. |

## Tunnels

Expose the remote server through a public URL for client previews:

```sh
# Using cloudflared
TUNNEL_TOOL=cloudflared
TUNNEL_DOMAIN=mysite.com

# Using ngrok
TUNNEL_TOOL=ngrok
TUNNEL_DOMAIN=mysite.com
```

Install:
```sh
choco install cloudflared    # or: choco install ngrok
```

## Script Architecture

```
scripts/
├── _env.sh          # Loads .env + extends PATH for Windows (Chocolatey, Scoop, Git)
├── _sync.sh         # Shared sync functions (sync_push, sync_pull) for both protocols
├── sync-watch.sh    # Calls sync_push on file changes
├── sync-push.sh     # One-time sync_push
├── sync-pull.sh     # One-time sync_pull
├── tunnel.sh        # Opens cloudflared or ngrok tunnel
└── setup-remote.sh  # Dependency checker + connection tester
```

All scripts source `_env.sh` first (loads `.env` + fixes PATH on Windows) then `_sync.sh` (provides `sync_push` and `sync_pull` functions that handle both SSH and FTP).

## Troubleshooting

### rsync: command not found (Windows)
Chocolatey's rsync may not be in Git Bash's PATH. The `_env.sh` script adds common paths automatically. If it still fails:
```sh
export PATH="/c/ProgramData/chocolatey/bin:$PATH"
```

### SSH: Connection refused
- Verify SSH is enabled on your server (check hosting panel)
- Check the port: some hosts use 2222, 7822, etc. instead of 22
- The hostname for SSH may differ from FTP (e.g. `ssh.host.com` vs `ftp.host.com`)

### FTP: Login incorrect
- Verify credentials in `.env`
- Some hosts require the full email as username (e.g. `user@domain.com`)
- Check if your IP needs to be whitelisted

### Sync is slow
- SSH (rsync) is significantly faster than FTP since it only transfers changes
- For FTP, consider excluding large directories: `SYNC_EXCLUDE=.git,node_modules,public/fonts`
- On Windows, polling mode checks every 2 seconds — this is normal

---

*Part of [WordPress Vite Boilerplate](https://github.com/reandimo/wordpress-vite-boilerplate) by [Renan Diaz](https://reandimo.dev)*
