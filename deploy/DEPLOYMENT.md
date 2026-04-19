# Aus Fair Go — Production Deployment
**Server:** Digital Ocean Droplet — 170.64.172.194  
**Domain:** ausfairgo.com.au  
**Stack:** Ubuntu 22.04 · PHP 8.3 · MySQL 8 · Nginx · Node 20

---

## Before You Start — Point the Domain

In your DNS provider (or Digital Ocean DNS), set:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `170.64.172.194` |
| A | `www` | `170.64.172.194` |

Wait for propagation (usually 5–30 min) before running SSL.

---

## Step 1 — SSH Into the Droplet

```bash
ssh root@170.64.172.194
```

---

## Step 2 — Install System Dependencies

```bash
apt-get update -y && apt-get upgrade -y

apt-get install -y curl wget git unzip zip nginx certbot \
  python3-certbot-nginx mysql-server software-properties-common

# PHP 8.3
add-apt-repository ppa:ondrej/php -y && apt-get update -y
apt-get install -y php8.3-fpm php8.3-cli php8.3-mysql php8.3-mbstring \
  php8.3-xml php8.3-bcmath php8.3-curl php8.3-zip php8.3-intl php8.3-gd

# Composer
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

---

## Step 3 — Create MySQL Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE fairgo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fairgo'@'localhost' IDENTIFIED BY 'CHOOSE_A_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON fairgo.* TO 'fairgo'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## Step 4 — Clone & Install the App

```bash
mkdir -p /var/www/fairgo
git clone https://github.com/MrSilvaRenato/fairgo-api.git /var/www/fairgo
cd /var/www/fairgo

# PHP dependencies (production only)
composer install --no-dev --optimize-autoloader
```

---

## Step 5 — Configure `.env`

```bash
cp .env.example .env
nano .env
```

Replace the contents with:

```env
APP_NAME="Aus Fair Go"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://ausfairgo.com.au
FRONTEND_URL=https://ausfairgo.com.au

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fairgo
DB_USERNAME=fairgo
DB_PASSWORD=YOUR_DB_PASSWORD_HERE

QUEUE_CONNECTION=database

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org        # or smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=YOUR_MAIL_USERNAME
MAIL_PASSWORD=YOUR_MAIL_PASSWORD
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=hello@ausfairgo.com.au
MAIL_FROM_NAME="Aus Fair Go"

ANTHROPIC_API_KEY=YOUR_ANTHROPIC_KEY
CLEARBIT_API_KEY=YOUR_CLEARBIT_KEY

SANCTUM_STATEFUL_DOMAINS=ausfairgo.com.au,www.ausfairgo.com.au
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=.ausfairgo.com.au

CACHE_STORE=file
FILESYSTEM_DISK=local
```

Then generate the app key:

```bash
php artisan key:generate
```

---

## Step 6 — Run Migrations & Seed

```bash
php artisan migrate --force
php artisan db:seed --class=AdminSeeder --force
php artisan db:seed --class=CompanySeeder --force

# Cache config & routes for performance
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Step 7 — Build React Frontend

```bash
cd /var/www/fairgo
npm ci
npm run build
# Output → public/app/
```

---

## Step 8 — File Permissions

```bash
chown -R www-data:www-data /var/www/fairgo
find /var/www/fairgo -type f -exec chmod 644 {} \;
find /var/www/fairgo -type d -exec chmod 755 {} \;
chmod -R 775 /var/www/fairgo/storage /var/www/fairgo/bootstrap/cache
```

---

## Step 9 — Nginx

```bash
cp /var/www/fairgo/deploy/nginx.conf /etc/nginx/sites-available/fairgo
ln -sf /etc/nginx/sites-available/fairgo /etc/nginx/sites-enabled/fairgo
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
```

---

## Step 10 — SSL (Let's Encrypt)

```bash
certbot --nginx -d ausfairgo.com.au -d www.ausfairgo.com.au \
  --non-interactive --agree-tos \
  --email renatoleite.log@gmail.com \
  --redirect
```

Auto-renewal is set up by default. Verify with:
```bash
certbot renew --dry-run
```

---

## Step 11 — Queue Worker (systemd)

```bash
cat > /etc/systemd/system/fairgo-worker.service << 'EOF'
[Unit]
Description=Aus Fair Go Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
RestartSec=5
WorkingDirectory=/var/www/fairgo
ExecStart=/usr/bin/php8.3 /var/www/fairgo/artisan queue:work --sleep=3 --tries=3 --max-time=3600
StandardOutput=append:/var/log/fairgo-worker.log
StandardError=append:/var/log/fairgo-worker.log

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable fairgo-worker
systemctl start fairgo-worker
systemctl status fairgo-worker
```

---

## Step 12 — Cron Scheduler

```bash
(crontab -l 2>/dev/null; echo "* * * * * www-data php /var/www/fairgo/artisan schedule:run >> /dev/null 2>&1") | crontab -
```

---

## Verify Everything Works

```bash
# API health check
curl https://ausfairgo.com.au/api/leaderboard

# Queue worker running?
systemctl status fairgo-worker

# Nginx running?
systemctl status nginx

# PHP-FPM running?
systemctl status php8.3-fpm

# Check logs
tail -f /var/log/fairgo-worker.log
tail -f /var/log/nginx/fairgo-error.log
tail -f /var/www/fairgo/storage/logs/laravel.log
```

---

## Future Deploys (Code Updates)

```bash
cd /var/www/fairgo
git pull origin main

composer install --no-dev --optimize-autoloader
npm ci && npm run build

php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

systemctl restart fairgo-worker
systemctl reload nginx
```

---

## Admin Login

| | |
|---|---|
| **URL** | https://ausfairgo.com.au/admin |
| **Email** | renatoleite.log@gmail.com |
| **Password** | Re58219094$ |
