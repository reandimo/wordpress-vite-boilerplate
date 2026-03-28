# Windows Setup

This boilerplate is fully compatible with Windows. The setup script auto-detects Windows and configures everything, but here's what happens under the hood.

## How It Works

### Git Bash as Script Shell

npm on Windows defaults to `cmd.exe` or PowerShell for running scripts. Since the sync scripts are bash, the setup creates `.npmrc`:

```
script-shell=C:\\Program Files\\Git\\bin\\bash.exe
```

This lets you run `npm run sync`, `npm run setup:remote`, etc. from PowerShell or cmd.

### PATH Extension

Windows tools installed via Chocolatey or Scoop aren't always in Git Bash's PATH. The shared `scripts/_env.sh` automatically adds:

- `C:\ProgramData\chocolatey\bin`
- `C:\ProgramData\chocolatey\lib\rsync\tools\bin`
- `%USERPROFILE%\scoop\shims`
- `C:\Program Files\Git\usr\bin`
- `C:\Windows\System32\OpenSSH`

### File Watching

Windows doesn't have `fswatch` or `inotifywait`, so `sync-watch.sh` falls back to **polling mode** (checks every 2 seconds). This is slightly less efficient but works reliably.

## Installing Dependencies

### Chocolatey (package manager)

Install Chocolatey first (PowerShell as **Admin**):

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Close and reopen the terminal after installing.

### Tools

```powershell
# For SSH sync mode
choco install rsync -y

# For FTP sync mode
choco install lftp -y

# For Docker mode
# Install Docker Desktop from https://www.docker.com/products/docker-desktop/
choco install composer -y

# Optional: tunnels
choco install cloudflared -y
# or
choco install ngrok -y
```

### After Installing

Close and reopen your terminal so the new PATH entries are picked up. Then verify:

```powershell
npm run setup:remote
```

## Troubleshooting

### "bash: command not found" or WSL error

npm is trying to use WSL's bash instead of Git Bash. Ensure `.npmrc` exists:

```
script-shell=C:\\Program Files\\Git\\bin\\bash.exe
```

The setup creates this automatically. If it's missing, create it manually in the project root.

### rsync/lftp not found (after installing via choco)

Git Bash doesn't inherit the full Windows PATH. The `_env.sh` script handles this, but if it still fails:

```sh
# Check where choco installed it
where rsync

# Manually add to PATH in Git Bash
export PATH="/c/ProgramData/chocolatey/bin:$PATH"
```

### SSH: "Permission denied (publickey)"

Generate and copy your SSH key:

```powershell
ssh-keygen -t ed25519
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh user@host "cat >> .ssh/authorized_keys"
```

Windows doesn't have `ssh-copy-id`. The command above does the same thing.

### Docker: "Cannot connect to the Docker daemon"

Ensure Docker Desktop is running. You can also check:

```powershell
docker info
```

### Line ending issues

The `.editorconfig` sets `end_of_line = lf` for all files. If you see `\r\n` issues, configure Git:

```sh
git config --global core.autocrlf input
```

---

*Part of [WordPress Vite Boilerplate](https://github.com/reandimo/wordpress-vite-boilerplate) by [Renan Diaz](https://reandimo.dev)*
