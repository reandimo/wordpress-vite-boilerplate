# Docker Development

## Services

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| php | `{project}-php` | 9000 (internal) | PHP 8.2-fpm-alpine with extensions |
| nginx | `{project}-nginx` | 80, 443 | Reverse proxy to PHP-FPM |
| db | `{project}-db` | 3306 | MariaDB 11 |
| mailhog | `{project}-mailhog` | 1025 (SMTP), 8025 (UI) | Email testing |
| phpmyadmin | `{project}-phpmyadmin` | 8080 | Database admin |

## First Time Setup

```sh
# 1. Create environment files
cp .env.example .env
cp app/.env.example app/.env

# 2. Edit app/.env
#    - Set DB_HOST=db
#    - Set WP_HOME=http://localhost
#    - Generate salts: https://roots.io/salts.html

# 3. Install Bedrock dependencies
cd app && composer install && cd ..

# 4. Start Docker
docker compose up -d

# 5. Install theme dependencies and start dev server
cd app/web/app/themes/<your-theme>
npm install
npm run dev

# 6. Open http://localhost and complete WordPress install
```

## Daily Workflow

```sh
docker compose up -d                          # Start services
cd app/web/app/themes/<your-theme> && npm run dev   # Start HMR
# ... make changes ...
# Ctrl+C to stop Vite
docker compose down                           # Stop services
```

## Useful Commands

```sh
# Docker
docker compose up -d              # Start all services
docker compose down               # Stop all services
docker compose logs -f php        # View PHP logs
docker compose exec php sh        # Shell into PHP container

# Bedrock (from app/)
cd app
composer install                  # Install WP core + plugins
composer require wpackagist-plugin/plugin-name   # Add a plugin

# WordPress CLI (inside container)
docker compose exec php wp cache flush
docker compose exec php wp db export
docker compose exec php wp plugin list
```

## Adding Plugins

```sh
cd app
composer require wpackagist-plugin/plugin-name
```

Plugins install to `app/web/app/plugins/` and are gitignored. Only `composer.json` is committed.

## PHP Extensions

The Dockerfile (`docker/php/Dockerfile`) includes: bcmath, exif, gd, intl, mysqli, opcache, pdo_mysql, zip, soap.

To add more, edit the Dockerfile and rebuild:

```sh
docker compose up -d --build
```

## Troubleshooting

### Docker won't start
```sh
docker compose down -v           # Stop and clean volumes
docker compose up -d --build     # Rebuild images
docker compose logs -f           # View all logs
```

### Database connection error
Ensure `app/.env` has `DB_HOST=db` (the Docker service name, not `localhost`).

### WordPress shows wrong URL
Check `WP_HOME` in `app/.env`. It should be `http://localhost` for Docker.

### Port conflicts
If port 80 is taken, change in `docker-compose.yml`:
```yaml
ports:
  - "8000:80"   # Use http://localhost:8000 instead
```

---

*Part of [WordPress Vite Boilerplate](https://github.com/reandimo/wordpress-vite-boilerplate) by [Renan Diaz](https://reandimo.dev)*
