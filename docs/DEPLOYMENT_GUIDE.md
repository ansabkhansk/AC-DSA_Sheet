# DSA Sheet — Deployment Guide

One way to ship this app on AWS with a **public HTTPS link**.

**Short reference:** [`DEPLOYMENT.md`](./DEPLOYMENT.md) · Plan: `PROJECT_PLAN.md` §9

---

## In plain terms

| Piece | What it does |
| --- | --- |
| **S3** | Stores the React website files |
| **CloudFront** | Gives you `https://….cloudfront.net` (free HTTPS, no custom domain) and sends `/api` to your server |
| **EC2** | Small Ubuntu box running the API (Docker: two API copies + Redis + Nginx) |
| **Atlas** | MongoDB in the cloud |
| **GitHub Actions** | Builds the API image, uploads the website, restarts the API (after you wire OIDC once) |

**You do not need:** a custom domain, Let's Encrypt, or an **Elastic IP**.

**Your only special rule — no Elastic IP:**

- EC2 gets a **public IP** and a **public DNS name** (`ec2-….amazonaws.com`).
- Put that IP in Atlas allowlist.
- Put that DNS name in CloudFront as the API origin.
- If you **Stop** then **Start** the instance, both change → update Atlas **and** CloudFront. Prefer **Reboot** (keeps the same address). Keep the instance running during the demo.

---

## Step labels

| Label | Meaning |
| --- | --- |
| **MUST DO** | Needed for a working deploy |
| **SECURITY REQUIRED** | Do before the app is public |
| **OPTIONAL** | Nice later; skip for first success |

---

## 0. Readiness

| # | Item |
| --- | --- |
| 1 | AWS active (EC2, S3, CloudFront, IAM, SSM) — prefer region **ap-south-1** |
| 2 | AWS **Budget** + low email alert |
| 3 | MongoDB Atlas **M0** + user + database `dsa-sheet` |
| 4 | GitHub repo + Actions; GHCR can host images |
| 5 | **No Elastic IP** — use public IP/DNS; know the Stop/Start update rule above |

---

## 1. Checklist (do in order)

| Priority | What |
| --- | --- |
| **MUST DO** | Budget → Atlas → IAM role → security group → EC2 (public IP, no EIP) → Docker + swap → SSM secrets → GHCR image → compose up → S3 + CloudFront → set `CORS_ORIGIN` → lock SG → smoke test |
| **SECURITY REQUIRED** | `COOKIE_SECURE=true`; secrets in SSM; SG `:80` only from CloudFront prefix list; no public `:4000`/`:6379`; no SSH if possible (use SSM); Atlas = EC2 public IP `/32` only |
| **OPTIONAL** | Auto-deploy on every `main` push; custom domain; CloudWatch CPU alarm; Elastic IP (you are skipping this) |

**Deploy:** prefer GitHub Actions OIDC + `deploy.yml`. Manual S3 sync + SSM compose is the backup.

Do not set `DEPLOY_AWS_ENABLED=true` until Budget + AWS pieces below exist.

---

## 2. Budget — MUST DO

**Why:** Stop surprise bills.

Billing → Budgets → Create → low $ alert → your email.

**Done:** Budget Active.

---

## 3. Atlas — MUST DO

1. Create **M0** near your EC2 region.
2. DB user with read/write on `dsa-sheet`.
3. URI shape:

```text
mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/dsa-sheet?retryWrites=true&w=majority
```

4. Network Access: add **your home IP**, seed once:

```powershell
cd d:\Projects\AC-DSA_Sheet
# Put Atlas URI in root .env (from .env.example), then:
npm run seed
```

5. After EC2 exists (§6): allowlist **only the EC2 public IPv4 /32**. Remove home IP and `0.0.0.0/0`.

**Done:** Seed OK; Atlas locked to EC2 IP.

---

## 4. IAM role for EC2 — MUST DO / SECURITY REQUIRED

**Why:** Admin via Session Manager; read secrets from SSM (no AWS keys on the box).

IAM → Roles → EC2 trust → attach:

- `AmazonSSMManagedInstanceCore`
- Read access to parameters under `/dsa-sheet/*`

Name e.g. `dsa-sheet-ec2-role`. Tag `project=dsa-sheet`.

**Done:** Role can be chosen as instance profile.

---

## 5. Security group `dsa-sheet-ec2-sg` — MUST DO

