# Hostinger VPS deployment (gencl11)

Deploy as **gencl11** alongside existing Docker projects under `/docker` (PFS, gen_cl, TMS, MRD, etc.) **without touching any existing MongoDB data**.

## What stays untouched

| Existing on your VPS | gencl11 uses instead |
|----------------------|----------------------|
| `pfs_mongo`, `gen_cl_mongo`, `mrd-mongodb`, … | New container `gencl11_mongo` + volume `gencl11_mongo_data` |
| Host port `27017` (MRD) | Mongo **not** published to host |
| Ports `8090`–`8093`, `5010`–`5015`, … | New ports `8094` (web) + `5016` (API) |

All data lives in **dedicated Docker volumes** prefixed `gencl11_*`.

## Port map (default)

| Service | Container | Host port |
|---------|-----------|-----------|
| Web (nginx + React) | `gencl11_frontend` | **8094** |
| API | `gencl11_backend` | **5016** |
| MongoDB | `gencl11_mongo` | internal only |

No Redis container — the API uses in-memory cache and token storage.

If `8094` or `5016` is already taken, edit `docker-compose.hostinger.yml` before starting.

## Step-by-step on the VPS

### 1. Upload the project (do not overwrite other folders)

```bash
cd /docker
mkdir -p gencl11
# From your laptop — example:
# rsync -avz --exclude node_modules ./skill_venture/ root@YOUR_VPS:/docker/gencl11/
```

Or clone from Git:

```bash
cd /docker
git clone <your-repo-url> gencl11
cd gencl11
```

### 2. Configure environment

```bash
cd /docker/gencl11
cp .env.hostinger.example .env
nano .env
```

Required edits:

- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — at least 32 random characters each
- `CLIENT_URL` — public URL, e.g. `http://YOUR_SERVER_IP:8094` or your domain
- `COOKIE_SECURE=true` only if you serve over HTTPS

### 3. Build and start (only gencl11 stack)

```bash
cd /docker/gencl11
docker compose -f docker-compose.hostinger.yml up -d --build
```

Verify:

```bash
docker ps --filter name=gencl11
curl http://127.0.0.1:5016/health
curl http://127.0.0.1:8094/health
```

Open in browser: `http://YOUR_SERVER_IP:8094`

### 4. Seed demo accounts (optional, first deploy only)

```bash
docker exec -it gencl11_backend sh -c \
  "npm run seed:admin -w @skillventures/server && \
   npm run seed:super-admin -w @skillventures/server && \
   npm run seed:student -w @skillventures/server"
```

Demo logins are in the root `README.md`.

## Updates (redeploy without data loss)

```bash
cd /docker/gencl11
git pull   # or rsync new code
docker compose -f docker-compose.hostinger.yml up -d --build
```

Mongo/upload volumes are preserved across rebuilds.

## HTTPS with Certbot (host nginx → Docker :8094)

Certbot on the VPS is the usual setup. The Docker stack stays on **8094**; host nginx on **80/443** terminates SSL and proxies to it.

**Requirements**

- A **domain name** (e.g. `gencl11.yourdomain.com`) — Let's Encrypt cannot issue certs for `194.238.22.210` alone
- DNS **A record** → `194.238.22.210`
- Host **nginx** + **certbot** installed (`certbot --version`)

### 1. DNS

In Hostinger (or your DNS provider):

| Type | Name | Value |
|------|------|-------|
| A | `gencl11` (or subdomain you choose) | `194.238.22.210` |

Wait a few minutes, then check:

```bash
dig +short gencl11.yourdomain.com
# should print 194.238.22.210
```

### 2. Host nginx site (HTTP first)

Edit `deploy/host-nginx-gencl11.conf` — replace `gencl11.yourdomain.com` with your real domain, then on the VPS:

```bash
cd /docker/gen_cl11
sudo cp deploy/host-nginx-gencl11.conf /etc/nginx/sites-available/gencl11
# edit server_name if needed:
sudo nano /etc/nginx/sites-available/gencl11

sudo ln -sf /etc/nginx/sites-available/gencl11 /etc/nginx/sites-enabled/gencl11
sudo nginx -t
sudo systemctl reload nginx
```

Confirm HTTP works (before SSL):

```bash
curl -I http://gencl11.yourdomain.com
# should return 200 from your app
```

### 3. Run Certbot

```bash
sudo certbot --nginx -d gencl11.yourdomain.com
```

Certbot will:

- Obtain the Let's Encrypt certificate
- Add the `listen 443 ssl` block to your nginx site
- Set up HTTP → HTTPS redirect
- Configure auto-renewal (usually via systemd timer)

Test renewal:

```bash
sudo certbot renew --dry-run
```

### 4. Update app env for HTTPS

```bash
cd /docker/gen_cl11
nano .env
```

```env
CLIENT_URL=https://gencl11.yourdomain.com
COOKIE_SECURE=true
```

Restart:

```bash
docker compose -f docker-compose.hostinger.yml up -d --build frontend backend
```

Open: **https://gencl11.yourdomain.com**

### Notes

- Users should use the **https domain URL**, not `http://194.238.22.210:8094`, after SSL is live.
- Port **8094** can stay internal-only once nginx handles public traffic on 443.
- If port **80** is already used by host nginx for other sites, add the `gencl11` server block to the existing nginx — do not start a second nginx on 80.
- If certbot fails, check: DNS propagated, firewall allows 80/443, `gencl11_frontend` container is up (`docker ps --filter name=gencl11`).

## Safety checklist before `docker compose up`

- [ ] You are in `/docker/gencl11`, not another project folder
- [ ] `docker ps` shows existing apps still running — you are **adding** containers, not replacing
- [ ] You used `docker-compose.hostinger.yml`, not another project's compose file
- [ ] No `docker volume rm` on volumes you do not own
- [ ] Ports `8094` and `5016` are free: `ss -tlnp | grep -E '8094|5016'`

## Troubleshooting

**Backend won't start — env validation**

```bash
docker logs gencl11_backend
```

Fix missing/short secrets in `.env`, then:

```bash
docker compose -f docker-compose.hostinger.yml up -d backend
```

**Frontend loads but login fails**

- `CLIENT_URL` in `.env` must exactly match the browser URL (scheme + host + port)
- Restart backend after changing `.env`

**Check Mongo is isolated**

```bash
docker volume ls | grep gencl11
# gencl11_mongo_data — only gencl11 data
```
