# Owner setup — accounts, credentials and manual steps

Everything in this file needs a human with the project owner's accounts: paid developer
programs, signing identities, store listings, device walkthroughs. Code never does these steps on
its own, and the app is designed to keep working while they are not done yet. Each section says
**when** it becomes necessary and **what breaks or stays hidden** until then.

Status legend: **now** = useful today · **before iCloud** · **before a store release** · **later** = only
once the related feature is wired.

---

## 1. Now — no account needed

### Rebuild the mobile dev build after native dependencies change

Native modules (`react-native-quick-crypto`, `react-native-nitro-modules`,
`react-native-quick-base64`, `expo-sqlite` with SQLCipher, the local `icloud-container` module)
only exist in a binary built after they were added. Expo Go cannot run this app.

```bash
cd apps/mobile
bun run prebuild --clean   # regenerates ios/ and android/ from app.json
bun run ios                # or: bun run android
```

Symptom of a stale binary: a JS error such as `TurboModuleRegistry.getEnforcing(...): 'QuickBase64'
could not be found`. Argon2 then silently falls back to the (slow) JS implementation.

A free Apple ID ("Personal Team" in Xcode) is enough to run on your own iPhone. The app expires
after 7 days and must be reinstalled from Xcode.

### Manual walkthroughs still owed

| What | Why it can't be automated here |
|---|---|
| Mobile local mode on a real device: create, add a transaction, kill, relaunch, unlock, wrong passphrase, export to Files, re-import | SQLCipher and native Argon2 only run in a native build |
| Unlock timing on device (target: a couple of seconds) | Argon2id 64 MiB × 3 passes; the native engine was added for this, never measured on hardware |
| Desktop ↔ mobile portability: open on desktop a `.mfhdb` exported from the phone, and the reverse | needs both apps running against the same files |
| Desktop (Tauri) local mode walkthrough | desktop E2E does not run on macOS (no WebDriver in the system WebView) |

---

## 2. Apple Developer Program — before iCloud

**Cost:** 99 USD/year, at <https://developer.apple.com/programs/>. Enrolment approval can take from
a few hours to a few days.

**What waits for it:**
- **iCloud Drive storage on iOS.** Until it is done, the native module finds no iCloud container,
  `syncedDirectory()` returns `null`, and the "iCloud Drive" location never appears in the create
  sheet. Nothing errors: workspaces are created "On this iPhone" (visible in the Files app) and
  export/import still reaches iCloud Drive by hand.
- TestFlight and App Store distribution.
- Signed and notarized macOS desktop builds (see §5).

### Steps to turn iCloud storage on

1. **Join the team in Xcode.** Enrol, then in Xcode → Settings → Accounts add the Apple ID and
   check that the paid team appears.
2. **Set the team in `apps/mobile/app.json`** so every `prebuild` keeps it. Replace `XXXXXXXXXX`
   with the Team ID shown at developer.apple.com → Membership:

   ```json
   "ios": {
     "supportsTablet": true,
     "bundleIdentifier": "app.myfinancehealth.mobile",
     "appleTeamId": "XXXXXXXXXX",
     "entitlements": {
       "com.apple.developer.icloud-container-identifiers": ["iCloud.app.myfinancehealth.mobile"],
       "com.apple.developer.icloud-services": ["CloudDocuments"],
       "com.apple.developer.ubiquity-container-identifiers": ["iCloud.app.myfinancehealth.mobile"]
     },
     "infoPlist": {
       "NSUbiquitousContainers": {
         "iCloud.app.myfinancehealth.mobile": {
           "NSUbiquitousContainerIsDocumentScopePublic": true,
           "NSUbiquitousContainerName": "my finance health",
           "NSUbiquitousContainerSupportedFolderLevels": "Any"
         }
       }
     }
   }
   ```

   - `entitlements` adds iCloud Documents and the container `iCloud.app.myfinancehealth.mobile`.
     Don't use `ios.usesIcloudStorage` instead: it only takes effect when `expo-document-picker`
     is installed (its config plugin writes the entitlements), which this app doesn't use.
   - `NSUbiquitousContainers` makes the folder appear as **iCloud Drive › my finance health**, on
     the iPhone in Files and on the Mac in Finder.