| Port | Source | Notes |
| --- | --- | --- |
| 80 | Temporary: your IP or `0.0.0.0/0` | Tighten to CloudFront in §13 |
| 22 | None | Prefer SSM |
| 4000 | None | Never |
| 6379 | None | Never |
| 443 | None on EC2 | HTTPS is on CloudFront |

**Done:** SG created.

---

## 6. Launch EC2 — MUST DO (no Elastic IP)

1. Ubuntu 22.04/24.04, **t3.micro** or **t2.micro**, public subnet, **Auto-assign public IP = Yes**.
2. Attach SG + IAM instance profile above. Disk ≥8 GB. Tag `project=dsa-sheet`.
3. **Do not** allocate an Elastic IP.
4. Write down:
   - Instance ID → later `EC2_INSTANCE_ID`
   - **Public IPv4** → Atlas
   - **Public DNS** → CloudFront API origin (must be a hostname, not a raw IP)

**Done:** Instance running; SSM Fleet Manager shows **Online**.

---

## 7. Install Docker + swap + clone repo — MUST DO

Connect: EC2 → Connect → **Session Manager**.

```bash
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose-v2 curl unzip jq amazon-ssm-agent
sudo systemctl enable --now docker amazon-ssm-agent
sudo usermod -aG docker ubuntu || true

sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

sudo mkdir -p /opt/dsa-sheet /etc/dsa-sheet
sudo chmod 750 /etc/dsa-sheet
sudo git clone https://github.com/ORG/REPO.git /opt/dsa-sheet
```

After SSM params exist (§8):

```bash
sudo SSM_PREFIX=/dsa-sheet bash /opt/dsa-sheet/infra/ec2-bootstrap.sh
```

**Done:** Docker works; swap in `free -m`; code in `/opt/dsa-sheet`.

---

## 8. Secrets in SSM — MUST DO / SECURITY REQUIRED

**Why:** Never commit secrets. Bootstrap writes `/etc/dsa-sheet/api.env`.

Parameter Store → create (SecureString for secrets). Names match `infra/ec2-bootstrap.sh`:

| Name | Value |
| --- | --- |
| `/dsa-sheet/NODE_ENV` | `production` |
| `/dsa-sheet/PORT` | `4000` |
| `/dsa-sheet/MONGO_URI` | Atlas URI |
| `/dsa-sheet/MONGO_POOL_SIZE` | `50` |
| `/dsa-sheet/REDIS_ENABLED` | `true` |
| `/dsa-sheet/REDIS_URL` | `redis://redis:6379` |
| `/dsa-sheet/JWT_ACCESS_SECRET` | output of `openssl rand -hex 32` |
| `/dsa-sheet/COOKIE_SECURE` | `true` |
| `/dsa-sheet/CORS_ORIGIN` | placeholder until CloudFront exists, then `https://xxxx.cloudfront.net` |
| `/dsa-sheet/LOG_LEVEL` | `info` |
| `/dsa-sheet/RATE_LIMIT_WINDOW_MS` | `60000` |
| `/dsa-sheet/RATE_LIMIT_API_MAX` | `300` |
| `/dsa-sheet/RATE_LIMIT_AUTH_MAX` | `30` |
| `/dsa-sheet/SHEET_CACHE_TTL_SECONDS` | `3600` |

See `.env.production.example`.

```bash
sudo SSM_PREFIX=/dsa-sheet bash /opt/dsa-sheet/infra/ec2-bootstrap.sh
sudo chmod 600 /etc/dsa-sheet/api.env
```

**Done:** `api.env` mode `600`.

---

## 9. API Docker image (GHCR) — MUST DO

**Why:** EC2 only pulls images; it does not build them.

**Recommended:** push to `main` → workflow `deploy.yml` builds/pushes GHCR (AWS steps stay off until you enable them).

**Or local:**

```powershell
cd d:\Projects\AC-DSA_Sheet
docker login ghcr.io -u YOUR_GITHUB_USER
docker build -f infra/Dockerfile.api -t ghcr.io/YOUR_GITHUB_USER/dsa-sheet-api:latest .
docker push ghcr.io/YOUR_GITHUB_USER/dsa-sheet-api:latest
```

Package **public**, or `docker login` on EC2.

**Done:** EC2 can `docker pull` the image.

---

## 10. Start the API stack — MUST DO

Files: `infra/docker-compose.prod.yml` + `infra/nginx.conf` (API only; site `/` on EC2 is JSON 404 on purpose).

