#!/bin/bash
# =============================================================================
# Aus Fair Go — Production Deployment Script
# Server: Ubuntu 22.04 on Digital Ocean (170.64.172.194)
# Domain: ausfairgo.com.au
# Repo:   https://github.com/MrSilvaRenato/fairgo-api
# =============================================================================
set -e

APP_DIR="/var/www/fairgo"
DOMAIN="ausfairgo.com.au"
REPO="https://github.com/MrSilvaRenato/fairgo-api.git"
PHP_VERSION="8.3"
DB_NAME="fairgo"
DB_USER="fairgo"

echo "================================================================"
echo " Aus Fair Go — Server Bootstrap"
echo "================================================================"

# ── 1. System packages ───────────────────────────────────────────────
apt-get update -y
apt-get upgrade -y
apt-get install -y \
    curl wget git unzip zip \
    nginx certbot python3-certbot-nginx \
    mysql-server \
    software-properties-common

# ── 2. PHP 8.3 ──────────────────────────────────────────────────────
add-apt-repository ppa:ondrej/php -y
apt-get update -y
apt-get install -y \
    php${PHP_VERSION}-fpm \
    php${PHP_VERSION}-cli \
    php${PHP_VERSION}-mysql \
    php${PHP_VERSION}-mbstring \
    php${PHP_VERSION}-xml \
    php${PHP_VERSION}-bcmath \
    php${PHP_VERSION}-curl \
    php${PHP_VERSION}-zip \
    php${PHP_VERSION}-intl \
    php${PHP_VERSION}-gd \
    php${PHP_VERSION}-redis

# ── 3. Composer ─────────────────────────────────────────────────────
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# ── 4. Node.js 20 LTS ───────────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# ── 5. MySQL database + user ─────────────────────────────────────────
echo "Enter a strong password for the MySQL database user '${DB_USER}':"
read -s DB_PASS

mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
echo "Database created."

# ── 6. Clone repo ────────────────────────────────────────────────────
mkdir -p ${APP_DIR}
git clone ${REPO} ${APP_DIR}
cd ${APP_DIR}

# ── 7. Laravel — install & configure ─────────────────────────────────
composer install --no-dev --optimize-autoloader

# Generate .env from example
cp .env.example .env

# Prompt for secrets
echo ""
echo "=== Configure .env ==="
read -p "Mail host (default: smtp.mailgun.org): " MAIL_HOST
MAIL_HOST=${MAIL_HOST:-smtp.mailgun.org}
read -p "Mail port (default: 587): " MAIL_PORT
MAIL_PORT=${MAIL_PORT:-587}
read -p "Mail username: " MAIL_USER
read -s -p "Mail password: " MAIL_PASS
echo ""
read -p "Mail from address (default: hello@ausfairgo.com.au): " MAIL_FROM
MAIL_FROM=${MAIL_FROM:-hello@ausfairgo.com.au}
read -p "Anthropic API key (for AI moderation): " ANTHROPIC_KEY
read -p "Clearbit API key (for company logos, optional): " CLEARBIT_KEY

# Write .env
cat > .env <<ENV
APP_NAME="Aus Fair Go"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://${DOMAIN}
FRONTEND_URL=https://${DOMAIN}

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=${DB_NAME}
DB_USERNAME=${DB_USER}
DB_PASSWORD=${DB_PASS}

QUEUE_CONNECTION=database

MAIL_MAILER=smtp
MAIL_HOST=${MAIL_HOST}
MAIL_PORT=${MAIL_PORT}
MAIL_USERNAME=${MAIL_USER}
MAIL_PASSWORD=${MAIL_PASS}
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=${MAIL_FROM}
MAIL_FROM_NAME="Aus Fair Go"

ANTHROPIC_API_KEY=${ANTHROPIC_KEY}
CLEARBIT_API_KEY=${CLEARBIT_KEY}

SANCTUM_STATEFUL_DOMAINS=${DOMAIN}
SESSION_DOMAIN=.${DOMAIN}
SESSION_DRIVER=database
SESSION_LIFETIME=120

CACHE_DRIVER=file
ENV

# Generate app key
php artisan key:generate

# ── 8. Run migrations + seed admin ───────────────────────────────────
php artisan migrate --force
php artisan db:seed --class=AdminSeeder --force
php artisan db:seed --class=CompanySeeder --force

# Permissions
chown -R www-data:www-data ${APP_DIR}
find ${APP_DIR} -type f -name "*.php" -exec chmod 644 {} \;
find ${APP_DIR} -type d -exec chmod 755 {} \;
chmod -R 775 ${APP_DIR}/storage ${APP_DIR}/bootstrap/cache

# ── 9. Build React frontend ───────────────────────────────────────────
npm ci
npm run build
# Built files land in dist/

# ── 10. Queue worker (systemd) ────────────────────────────────────────
cat > /etc/systemd/system/fairgo-worker.service <<SERVICE
[Unit]
Description=Aus Fair Go Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
RestartSec=5
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/php${PHP_VERSION} ${APP_DIR}/artisan queue:work --sleep=3 --tries=3 --max-time=3600
StandardOutput=append:/var/log/fairgo-worker.log
StandardError=append:/var/log/fairgo-worker.log

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable fairgo-worker
systemctl start fairgo-worker

# ── 11. Nginx ─────────────────────────────────────────────────────────
cat > /etc/nginx/sites-available/fairgo <<NGINX
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    root ${APP_DIR}/dist;
    index index.html;

    # Serve React SPA — all non-API routes go to index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Laravel API — proxy to PHP-FPM
    location /api/ {
        alias ${APP_DIR}/public/;
        try_files \$uri \$uri/ @laravel;

        location ~ \.php$ {
            fastcgi_pass unix:/run/php/php${PHP_VERSION}-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME ${APP_DIR}/public/index.php;
            include fastcgi_params;
        }
    }

    location @laravel {
        fastcgi_pass unix:/run/php/php${PHP_VERSION}-fpm.sock;
        fastcgi_param SCRIPT_FILENAME ${APP_DIR}/public/index.php;
        fastcgi_param PATH_INFO \$uri;
        include fastcgi_params;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1000;

    client_max_body_size 20M;
}
NGINX

ln -sf /etc/nginx/sites-available/fairgo /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 12. SSL — Let's Encrypt ───────────────────────────────────────────
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN} --redirect

# ── 13. Artisan cron (scheduler) ─────────────────────────────────────
(crontab -l 2>/dev/null; echo "* * * * * www-data php ${APP_DIR}/artisan schedule:run >> /dev/null 2>&1") | crontab -

# ── Done ──────────────────────────────────────────────────────────────
echo ""
echo "================================================================"
echo " DEPLOYMENT COMPLETE"
echo " Site: https://${DOMAIN}"
echo " Admin login: renatoleite.log@gmail.com"
echo "================================================================"
