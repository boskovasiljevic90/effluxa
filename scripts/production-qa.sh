#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "================================================"
echo " EFFLUXA PRODUCTION QA RUNNER"
echo "================================================"
echo

if [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  export QA_CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif [ -x "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary" ]; then
  export QA_CHROME_PATH="/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
elif [ -x "/Applications/Chromium.app/Contents/MacOS/Chromium" ]; then
  export QA_CHROME_PATH="/Applications/Chromium.app/Contents/MacOS/Chromium"
else
  echo "❌ Google Chrome ili Chromium nije pronađen."
  exit 1
fi

export QA_BASE_URL="${QA_BASE_URL:-https://www.effluxa.com}"

printf "FREE/Business test email [boskovasiljevic90@gmail.com]: "
read -r QA_USER_EMAIL
export QA_USER_EMAIL="${QA_USER_EMAIL:-boskovasiljevic90@gmail.com}"

printf "Lozinka test naloga (skrivena, Enter za preskakanje auth testova): "
read -rs QA_USER_PASSWORD
echo
export QA_USER_PASSWORD

echo
printf "Admin email [support@effluxa.com]: "
read -r QA_ADMIN_EMAIL
export QA_ADMIN_EMAIL="${QA_ADMIN_EMAIL:-support@effluxa.com}"

printf "Admin lozinka (skrivena, Enter za preskakanje admin login testa): "
read -rs QA_ADMIN_PASSWORD
echo
export QA_ADMIN_PASSWORD

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
export QA_REPORT_DIR="$PROJECT_DIR/production-qa-reports/$TIMESTAMP"

mkdir -p "$QA_REPORT_DIR"

echo
echo "Base URL: $QA_BASE_URL"
echo "Chrome: $QA_CHROME_PATH"
echo "Reports: $QA_REPORT_DIR"
echo

node scripts/production-qa.mjs
STATUS=$?

unset QA_USER_PASSWORD
unset QA_ADMIN_PASSWORD

echo
echo "================================================"

if [ "$STATUS" -eq 0 ]; then
  echo "✅ Production QA završen bez kritičnih grešaka."
else
  echo "⚠️ Production QA je pronašao jednu ili više grešaka."
fi

echo "📁 Izveštaji: $QA_REPORT_DIR"

open "$QA_REPORT_DIR/report.html"

exit "$STATUS"