```bash
cd /opt/dsa-sheet
export GHCR_IMAGE=ghcr.io/YOUR_OWNER_LOWERCASE/dsa-sheet-api
export IMAGE_TAG=latest
export API_ENV_FILE=/etc/dsa-sheet/api.env
sudo -E docker compose -f infra/docker-compose.prod.yml pull
sudo -E docker compose -f infra/docker-compose.prod.yml up -d
sudo docker compose -f infra/docker-compose.prod.yml ps
curl -fsS http://127.0.0.1/health
```

**Done:** Containers healthy; local `/health` OK.

---

## 11. S3 website bucket — MUST DO

1. Create private bucket (block public access ON).
2. CloudFront → create **OAC**; attach bucket policy so only CloudFront can read.
3. Note bucket name → `S3_WEB_BUCKET`.

First upload (same as Actions):

```powershell
cd d:\Projects\AC-DSA_Sheet
npm ci
npm run build -w @dsa/shared
npm run build -w @dsa/web
aws s3 sync apps/web/dist "s3://YOUR_BUCKET/" --delete --cache-control "public,max-age=31536000,immutable" --exclude "index.html"
aws s3 cp apps/web/dist/index.html "s3://YOUR_BUCKET/index.html" --cache-control "no-cache" --content-type "text/html; charset=utf-8"
```

**Done:** Files in S3; bucket not public.

---

## 12. CloudFront — MUST DO

**Why:** This is your public HTTPS URL. No domain purchase.

### Function

CloudFront → Functions → paste `infra/cloudfront-spa-rewrite.js` → Publish.  
Attach only to **Default (*)** viewer-request. **Not** on `/api*`.

### Distribution

| Setting | Value |
| --- | --- |
| Origin 1 | S3 + OAC |
| Origin 2 | Custom = **EC2 public DNS**, HTTP port **80** |
| Default (*) | S3 + SPA Function; HTTPS to viewers |
| `/api*` | EC2 origin; **CachingDisabled**; forward cookies + query string |
| Custom domain | None — use default `*.cloudfront.net` |
| Custom errors 403/404 → index.html | **Do not** (breaks API JSON errors) |

**Done:** Deployed. Save:

- Distribution ID
- `https://xxxx.cloudfront.net` → this is `APP_URL` and `CORS_ORIGIN`

### Point the API at that URL — MUST DO

1. SSM `/dsa-sheet/CORS_ORIGIN` = `https://xxxx.cloudfront.net` (no slash at end).
2. Refresh env and recreate APIs:

```bash
cd /opt/dsa-sheet
sudo SSM_PREFIX=/dsa-sheet bash /opt/dsa-sheet/infra/ec2-bootstrap.sh
export GHCR_IMAGE=ghcr.io/YOUR_OWNER_LOWERCASE/dsa-sheet-api
export IMAGE_TAG=latest
export API_ENV_FILE=/etc/dsa-sheet/api.env
sudo -E docker compose -f infra/docker-compose.prod.yml up -d --force-recreate api1 api2
```

---

## 13. Lock the security group — SECURITY REQUIRED

VPC → Managed prefix lists → `com.amazonaws.global.cloudfront.origin-facing`.

Inbound **TCP 80** = that list only. Remove temporary open access.

**Done:** Internet cannot hit EC2:80 directly; CloudFront still can.

---

## 14. GitHub Actions OIDC — MUST DO for auto deploy

Workflow: `.github/workflows/deploy.yml`.

1. IAM OIDC provider: `https://token.actions.githubusercontent.com`, audience `sts.amazonaws.com`.
2. Deploy role trust: `repo:ORG/REPO:environment:production`.
3. Allow that role: S3 sync to web bucket, CloudFront invalidate, SSM SendCommand on the instance.
4. GitHub Environment `production`.
5. **Secret** `AWS_DEPLOY_ROLE_ARN`.
6. **Variables:**

| Variable | Example |
| --- | --- |
| `AWS_REGION` | `ap-south-1` |
| `S3_WEB_BUCKET` | your bucket |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E…` |
| `EC2_INSTANCE_ID` | `i-…` |
| `EC2_APP_DIR` | `/opt/dsa-sheet` (optional) |
| `APP_URL` | `https://xxxx.cloudfront.net` |
| `DEPLOY_AWS_ENABLED` | leave empty at first |

**Done:** Actions can assume the role.

---

## 15. First deploy — MUST DO

Actions → **Deploy** → Run workflow → **`deploy_aws` = true**.

