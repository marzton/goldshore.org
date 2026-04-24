#!/usr/bin/env bash
set -u

HOSTS=(
  "https://gw.goldshore.ai/health"
  "https://api.goldshore.ai/health"
  "https://agent.goldshore.ai/health"
)

echo "== HTTP health checks =="
for url in "${HOSTS[@]}"; do
  echo "-- $url"
  headers="$(curl -sS -I --max-time 15 "$url")"
  curl_status=$?
  if [ "$curl_status" -ne 0 ]; then
    echo "WARN: HTTP check failed for $url"
  else
    printf "%s\n" "$headers" | head -n 1
  fi
  echo
 done

echo "== DNS TXT checks (goldshore.org) =="
nslookup -type=TXT goldshore.org || echo "WARN: TXT query failed for goldshore.org"
nslookup -type=TXT _dmarc.goldshore.org || echo "WARN: TXT query failed for _dmarc.goldshore.org"

echo "== DNS MX checks (armsway.com) =="
nslookup -type=MX armsway.com || echo "WARN: MX query failed for armsway.com"
