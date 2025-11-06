# Tennis Clicker Backend - Deployment Guide

This guide covers deploying the Tennis Clicker WebSocket backend server to various platforms.

## Quick Start (Local)

```bash
# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env
# Edit .env and add your RAPIDAPI_KEY

# Start server
pnpm start
```

Server runs on `ws://localhost:8765`

---

## Deployment Options

### 1. Railway (Recommended - Free Tier Available)

Railway is perfect for WebSocket servers with a generous free tier.

**Steps:**

1. Go to [Railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `tennis-clicker-backend`
5. Add environment variables:
   - `RAPIDAPI_KEY` - Your RapidAPI key
   - `AUTH_USERNAME` - Your username
   - `AUTH_PASSWORD` - Your password
6. Railway will auto-detect Node.js and deploy

**Get WebSocket URL:**
- Railway provides a public URL like `tennis-clicker-backend-production.up.railway.app`
- Use `wss://tennis-clicker-backend-production.up.railway.app` (note: wss not ws)

**Cost:** Free tier includes 500 hours/month

---

### 2. Render

Render offers free tier with WebSocket support.

**Steps:**

1. Go to [Render.com](https://render.com)
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Connect `tennis-clicker-backend` repository
5. Configure:
   - **Name:** tennis-clicker-backend
   - **Environment:** Node
   - **Build Command:** `pnpm install`
   - **Start Command:** `pnpm start`
   - **Plan:** Free
6. Add environment variables in "Environment" tab
7. Deploy

**WebSocket URL:** `wss://tennis-clicker-backend.onrender.com`

**Note:** Free tier spins down after 15 minutes of inactivity

---

### 3. Heroku

Classic platform with WebSocket support.

**Steps:**

1. Install Heroku CLI: `npm install -g heroku`
2. Login: `heroku login`
3. Create app:
```bash
cd tennis-clicker-backend
heroku create tennis-clicker-backend
```
4. Set environment variables:
```bash
heroku config:set RAPIDAPI_KEY=your_key_here
heroku config:set AUTH_USERNAME=admin
heroku config:set AUTH_PASSWORD=your_password
```
5. Deploy:
```bash
git push heroku master
```

**WebSocket URL:** `wss://tennis-clicker-backend.herokuapp.com`

**Cost:** $7/month minimum (no free tier anymore)

---

### 4. DigitalOcean App Platform

**Steps:**

1. Go to [DigitalOcean](https://www.digitalocean.com)
2. Create new App
3. Connect GitHub repository
4. Configure:
   - **Type:** Web Service
   - **Build Command:** `pnpm install`
   - **Run Command:** `pnpm start`
5. Add environment variables
6. Deploy

**Cost:** $5/month minimum

---

### 5. AWS EC2 (Full Control)

For production deployments requiring full control.

**Steps:**

1. Launch Ubuntu EC2 instance
2. SSH into instance
3. Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm
```
4. Clone repository:
```bash
git clone https://github.com/filipas123/tennis-clicker-backend.git
cd tennis-clicker-backend
pnpm install
```
5. Create .env file with your credentials
6. Install PM2:
```bash
npm install -g pm2
pm2 start server.js --name tennis-clicker-backend
pm2 startup
pm2 save
```
7. Configure security group to allow port 8765

**WebSocket URL:** `ws://your-ec2-ip:8765`

**For HTTPS/WSS:** Set up Nginx reverse proxy with SSL certificate

---

### 6. Google Cloud Run

Serverless container deployment.

**Steps:**

1. Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8765
CMD ["node", "server.js"]
```

2. Build and deploy:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/tennis-clicker-backend
gcloud run deploy tennis-clicker-backend \
  --image gcr.io/PROJECT_ID/tennis-clicker-backend \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars RAPIDAPI_KEY=your_key
```

**WebSocket URL:** Provided after deployment

---

### 7. Fly.io

Modern platform with global edge deployment.

**Steps:**

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch app:
```bash
cd tennis-clicker-backend
fly launch
```
4. Set secrets:
```bash
fly secrets set RAPIDAPI_KEY=your_key
fly secrets set AUTH_USERNAME=admin
fly secrets set AUTH_PASSWORD=your_password
```
5. Deploy:
```bash
fly deploy
```

**WebSocket URL:** `wss://tennis-clicker-backend.fly.dev`

**Cost:** Generous free tier

---

## Environment Variables

All platforms require these environment variables:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `RAPIDAPI_KEY` | Your RapidAPI key for SportScore API | Yes | - |
| `AUTH_USERNAME` | Authentication username | No | admin |
| `AUTH_PASSWORD` | Authentication password | No | password |
| `PORT` | Server port (auto-detected on most platforms) | No | 8765 |

---

## SSL/TLS (WSS)

For production, use WSS (WebSocket Secure) instead of WS.

### Option 1: Platform Handles SSL (Recommended)

Most platforms (Railway, Render, Heroku) automatically provide SSL:
- Deploy normally
- Use `wss://` instead of `ws://` in your URL
- Platform handles certificate management

### Option 2: Nginx Reverse Proxy

For self-hosted deployments (EC2, VPS):

1. Install Nginx and Certbot
2. Get SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

3. Configure Nginx:
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8765;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

4. Restart Nginx: `sudo systemctl restart nginx`

**WebSocket URL:** `wss://your-domain.com`

---

## Monitoring

### PM2 (for VPS/EC2)

```bash
# View logs
pm2 logs tennis-clicker-backend

# Monitor resources
pm2 monit

# Restart
pm2 restart tennis-clicker-backend
```

### Platform Logs

- **Railway:** View logs in dashboard
- **Render:** Check "Logs" tab
- **Heroku:** `heroku logs --tail`

---

## Scaling

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Most platforms allow easy tier upgrades

### Horizontal Scaling
- Deploy multiple instances
- Use load balancer
- Implement Redis for shared state (if needed)

---

## Testing Deployment

Use `wscat` to test WebSocket connection:

```bash
npm install -g wscat
wscat -c wss://your-deployment-url.com
```

Then send authentication:
```json
{"type":"authenticate","username":"admin","password":"password"}
```

---

## Troubleshooting

### Connection Refused
- Check firewall rules
- Verify port is open
- Ensure server is running

### 401/403 Errors
- Verify RapidAPI key is correct
- Check subscription is active
- Ensure environment variables are set

### WebSocket Upgrade Failed
- Check platform supports WebSockets
- Verify SSL certificate (for WSS)
- Review proxy configuration

---

## Cost Comparison

| Platform | Free Tier | Paid Tier | SSL | WebSocket |
|----------|-----------|-----------|-----|-----------|
| Railway | 500 hrs/mo | $5+/mo | ✅ | ✅ |
| Render | Yes (limited) | $7+/mo | ✅ | ✅ |
| Fly.io | 3 VMs | $2+/mo | ✅ | ✅ |
| Heroku | No | $7+/mo | ✅ | ✅ |
| DigitalOcean | No | $5+/mo | ✅ | ✅ |
| AWS EC2 | 1 year | $5+/mo | Manual | ✅ |

---

## Recommended Setup

**For Development:**
- Run locally with `pnpm dev`
- Use `ws://localhost:8765`

**For Production:**
- Deploy to Railway or Render (free tier)
- Use `wss://` URL
- Set strong AUTH_PASSWORD
- Monitor logs regularly

---

## Security Checklist

- [ ] Change default AUTH_PASSWORD
- [ ] Use WSS (not WS) in production
- [ ] Keep RAPIDAPI_KEY secret
- [ ] Enable rate limiting (if needed)
- [ ] Monitor API usage
- [ ] Keep dependencies updated
- [ ] Use environment variables (never hardcode secrets)

---

## Next Steps

1. Choose a deployment platform
2. Deploy the backend server
3. Get the WebSocket URL
4. Update your Tennis Clicker web app with the new URL
5. Test the connection
6. Monitor and maintain

---

**Need help?** Check the README.md or review server logs for errors.