Later (**OPTIONAL**): set `DEPLOY_AWS_ENABLED=true` so every `main` push deploys AWS.

**Manual backup:** §11 sync + invalidate `/index.html` + §10 compose on the box.

**Done:** Job green; site opens on CloudFront.

---

## 16. Smoke test

| # | Check |
| --- | --- |
| 1 | `https://xxxx.cloudfront.net/` shows the app |
| 2 | Refresh `/calendar` and `/sheet/...` still works |
| 3 | `/api/v1/auth/me` logged out → **401** JSON |
| 4 | Login → cookies marked **Secure** |
| 5 | Progress checkbox survives reload |
| 6 | Calendar works |
| 7 | Ports 4000/6379 closed from internet |
| 8 | On box: `curl http://127.0.0.1/health` OK |
| 9 | Reboot instance → stack comes back; note `free -m` |

**Your deliverable URL:** `https://xxxx.cloudfront.net`

---

## 17. Files and env (cheat sheet)

| Thing | Use this |
| --- | --- |
| Compose | `infra/docker-compose.prod.yml` |
| Nginx | `infra/nginx.conf` |
| SPA deep links | `infra/cloudfront-spa-rewrite.js` |
| Secrets bootstrap | `infra/ec2-bootstrap.sh` → `/etc/dsa-sheet/api.env` |
| `CORS_ORIGIN` | `https://xxxx.cloudfront.net` |
| `COOKIE_SECURE` | `true` |
| CI | `ci.yml` |
| Deploy | `deploy.yml` (GHCR always; AWS when gated on) |

---

## 18. Day-2 ops

```bash
cd /opt/dsa-sheet
docker compose -f infra/docker-compose.prod.yml logs -f --tail=200

export GHCR_IMAGE=ghcr.io/YOUR_OWNER_LOWERCASE/dsa-sheet-api
export IMAGE_TAG=<sha>
export API_ENV_FILE=/etc/dsa-sheet/api.env
docker compose -f infra/docker-compose.prod.yml pull
docker compose -f infra/docker-compose.prod.yml up -d
curl -fsS http://127.0.0.1/health
```

**After Stop/Start (no EIP):** new public IP → Atlas Network Access; new public DNS → CloudFront origin; wait for CF deploy.

---

## Security checklist

- [ ] HTTPS via CloudFront
- [ ] `COOKIE_SECURE=true`
- [ ] `CORS_ORIGIN` = exact CloudFront URL
- [ ] SG `:80` = CloudFront prefix list only; 4000/6379 closed; SSH closed
- [ ] Atlas = current EC2 public IP only
- [ ] Secrets in SSM; `api.env` mode 600
- [ ] Budget alert on
- [ ] No Elastic IP (by choice); know Stop/Start update steps

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| OIDC fails | Trust `sub` matches `environment: production`; check role ARN secret |
| SSM deploy fails | Instance Online; instance profile has SSM; correct instance ID |
| API 502 on CloudFront | Origin = **current** public DNS; SG allows CF; APIs healthy on box |
| Atlas timeout | Allowlist current public IP; update after Stop/Start |
| Cookies missing | HTTPS + `COOKIE_SECURE` + matching `CORS_ORIGIN` on same CF URL |
| SPA refresh 404 | Function on default behaviour only |
| CORS errors | Set `CORS_ORIGIN` to CF URL; recreate api1/api2 |
| EC2 `/` is JSON 404 | Normal — open the **CloudFront** URL |

---

## Shortest go-live

1. Budget alert.  
2. Atlas + seed.  
3. IAM role + SG.  
4. EC2 with **public IP only** (no EIP) + Docker + swap + clone.  
5. SSM secrets → `api.env`.  
6. GHCR image + `docker-compose.prod.yml` up.  
7. S3 + CloudFront (S3 + EC2 DNS).  
8. `CORS_ORIGIN` = CF URL; Atlas = EC2 IP; SG = CF prefix list.  
9. OIDC + run Deploy with `deploy_aws=true`.  
10. Smoke test; ship `https://xxxx.cloudfront.net`.

---

## Appendix — old EC2+domain files (ignore for this deploy)

Earlier we kept an alternate “all on one EC2 with a bought domain” option while CloudFront was blocked. **You do not need it now.**

Leftover files (do not use unless CF is unavailable again): `infra/docker-compose.ec2.yml`, `infra/nginx.ec2.conf`, `.github/workflows/deploy-ec2-path-a.yml`, `infra/web-dist/`, `infra/certs/`.
