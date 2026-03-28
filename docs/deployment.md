# Deployment

## Production Build

```sh
# 1. Build optimized assets
cd app/web/app/themes/<your-theme>
npm run production

# 2. Install PHP deps without dev packages
cd app
composer install --no-dev --optimize-autoloader

# Theme PHP deps (if any)
cd web/app/themes/<your-theme>
composer install --no-dev --optimize-autoloader
```

## Verify Build Output

Ensure these files exist after building:

```
app/web/app/themes/<theme>/public/
├── css/style.css        # Compiled styles
├── js/main.js           # Compiled scripts
├── fonts/               # Copied fonts (if any)
└── manifest.json        # Vite manifest
```

The `public/hot` file should NOT exist in production. It's only created by `npm run dev`.

## Deploy with Remote Sync

If using the remote sync workflow:

```sh
# Build locally
cd app/web/app/themes/<your-theme>
npm run production

# Push to server
cd ../../../..
npm run sync:push
```

## What to Deploy

### Files to include
- `app/` (entire directory except vendor/)
- `app/vendor/` (after `composer install --no-dev`)
- `app/web/app/themes/<theme>/public/` (built assets)
- `docker/` (only if using Docker on the server)

### Files to exclude
- `node_modules/`
- `.env` (create on server separately)
- `.git/`
- `setup.js`, `.setup-backup/`
- `app/web/app/themes/<theme>/resources/` (source files, not needed on server)

## Environment Variables

On the production server, create `app/.env` with production values:

```sh
WP_ENV=production
WP_HOME=https://yourdomain.com
WP_SITEURL=${WP_HOME}/wp

DB_HOST=localhost
DB_NAME=your_db
DB_USER=your_user
DB_PASSWORD=your_password

# Generate unique salts: https://roots.io/salts.html
AUTH_KEY='...'
SECURE_AUTH_KEY='...'
# ... etc
```

## Server Requirements

- PHP >= 8.2 with extensions: gd, intl, mysqli, opcache, zip
- MySQL 5.7+ or MariaDB 10.3+
- Web server (Nginx or Apache) pointing to `app/web/` as document root
- HTTPS configured

## Nginx Config

Point the document root to `app/web/`:

```nginx
server {
    root /var/www/html/app/web;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

---

*Part of [WordPress Vite Boilerplate](https://github.com/reandimo/wordpress-vite-boilerplate) by [Renan Diaz](https://reandimo.dev)*
