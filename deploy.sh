#!/usr/bin/env bash
set -e

# Fair Go — production deploy script
# Run on DigitalOcean droplet after git pull

echo "==> Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader

echo "==> Installing Node dependencies & building frontend..."
npm ci
npm run build

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Caching config, routes, views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "==> Restarting queue worker..."
php artisan queue:restart

echo "==> Done."
