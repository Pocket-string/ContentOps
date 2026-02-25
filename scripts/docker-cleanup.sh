#!/usr/bin/env bash
# =============================================================================
# docker-cleanup.sh — Automated Docker disk cleanup for Dokploy VPS
#
# Purpose: Prevent unbounded disk growth from Docker build cache, old images,
#          and orphan volumes. Safe to run on a schedule (cron) or manually.
#
# Usage:
#   chmod +x scripts/docker-cleanup.sh
#   ./scripts/docker-cleanup.sh          # Normal cleanup
#   ./scripts/docker-cleanup.sh --force  # Aggressive cleanup (all unused)
#
# Recommended cron (daily at 3 AM):
#   0 3 * * * /path/to/scripts/docker-cleanup.sh >> /var/log/docker-cleanup.log 2>&1
# =============================================================================

set -euo pipefail

FORCE="${1:-}"
LOG_PREFIX="[docker-cleanup $(date '+%Y-%m-%d %H:%M:%S')]"

echo "$LOG_PREFIX Starting cleanup..."

# 1. Show current disk usage
echo "$LOG_PREFIX === Before cleanup ==="
df -h / | tail -1
docker system df 2>/dev/null || true

# 2. Remove stopped containers (safe — they're already stopped)
echo "$LOG_PREFIX Pruning stopped containers..."
docker container prune -f 2>/dev/null || true

# 3. Remove dangling images (untagged, not used by any container)
echo "$LOG_PREFIX Pruning dangling images..."
docker image prune -f 2>/dev/null || true

# 4. Remove build cache older than 24h
echo "$LOG_PREFIX Pruning build cache (>24h)..."
docker builder prune -f --filter "until=24h" 2>/dev/null || true

# 5. Remove orphan volumes (not attached to any container)
echo "$LOG_PREFIX Pruning orphan volumes..."
docker volume prune -f 2>/dev/null || true

# 6. If --force: remove ALL unused images (not just dangling)
if [ "$FORCE" = "--force" ]; then
  echo "$LOG_PREFIX [FORCE] Removing all unused images..."
  docker image prune -a -f 2>/dev/null || true
  echo "$LOG_PREFIX [FORCE] Removing all build cache..."
  docker builder prune -a -f 2>/dev/null || true
fi

# 7. Truncate large container logs (>50MB) — safe, just rotates
echo "$LOG_PREFIX Truncating large container logs..."
for logfile in /var/lib/docker/containers/*/*-json.log; do
  if [ -f "$logfile" ]; then
    size=$(stat -f%z "$logfile" 2>/dev/null || stat -c%s "$logfile" 2>/dev/null || echo 0)
    if [ "$size" -gt 52428800 ]; then
      echo "$LOG_PREFIX Truncating $logfile ($(numfmt --to=iec "$size" 2>/dev/null || echo "${size}B"))"
      truncate -s 0 "$logfile"
    fi
  fi
done 2>/dev/null || true

# 8. Show results
echo "$LOG_PREFIX === After cleanup ==="
df -h / | tail -1
docker system df 2>/dev/null || true

echo "$LOG_PREFIX Cleanup complete."
