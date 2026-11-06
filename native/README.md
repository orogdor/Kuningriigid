# Kuningriigid WebApp 0.1.0

Android APK + Windows x64 NSIS EXE for the **existing Three.js game**, separate from the Godot AutoPort app. Full game resources ship with the installer. Initial raw game payload is about 511 MiB; the installer compresses where appropriate. The app uses WebView on Android 8+ and Electron/Chromium on Windows 10/11. Local assets improve startup/network use; packaging alone does not establish higher rendering FPS.

## Updates and saves

At launch, check `https://github.com/orogdor/Kuningriigid/releases/download/webapp-content/manifest.json`. Updates compare each relative path, size and SHA-256. Immutable bytes come only from `raw.githubusercontent.com/orogdor/Kuningriigid/<40-character commit>/...`. Unchanged bundled objects, including renamed files, reuse the bundle. Already verified changed objects survive an interrupted download. Only missing/changed files are fetched. Deleted paths disappear from the new manifest. A file is the download unit; changing a 10 MB GLB downloads that whole GLB, not a binary patch.

Files stage in app-private content-addressed storage. The active manifest changes atomically on the next launch or after explicit **Salvesta ja käivita uuesti**, which waits for game save completion. Failed startup rolls back to the previous manifest and blocks that failed revision. Both initial bundle and previous content remain available. Network failure never blocks launching the existing game. Content checks occur on launch, not continuously during play.

The stable origins are `kingdoms://game` on Windows and `https://appassets.androidplatform.net` on Android; only the revision in the path changes. LocalStorage and the normal backup save format persist independently from content. No storage/cache wipe is performed during updates. Browser/Godot saves do not automatically transfer to this new application: export/import the existing JSON through the game menu. Android uses the system file picker for import/export. Uninstalling Android still deletes its app-private saves; export before uninstalling.

The content origin cannot navigate or load remote scripts. Electron has sandbox/contextIsolation on, Node access off, narrow restart IPC. Android exposes only file export and a token-checked save completion bridge; all loaded documents/resources are intercepted locally. Update downloads use HTTPS to fixed GitHub hosts and verify SHA-256. This trusts the repository/release publisher; it is not independent cryptographic publisher signing.

## Build and validation

GitHub Actions: `.github/workflows/native-app.yml` builds on the development branch or manual dispatch, tests both updater implementations, launches the actual bundled game in Electron with renderer network requests blocked, builds the Android APK and Windows installer, and starts the installed APK offline in an Android emulator and the actual Windows executable. Only if all three jobs pass are assets uploaded to prerelease `webapp-v0.1.0`. The APK uses the developer/debug signing profile; Windows is unsigned. This is an initial device-test release, not a Play Store submission. CI debug keys can change between clean runners; future shell APK replacement may require reinstalling (export saves first). Content updates do not replace the APK and keep working without reinstalling.

After successful main game CI, `.github/workflows/native-content.yml` publishes a new manifest only. It does not rebuild the APK or EXE. To publish shell changes, increment package version/versionCode and installer tag/artifact names; production Android distribution should use a persistent private signing key supplied through repository secrets. Never commit signing keys.

Local Node checks: `node --test native/tests/*.test.cjs`.
Build pack: `node native/scripts/stage-game.cjs`.
Windows: `node native/scripts/prepare-windows.cjs`, `npm ci --prefix native/windows`, `npm run dist --prefix native/windows` on Windows.
Android: stage into `native/android/app/src/main/assets/game`, then Gradle 8.13 / JDK17 `gradle :app:testDebugUnitTest :app:assembleDebug` in `native/android`.

No FPS/memory improvement on a real phone or Windows GPU has been measured by the packaging tests. The first user-device pass should check offline startup, JSON import/export, save/relaunch and a later changed-file update.
