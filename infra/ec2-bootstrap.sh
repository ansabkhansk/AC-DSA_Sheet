#!/usr/bin/env bash
# One-time EC2 user-data / bootstrap for the demo host (t3.micro / t2.micro).
# Run as root via SSM Session Manager. Does not create AWS resources itself.
# Review docs/DEPLOYMENT.md before applying. Requires explicit approval to launch EC2.
set -euo pipefail

SWAP_FILE=/swapfile
APP_DIR=/opt/dsa-sheet
ENV_DIR=/etc/dsa-sheet
ENV_FILE="${ENV_DIR}/api.env"
SSM_PREFIX="${SSM_PREFIX:-/dsa-sheet}"

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y docker.io docker-compose-v2 curl unzip jq amazon-ssm-agent
systemctl enable --now docker amazon-ssm-agent
usermod -aG docker ubuntu || true

# 2 GB swap — required on 1 GB micro instances (P9 acceptance).
if [[ ! -f "${SWAP_FILE}" ]]; then
  fallocate -l 2G "${SWAP_FILE}" || dd if=/dev/zero of="${SWAP_FILE}" bs=1M count=2048
  chmod 600 "${SWAP_FILE}"
  mkswap "${SWAP_FILE}"
  swapon "${SWAP_FILE}"
  echo "${SWAP_FILE} none swap sw 0 0" >> /etc/fstab
fi

mkdir -p "${APP_DIR}" "${ENV_DIR}"
chmod 750 "${ENV_DIR}"

# Pull production env from SSM Parameter Store (instance role). Secrets never live in git.
umask 077
: > "${ENV_FILE}"
for name in \
  NODE_ENV PORT MONGO_URI MONGO_POOL_SIZE REDIS_ENABLED REDIS_URL \
  JWT_ACCESS_SECRET COOKIE_SECURE CORS_ORIGIN LOG_LEVEL \
  RATE_LIMIT_WINDOW_MS RATE_LIMIT_API_MAX RATE_LIMIT_AUTH_MAX SHEET_CACHE_TTL_SECONDS
do
  value="$(aws ssm get-parameter --name "${SSM_PREFIX}/${name}" --with-decryption --query 'Parameter.Value' --output text)"
  printf '%s=%s\n' "${name}" "${value}" >> "${ENV_FILE}"
done
chmod 600 "${ENV_FILE}"

echo "Bootstrap complete. Clone or sync the repo into ${APP_DIR}, set IMAGE_TAG, then:"
echo "  docker compose -f infra/docker-compose.prod.yml --env-file ${ENV_FILE} up -d"