3. **Rebuild:**

   ```bash
   cd apps/mobile && bun run prebuild --clean && bun run ios
   ```

   `expo run:ios` does not let Xcode update provisioning, so the first build after adding iCloud
   fails with "Provisioning Profile … does not support the iCloud capability". Build once with
   provisioning updates allowed — Xcode then enables iCloud on the App ID, registers the container
   and regenerates the profile — and `bun run ios` works from then on:

   ```bash
   cd apps/mobile/ios && xcodebuild -workspace myfinancehealth.xcworkspace -scheme myfinancehealth \
     -configuration Debug -destination 'generic/platform=iOS' -allowProvisioningUpdates build
   ```

   If that still fails:
   - At developer.apple.com → Identifiers, create the iCloud container
     `iCloud.app.myfinancehealth.mobile`.
   - Enable iCloud (CloudKit/Documents) on the App ID `app.myfinancehealth.mobile` and assign the
     container to it.
4. **Check it on the device.**
   - Signed into iCloud with iCloud Drive on, the create sheet now offers "iCloud Drive".
   - Create a workspace there. It appears in Files › iCloud Drive › my finance health › `<name>/`.
5. **If the folder does not show in iCloud Drive:** iOS only re-reads `NSUbiquitousContainers` when
   the build number changes. Bump `expo.ios.buildNumber` (or `version`) in `app.json`, prebuild
   again and reinstall.
6. **Mac side.** The same folder is `~/Library/Mobile Documents/iCloud~app~myfinancehealth~mobile/Documents/`,
   which Finder shows under iCloud Drive. The desktop app can open the `.mfhdb` there directly.
   Opening it on two devices at the same time is what the occupancy lock (`.mfhlock`) warns about.

**Workspaces created before this:** they stay on the phone. To move one into iCloud, use
Settings → Data → Export and pick the iCloud folder.

---

## 3. Expo account and EAS — before a store release

**Cost:** free tier is enough to start, at <https://expo.dev/signup>.

You don't need it for local development: `bun run ios` / `bun run android` build on your machine.

You do need it to build in the cloud, manage signing credentials and submit to the stores:

```bash
bunx eas-cli login
cd apps/mobile && bunx eas-cli build:configure   # creates eas.json — commit it
bunx eas-cli build --platform ios --profile development
```

- EAS can generate and store the iOS certificates/provisioning profiles and the Android upload
  keystore. Let it, unless you have a reason to keep them yourself.
- If `eas.json` gets an `extra.eas.projectId` in `app.json`, commit it.

---

## 4. Google — before an Android store release

| Item | Cost | Needed for |
|---|---|---|
| Google Play Console developer account, at <https://play.google.com/console/signup> | 25 USD once | publishing `app.myfinancehealth.mobile` |
| Upload keystore | free | signing release builds; EAS can create and keep it (§3) |

**No Google Cloud project or Google Drive API is needed:**
- Android keeps the workspace in app storage. That is a decision: SQLite cannot open a folder
  picked through the system picker.
- Google Drive, like any other provider, is reached through the system folder picker used by
  export/import, so it needs no integration.

If you install a personal release build, Play Protect may warn about an unknown developer.
That's expected outside the store.

---

## 5. Desktop distribution — before a desktop release

The desktop identifier is `com.myfinancehealth.desktop` (`apps/desktop/src-tauri/tauri.conf.json`).

| Platform | What to obtain | Without it |
|---|---|---|
| macOS | "Developer ID Application" certificate (same Apple Developer account as §2) plus notarization: an app-specific password at appleid.apple.com | Gatekeeper blocks the app; users must right-click → Open |
| Windows | Code-signing certificate (OV or EV) from a CA | SmartScreen "unknown publisher" warning |
| Linux | nothing | — |

For a signed macOS build, Tauri reads these environment variables:

```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: <Name> (<TEAMID>)"
export APPLE_ID="<apple id email>"
export APPLE_PASSWORD="<app-specific password>"
export APPLE_TEAM_ID="<TEAMID>"
cd apps/desktop && bun run tauri build
```

Never commit these values. Keep them in your shell profile or CI secrets (§7).

---

## 6. Later — only once the feature is wired

