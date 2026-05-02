# Monopoly Deal - Deployment Guide

## Table of Contents
1. [Production Build](#production-build)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Options](#deployment-options)
4. [Docker Deployment](#docker-deployment)
5. [Manual Deployment](#manual-deployment)
6. [Health Checks](#health-checks)
7. [Monitoring](#monitoring)

---

## Production Build

### Prerequisites
- Node.js 18+ installed on production server
- npm 8+ installed
- Git (for cloning repository)

### Build Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd Challlenge
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build All Packages**
   ```bash
   # Build shared package first
   npm run build --workspace=shared
   
   # Build server
   npm run build --workspace=server
   
   # Build client
   npm run build --workspace=client
   ```

4. **Verify Builds**
   ```bash
   # Check shared/dist exists
   ls -la shared/dist
   
   # Check server/dist exists
   ls -la server/dist
   
   # Check client/dist exists
   ls -la client/dist
   ```

---

## Environment Configuration

### Server Environment Variables

Create `.env` file in project root:

```bash
# Production Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# CORS - Specify allowed origins
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Socket.IO Configuration
SOCKET_IO_PATH=/socket.io
SOCKET_IO_PING_TIMEOUT=60000
SOCKET_IO_PING_INTERVAL=25000

# Game Configuration
MIN_PLAYERS=2
MAX_PLAYERS=5
INITIAL_HAND_SIZE=5
MAX_HAND_SIZE=7
MAX_PLAYS_PER_TURN=3
WIN_CONDITION_SETS=3

# Logging
LOG_LEVEL=info
```

### Client Environment Variables

For production builds, update `client/src/App.tsx`:

```typescript
// Replace localhost with your production server URL
const serverUrl = process.env.VITE_SERVER_URL || 'https://api.yourdomain.com';
```

Or create `client/.env.production`:

```bash
VITE_SERVER_URL=https://api.yourdomain.com
```

---

## Deployment Options

### Option 1: Docker (Recommended)

See [Docker Deployment](#docker-deployment) section below.

### Option 2: PM2 Process Manager

```bash
# Install PM2 globally
npm install -g pm2

# Start server with PM2
cd server
pm2 start dist/index.js --name monopoly-deal-server

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Option 3: systemd Service (Linux)

Create `/etc/systemd/system/monopoly-deal.service`:

```ini
[Unit]
Description=Monopoly Deal Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/monopoly-deal/server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable monopoly-deal
sudo systemctl start monopoly-deal
sudo systemctl status monopoly-deal
```

### Option 4: Nginx Reverse Proxy

Configure Nginx to proxy requests to Node.js server:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Client static files
    location / {
        root /var/www/monopoly-deal/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API and Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001;
    }
}
```

---

## Docker Deployment

### Dockerfile for Server

Create `server/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install --workspace=shared --workspace=server

# Copy source code
COPY shared/ ./shared/
COPY server/ ./server/
COPY carddata.csv ./

# Build
RUN npm run build --workspace=shared
RUN npm run build --workspace=server

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "server/dist/index.js"]
```

### Dockerfile for Client

Create `client/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install --workspace=shared --workspace=client

# Copy source code
COPY shared/ ./shared/
COPY client/ ./client/

# Build
RUN npm run build --workspace=shared
RUN npm run build --workspace=client

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Copy nginx config
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  server:
    build:
      context: .
      dockerfile: server/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - HOST=0.0.0.0
    restart: unless-stopped
    networks:
      - monopoly-deal

  client:
    build:
      context: .
      dockerfile: client/Dockerfile
    ports:
      - "80:80"
    depends_on:
      - server
    restart: unless-stopped
    networks:
      - monopoly-deal

networks:
  monopoly-deal:
    driver: bridge
```

### Deploy with Docker Compose

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

---

## Manual Deployment

### Server Deployment

1. **Transfer Files**
   ```bash
   # On local machine
   tar -czf monopoly-deal.tar.gz \
     package.json \
     shared/ \
     server/ \
     carddata.csv
   
   # Transfer to server
   scp monopoly-deal.tar.gz user@server:/var/www/
   ```

2. **Extract and Build**
   ```bash
   # On server
   cd /var/www
   tar -xzf monopoly-deal.tar.gz
   cd monopoly-deal
   
   npm install
   npm run build --workspace=shared
   npm run build --workspace=server
   ```

3. **Start Server**
   ```bash
   cd server
   NODE_ENV=production node dist/index.js
   ```

### Client Deployment

1. **Build Locally**
   ```bash
   npm run build --workspace=client
   ```

2. **Transfer to Server**
   ```bash
   scp -r client/dist/* user@server:/var/www/html/
   ```

3. **Configure Web Server**
   - Serve `client/dist` as static files
   - Configure reverse proxy for `/socket.io/` to server

---

## Health Checks

### Server Health Endpoint

The server exposes a health check endpoint:

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-02T17:00:00.000Z",
  "uptime": 3600,
  "connectedPlayers": 3
}
```

### Monitoring Script

Create `scripts/health-check.sh`:

```bash
#!/bin/bash

HEALTH_URL="http://localhost:3001/health"
MAX_RETRIES=3
RETRY_DELAY=5

for i in $(seq 1 $MAX_RETRIES); do
  if curl -f -s "$HEALTH_URL" > /dev/null; then
    echo "✓ Server is healthy"
    exit 0
  fi
  
  echo "✗ Health check failed (attempt $i/$MAX_RETRIES)"
  
  if [ $i -lt $MAX_RETRIES ]; then
    sleep $RETRY_DELAY
  fi
done

echo "✗ Server is unhealthy after $MAX_RETRIES attempts"
exit 1
```

### Automated Health Checks

Add to crontab for periodic checks:

```bash
# Check every 5 minutes
*/5 * * * * /path/to/scripts/health-check.sh || systemctl restart monopoly-deal
```

---

## Monitoring

### Log Management

#### PM2 Logs
```bash
# View logs
pm2 logs monopoly-deal-server

# Save logs to file
pm2 logs monopoly-deal-server --out /var/log/monopoly-deal/out.log --error /var/log/monopoly-deal/error.log
```

#### systemd Logs
```bash
# View logs
journalctl -u monopoly-deal -f

# View last 100 lines
journalctl -u monopoly-deal -n 100
```

### Performance Monitoring

#### Server Metrics

Add to `server/src/index.ts`:

```typescript
// Log metrics every minute
setInterval(() => {
  const memUsage = process.memoryUsage();
  console.info('Metrics:', {
    uptime: process.uptime(),
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
    },
    connectedPlayers: connectedPlayers.size,
  });
}, 60000);
```

### Error Tracking

Consider integrating error tracking services:
- Sentry
- Rollbar
- LogRocket

---

## Security Checklist

### Pre-Deployment

- [ ] Update all dependencies (`npm audit fix`)
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS with specific origins
- [ ] Use HTTPS in production
- [ ] Set secure Socket.IO configuration
- [ ] Remove development dependencies
- [ ] Disable source maps in production
- [ ] Set up firewall rules
- [ ] Configure rate limiting (future enhancement)
- [ ] Enable security headers (Helmet.js)

### Post-Deployment

- [ ] Test health check endpoint
- [ ] Verify CORS configuration
- [ ] Test Socket.IO connection
- [ ] Monitor logs for errors
- [ ] Set up automated backups
- [ ] Configure monitoring alerts
- [ ] Document deployment process
- [ ] Create rollback plan

---

## Troubleshooting

### Server Won't Start

1. **Check logs**
   ```bash
   pm2 logs monopoly-deal-server --lines 50
   ```

2. **Verify environment variables**
   ```bash
   cat .env
   ```

3. **Check port availability**
   ```bash
   lsof -i :3001
   ```

### Client Can't Connect

1. **Verify server is running**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check CORS configuration**
   - Ensure client origin is in `CORS_ORIGIN`

3. **Verify Socket.IO path**
   - Client and server must use same path

### High Memory Usage

1. **Check for memory leaks**
   ```bash
   node --inspect server/dist/index.js
   ```

2. **Monitor with PM2**
   ```bash
   pm2 monit
   ```

3. **Restart if needed**
   ```bash
   pm2 restart monopoly-deal-server
   ```

---

## Rollback Procedure

### Quick Rollback

1. **Stop current version**
   ```bash
   pm2 stop monopoly-deal-server
   ```

2. **Switch to previous version**
   ```bash
   cd /var/www/monopoly-deal
   git checkout <previous-commit>
   npm install
   npm run build --workspace=shared
   npm run build --workspace=server
   ```

3. **Restart**
   ```bash
   pm2 restart monopoly-deal-server
   ```

### Docker Rollback

```bash
# Stop current containers
docker-compose down

# Checkout previous version
git checkout <previous-commit>

# Rebuild and start
docker-compose up -d --build
```

---

## Backup Strategy

### What to Backup

- Source code (use Git)
- Environment configuration (`.env`)
- Game state (if persistence added)
- Logs (for debugging)

### Automated Backup Script

```bash
#!/bin/bash

BACKUP_DIR="/backups/monopoly-deal"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup configuration
cp .env "$BACKUP_DIR/env_$DATE"

# Backup logs
tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" /var/log/monopoly-deal/

# Keep only last 7 days of backups
find "$BACKUP_DIR" -mtime +7 -delete

echo "Backup completed: $DATE"
```

---

## Performance Optimization

### Server Optimizations

1. **Enable compression**
   ```typescript
   import compression from 'compression';
   app.use(compression());
   ```

2. **Use clustering** (future enhancement)
   ```typescript
   import cluster from 'cluster';
   import os from 'os';
   
   if (cluster.isPrimary) {
     const numCPUs = os.cpus().length;
     for (let i = 0; i < numCPUs; i++) {
       cluster.fork();
     }
   } else {
     // Start server
   }
   ```

3. **Configure Socket.IO for production**
   ```typescript
   const io = new Server(server, {
     transports: ['websocket', 'polling'],
     pingTimeout: 60000,
     pingInterval: 25000,
   });
   ```

### Client Optimizations

1. **Enable Vite build optimizations**
   - Already configured in `vite.config.ts`

2. **Use CDN for static assets** (optional)

3. **Enable browser caching**
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

---

## Support

For deployment issues:
1. Check server logs
2. Verify environment configuration
3. Test health check endpoint
4. Review SETUP.md for common issues
5. Check ARCHITECTURE.md for system design

---

*Made with Bob*