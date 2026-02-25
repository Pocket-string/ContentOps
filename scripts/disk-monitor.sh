#!/usr/bin/env bash
# =============================================================================
# disk-monitor.sh — Disk usage monitor with threshold alert
#
# Purpose: Check disk usage and report top consumers. Exits with code 1 if
#          usage exceeds threshold, allowing integration with cron + alerting.
#
# Usage:
#   ./scripts/disk-monitor.sh              # Default 80% threshold
#   ./scripts/disk-monitor.sh 70           # Custom threshold
#
# Cron example (every 6h, alert via webhook if over threshold):
#   0 */6 * * * /path/to/scripts/disk-monitor.sh 80 || curl -s -X POST "YOUR_WEBHOOK_URL" -d '{"text":"DISK ALERT: VPS over 80%"}'
# =============================================================================

set -euo pipefail

THRESHOLD="${1:-80}"

echo "=== Disk Monitor Report — $(date '+%Y-%m-%d %H:%M:%S') ==="
echo ""

# 1. Overall disk usage
echo "--- Filesystem ---"
df -h / | tail -1
echo ""

# 2. Check threshold
USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$USAGE" -ge "$THRESHOLD" ]; then
  echo "WARNING: Disk usage ${USAGE}% exceeds threshold ${THRESHOLD}%"
  ALERT=1
else
  echo "OK: Disk usage ${USAGE}% (threshold: ${THRESHOLD}%)"
  ALERT=0
fi
echo ""

# 3. Docker breakdown
echo "--- Docker Disk Usage ---"
docker system df 2>/dev/null || echo "(docker not available)"
echo ""

# 4. Top directories
echo "--- Top directories under /var/lib/docker (top 10) ---"
du -h --max-depth=2 /var/lib/docker 2>/dev/null | sort -hr | head -10 || echo "(not accessible)"
echo ""

echo "--- Top directories under /opt (top 5) ---"
du -h --max-depth=2 /opt 2>/dev/null | sort -hr | head -5 || echo "(not accessible)"
echo ""

# 5. Large files (>200MB)
echo "--- Files > 200MB ---"
find / -xdev -type f -size +200M -printf "%s %p\n" 2>/dev/null | sort -nr | head -10 | while read size path; do
  echo "$(numfmt --to=iec "$size" 2>/dev/null || echo "${size}B") $path"
done || echo "(not accessible)"
echo ""

# 6. Container log sizes
echo "--- Container log sizes ---"
for logfile in /var/lib/docker/containers/*/*-json.log; do
  if [ -f "$logfile" ]; then
    ls -lh "$logfile" 2>/dev/null
  fi
done 2>/dev/null | sort -k5 -hr | head -5 || echo "(no logs found)"
echo ""

exit $ALERT
