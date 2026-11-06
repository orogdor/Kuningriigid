#!/usr/bin/env bash
set -euo pipefail
mkdir -p native/dist
adb install -t native/android/app/build/outputs/apk/debug/app-debug.apk
adb shell cmd connectivity airplane-mode enable
adb logcat -c
adb shell am start -W -n ee.kuningriigid.webapp/.MainActivity
ready=0
for attempt in $(seq 1 90); do
  adb logcat -d -s KuningriigidNative:I AndroidRuntime:E > native/dist/android-smoke.log
  if rg -q 'GAME_READY https://appassets.androidplatform.net/game/' native/dist/android-smoke.log; then ready=1; break; fi
  if rg -q 'FATAL EXCEPTION' native/dist/android-smoke.log; then break; fi
  sleep 2
done
adb exec-out screencap -p > native/dist/android-game.png
cat native/dist/android-smoke.log
if [ "$ready" -ne 1 ]; then echo 'Android bundled game did not become ready offline'; exit 1; fi
if rg -q 'FATAL EXCEPTION| E KuningriigidNative:' native/dist/android-smoke.log; then echo 'Android game reported an error'; exit 1; fi
adb shell am force-stop ee.kuningriigid.webapp
adb shell am start -W -n ee.kuningriigid.webapp/.MainActivity
