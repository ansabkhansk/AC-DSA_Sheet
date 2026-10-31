# Deployment reference (P9)

**Full guide:** [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md)

## What you deploy (one architecture)

| Piece | Role |
| --- | --- |
| **Public URL** | `https://xxxx.cloudfront.net` (free HTTPS, no custom domain) |
| **Website** | S3 + CloudFront + SPA Function (`infra/cloudfront-spa-rewrite.js`) |
| **API** | CloudFront `/api*` → EC2 `:80` → `infra/nginx.conf` → api1/api2 |
| **Compose** | `infra/docker-compose.prod.yml` |
| **DB** | MongoDB Atlas M0 |
| **Secrets** | SSM `/dsa-sheet/*` → `/etc/dsa-sheet/api.env` |
| **CI/CD** | `ci.yml` + `deploy.yml` (GHCR always; AWS gated via OIDC) |

**Constraint used here: no Elastic IP.** Use the instance public IP (Atlas) and public DNS (CloudFront origin). After **Stop/Start**, update both. Prefer **Reboot**.

`infra/nginx.conf` does **not** serve the SPA (`/` is JSON 404). The UI is only on CloudFront/S3.

Auth cookies need HTTPS + `COOKIE_SECURE=true` + `CORS_ORIGIN=https://xxxx.cloudfront.net` (same origin via CloudFront).

## Cost (verify for your account)

| Resource | Notes |
| --- | --- |
| EC2 micro | May bill after free tier/credits |
| Public IPv4 (no EIP) | Still billed while the instance is running; no separate EIP |
| Atlas M0 | Typically free |
| Redis on Docker | Free on the host |
| S3 / CloudFront | Usually cheap/free at demo traffic |
| Domain | Not required |
| ALB / NAT / ElastiCache | Avoid |

## Workflows

| Workflow | Role |
| --- | --- |
| `ci.yml` | Lint / test / build / Docker assert |
| `deploy.yml` | GHCR + gated AWS (S3 / CloudFront / SSM) |

Do not enable `DEPLOY_AWS_ENABLED` without a Budget alert.

## Secrets

Never commit `.env`, `infra/certs/*`, or real `api.env`. Prefer SSM for production.

## Leftover EC2+domain files

Ignore unless CloudFront is unavailable: `infra/docker-compose.ec2.yml`, `infra/nginx.ec2.conf`, `deploy-ec2-path-a.yml`. See guide appendix.
