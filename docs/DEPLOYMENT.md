# Deployment reference (P9)

**Full guide:** [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md)

## Live deployment

| Item | Value |
| --- | --- |
| **Public URL** | https://d3o8eouup6tfum.cloudfront.net |
| **CloudFront ID** | `E2IN0MM5VIJBJX` |
| **EC2** | `i-0ca98acd2039b0b2a` |
| **Deployed image** | `ghcr.io/ansabkhansk/dsa-sheet-api:9488ac986f198d4b4fb91d34a73a1e9a34b5d9a9` |
| **Budget** | `dsa-sheet-budget` (Active, alert configured) |
| **P9 status** | **Completed** (`2026-10-31`, owner-revised acceptance scope) |

## Architecture

| Piece | Role |
| --- | --- |
| **Public URL** | `https://….cloudfront.net` |
| **Website** | S3 + CloudFront + SPA Function (`infra/cloudfront-spa-rewrite.js`) |
| **API** | CloudFront `/api*` → EC2 `:80` → `infra/nginx.conf` → api1/api2 |
| **Compose** | `infra/docker-compose.prod.yml` |
| **DB** | MongoDB Atlas M0 |
| **Secrets** | SSM `/dsa-sheet/*` → `/etc/dsa-sheet/api.env` |
| **CI/CD** | `ci.yml` + `deploy.yml` (OIDC) |

**No Elastic IP** in this deploy: use instance public IP (Atlas) and public DNS (CloudFront origin). After Stop/Start, update both. Prefer Reboot.

`infra/nginx.conf` does **not** serve the SPA. UI is only on CloudFront/S3.

## Workflows

| Workflow | Role |
| --- | --- |
| `ci.yml` | Lint / test / build / Docker assert |
| `deploy.yml` | GHCR + gated AWS deploy; `image_tag` input supports rollback |

## Secrets

Never commit `.env` or real `api.env`. Prefer SSM for production. GitHub Actions uses OIDC (no long-lived AWS access keys in the workflow).

## Teardown checklist

1. Disable `DEPLOY_AWS_ENABLED`; cancel in-flight deploys.  
2. Empty + delete SPA S3 bucket; disable then delete CloudFront distribution.  
3. Terminate EC2; delete unused volumes.  
4. Delete SSM parameters under `/dsa-sheet/`.  
5. Remove optional CloudWatch alarms/log groups if created.  
6. Pause/delete Atlas if unused.  
7. Confirm Budget shows no unexpected spend.
