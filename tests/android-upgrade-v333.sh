#!/usr/bin/env bash
set -euo pipefail
pkg=ee.kuningriigid.webapp
old=966841212bb96cfe3051bf19b3f9f48f8067bb85
new="$GITHUB_SHA"
mkdir -p native/dist
adb install -t native/android/app/build/outputs/apk/debug/app-debug.apk
adb shell cmd connectivity airplane-mode enable
adb logcat -c
adb shell am start -W -n "$pkg/.MainActivity"
wait_ready() {
  local version="$1"
  for i in $(seq 1 150); do
    adb logcat -d -s KuningriigidNative:I AndroidRuntime:E > native/dist/android-upgrade.log
    if grep -q "GAME_READY https://appassets.androidplatform.net/game/$version/" native/dist/android-upgrade.log; then return 0; fi
    if grep -q 'FATAL EXCEPTION' native/dist/android-upgrade.log; then cat native/dist/android-upgrade.log; return 1; fi
    sleep 2
  done
  cat native/dist/android-upgrade.log
  echo "Game did not become ready: $version"
  return 1
}
wait_ready "$old"
# Pausing invokes the installed application's normal save bridge.
adb shell input keyevent KEYCODE_HOME
sleep 20
adb shell am force-stop "$pkg"
mkdir -p /tmp/update-objects
node - <<'NODE'
const fs=require('fs'),path=require('path');
const old=JSON.parse(fs.readFileSync('native/android/app/src/main/assets/game/_bundle-manifest.json'));
const next=JSON.parse(fs.readFileSync('native/dist/manifest.json'));
const hashes=new Set(old.files.map(x=>x.sha256));
for(const f of next.files) if(!hashes.has(f.sha256)) fs.copyFileSync(path.join('native/dist/game',f.path),path.join('/tmp/update-objects',f.sha256));
console.log('Changed objects:',fs.readdirSync('/tmp/update-objects').length);
NODE
adb push /tmp/update-objects /data/local/tmp/update-objects >/dev/null
adb push native/dist/manifest.json /data/local/tmp/update-manifest.json >/dev/null
adb shell run-as "$pkg" mkdir -p files/content/manifests files/content/objects
adb shell "run-as $pkg sh -c 'cp /data/local/tmp/update-objects/* files/content/objects/; cp /data/local/tmp/update-manifest.json files/content/manifests/$new.json'"
adb shell run-as "$pkg" cat files/content/state.json > /tmp/android-state.json
node - <<'NODE'
const fs=require('fs');const p='/tmp/android-state.json',s=JSON.parse(fs.readFileSync(p));s.pending=process.env.GITHUB_SHA;fs.writeFileSync(p,JSON.stringify(s));
NODE
adb push /tmp/android-state.json /data/local/tmp/android-state.json >/dev/null
adb shell "run-as $pkg sh -c 'cp /data/local/tmp/android-state.json files/content/state.json'"
adb logcat -c
adb shell am start -W -n "$pkg/.MainActivity"
wait_ready "$new"
adb exec-out screencap -p > native/dist/android-upgrade.png
cat native/dist/android-upgrade.log
if grep -Eq 'FATAL EXCEPTION| E KuningriigidNative:' native/dist/android-upgrade.log; then exit 1; fi
