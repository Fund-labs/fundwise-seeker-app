#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ADB="${ADB:-/Users/sarthiborkar/Library/Android/sdk/platform-tools/adb}"
ADB_SERIAL="${ADB_SERIAL:-}"
PACKAGE_NAME="${PACKAGE_NAME:-fun.fundwise.seeker}"
ACTIVITY_NAME="${ACTIVITY_NAME:-fun.fundwise.seeker/.MainActivity}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="${OUT_DIR:-$ROOT_DIR/qa-evidence/$STAMP}"
APK_PATH="${1:-}"
DEVICE_WINDOW_XML="/data/local/tmp/fundwise-window.xml"

mkdir -p "$OUT_DIR"
"$ADB" devices > "$OUT_DIR/devices.txt"

if [ -n "$ADB_SERIAL" ]; then
  ADB_CMD=("$ADB" -s "$ADB_SERIAL")
  if ! "${ADB_CMD[@]}" get-state >/dev/null 2>&1; then
    echo "ADB serial '$ADB_SERIAL' is not connected. See $OUT_DIR/devices.txt." >&2
    exit 2
  fi
else
  DEVICE_COUNT="$(awk 'NR > 1 && $2 == "device" { count++ } END { print count + 0 }' "$OUT_DIR/devices.txt")"
  if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo "No connected Android device. Connect Seeker with USB debugging enabled, then rerun this script." >&2
    cat "$OUT_DIR/devices.txt" >&2
    exit 2
  fi
  if [ "$DEVICE_COUNT" -gt 1 ]; then
    echo "Multiple Android devices are connected. Set ADB_SERIAL=<serial> and rerun this script." >&2
    cat "$OUT_DIR/devices.txt" >&2
    exit 2
  fi
  ADB_CMD=("$ADB")
fi

if [ -n "$APK_PATH" ]; then
  "${ADB_CMD[@]}" install -r "$APK_PATH" | tee "$OUT_DIR/install.txt"
fi

"${ADB_CMD[@]}" logcat -c
"${ADB_CMD[@]}" shell dumpsys gfxinfo "$PACKAGE_NAME" reset > "$OUT_DIR/gfxinfo-before-reset.txt" || true
"${ADB_CMD[@]}" shell am force-stop "$PACKAGE_NAME" || true
"${ADB_CMD[@]}" shell am start -W -n "$ACTIVITY_NAME" | tee "$OUT_DIR/launch.txt"
sleep 3

"${ADB_CMD[@]}" exec-out screencap -p > "$OUT_DIR/home.png"
"${ADB_CMD[@]}" shell uiautomator dump "$DEVICE_WINDOW_XML" >/dev/null
"${ADB_CMD[@]}" exec-out cat "$DEVICE_WINDOW_XML" > "$OUT_DIR/window.xml"
"${ADB_CMD[@]}" shell rm -f "$DEVICE_WINDOW_XML" >/dev/null 2>&1 || true
"${ADB_CMD[@]}" shell dumpsys gfxinfo "$PACKAGE_NAME" > "$OUT_DIR/gfxinfo.txt"
"${ADB_CMD[@]}" logcat -d -v time -t 1200 \
  AndroidRuntime:E ReactNativeJS:E ReactNative:E Expo:E \
  InputDispatcher:W WindowManager:W Choreographer:I HWUI:I \
  "$PACKAGE_NAME":D '*:S' > "$OUT_DIR/logcat-filtered.txt"

cat > "$OUT_DIR/summary.txt" <<EOF
Package: $PACKAGE_NAME
Activity: $ACTIVITY_NAME
Evidence: $OUT_DIR
APK: ${APK_PATH:-already-installed}

Review:
- launch.txt
- home.png
- window.xml
- gfxinfo.txt
- logcat-filtered.txt
EOF

echo "Seeker QA evidence written to $OUT_DIR"
