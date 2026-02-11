# Deploy Guide (Google Search Ready)

This project is a Node.js app that serves both API and frontend from `webapp/server/index.js`.

## 1. Server setup (Ubuntu)

```bash
sudo apt update
sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 2. Upload project

From your local machine:

```bash
scp -r webapp user@SERVER_IP:/var/www/kids-games
```

On server:

```bash
cd /var/www/kids-games/webapp
npm install
cp .env.example .env
```

Edit `.env` and set a strong `JWT_SECRET`:

```bash
nano .env
```

## 3. Run with PM2

```bash
sudo npm i -g pm2
pm2 start server/index.js --name kids-games
pm2 save
pm2 startup
```

## 4. Nginx reverse proxy

Create config:

```bash
sudo nano /etc/nginx/sites-available/kids-games
```

Paste:

```nginx
server {
  listen 80;
  server_name your-domain.com www.your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/kids-games /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 5. HTTPS (required for trust and SEO)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 6. DNS setup

In your domain panel:
- Add `A` record: `@ -> SERVER_IP`
- Add `A` record: `www -> SERVER_IP`

Wait until DNS propagates, then open:
- `https://your-domain.com`

## 7. SEO files already prepared

The following files are already added:
- `webapp/client/robots.txt`
- `webapp/client/sitemap.xml`
- SEO meta tags in `webapp/client/index.html`

Important: replace `https://your-domain.com` placeholders in:
- `webapp/client/index.html`
- `webapp/client/robots.txt`
- `webapp/client/sitemap.xml`

## 8. Google Search Console

1. Open Google Search Console.
2. Add your domain property.
3. Verify ownership (usually DNS TXT).
4. Submit sitemap URL:
   - `https://your-domain.com/sitemap.xml`
5. Use "Request Indexing" for homepage.

Google indexing can take a few days to a few weeks.