| Feature | Owner action | Status |
|---|---|---|
| Desktop auto-update (`canUpdate`, currently `false`) | Generate the updater key pair: `bunx tauri signer generate -w ~/.tauri/mfh.key`. Keep the private key and its password secret (CI secrets `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, §7). Choose where update manifests are hosted. | not wired |
| Face ID / fingerprint unlock on mobile (`hasBiometricUnlock`) | No account needed. The Face ID usage text is in `app.json` (`expo-local-authentication` and `expo-secure-store` plugins); run `bun run prebuild` and rebuild the dev client. Simulator: *Features → Face ID → Enrolled*, then *Matching Face*. Confirm once on a real device (Secure Enclave). | built — needs a prebuild |
| Online mode (remote API workspaces) | Host the API, own its domain and TLS, and decide where API keys are issued | not wired |
| App Store / Play Store listings | Privacy policy URL, screenshots, app privacy questionnaire. Data stays on device or in the user's own iCloud: declare no collection unless online mode lands. | before store release |

---

## 7. Continuous integration — GitHub secrets and variables

Two workflows live in `.github/workflows/`:

- `ci.yml` — on every pull request and on pushes to `main` and `release/**`: Biome lint, `typecheck`
  and `test` through Turbo. `build` + `bundle` (web and desktop Vite builds, Metro export of the
  mobile JS) only run on pull requests into `main` (release and hotfix PRs) and on `main` itself; a
  `branch policy` check rejects pull requests into `main` from any other branch. On pull requests
  only the packages affected since the base branch run. Branch model: CONTRIBUTING.md § Releases.
- `desktop.yml` — Tauri bundles for macOS (arm64 and x86_64), Windows x64 and Linux x64. Runs on
  pull requests into `main` touching `apps/desktop/**` or `packages/**`, on `main` for the same paths, and by hand
  (Actions → Desktop → Run workflow); bundles are attached to the run as artifacts. A `v*` tag also
  creates a **draft** GitHub release with them: bump the version with `bun run release:version <x.y.z>`
  before tagging, then review and publish the draft.

Both work with **no secret at all**: builds are then unsigned and Turbo uses the GitHub Actions cache
only. Each secret below switches one thing on. Add them at GitHub → repository Settings → Secrets and
variables → Actions.

| Name | Kind | Where it comes from | What it unlocks |
|---|---|---|---|
| `TURBO_TOKEN` | secret | Vercel → Account Settings → Tokens | Vercel Remote Cache, shared between CI and your machine |
| `TURBO_TEAM` | variable | your Vercel team slug | goes with `TURBO_TOKEN` |
| `APPLE_CERTIFICATE` | secret | "Developer ID Application" certificate (§5) exported from Keychain Access as `.p12`, then `base64 -i cert.p12 \| pbcopy` | signed macOS bundles |
| `APPLE_CERTIFICATE_PASSWORD` | secret | the password chosen at `.p12` export | goes with `APPLE_CERTIFICATE` |
| `APPLE_SIGNING_IDENTITY` | secret, optional | `Developer ID Application: <Name> (<TEAMID>)` | picks the identity; found in the certificate when absent |
| `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` | secrets | Apple ID email, app-specific password from appleid.apple.com, Team ID (§5) | notarization; only used when the certificate is set |
| `WINDOWS_CERTIFICATE` | secret | code-signing certificate (§5) as `.pfx`, then base64: `[Convert]::ToBase64String([IO.File]::ReadAllBytes('cert.pfx'))` | signed Windows installers |
| `WINDOWS_CERTIFICATE_PASSWORD` | secret | the `.pfx` password | goes with `WINDOWS_CERTIFICATE` |
| `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | secrets | content of `~/.tauri/mfh.key` and its password (§6) | updater signatures, once `bundle.createUpdaterArtifacts` is on |

Certificates sold since mid-2023 usually keep their key in hardware or a cloud service and cannot be
exported as `.pfx`. In that case, leave `WINDOWS_CERTIFICATE` empty and sign through
`bundle.windows.signCommand` in `tauri.conf.json` with the provider's tool instead.

---

## Quick checklist

- [ ] Rebuild the mobile dev build after native deps (§1)
- [ ] Device walkthrough + unlock timing (§1)
- [ ] Desktop ↔ mobile file portability check (§1)
- [ ] Apple Developer Program enrolment (§2)
- [ ] Add `appleTeamId`, the iCloud `entitlements`, `NSUbiquitousContainers` to `app.json`, then prebuild (§2)
- [ ] Verify the folder in Files › iCloud Drive and in Finder (§2)
- [ ] Expo account + `eas.json` (§3)
- [ ] Google Play Console account (§4)
- [ ] macOS Developer ID + notarization env (§5), then the `APPLE_*` CI secrets (§7)
- [ ] Windows code-signing certificate (§5, optional), then the `WINDOWS_*` CI secrets (§7)
- [ ] Tauri updater keys (§6, when auto-update is wired), then the `TAURI_SIGNING_*` CI secrets (§7)
- [ ] Vercel Remote Cache: `TURBO_TOKEN` secret + `TURBO_TEAM` variable (§7, optional)
