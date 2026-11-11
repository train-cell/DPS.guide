# DPS.guide

DPS.guide is a local study assistant for courses on **Open eClass** and **Moodle**.
It synchronizes courses and files to your device, generates a study map and study
guides, tracks progress, schedules, reminders and tutor chat. No DPS.guide
account or central server is required.

## Platforms

| Platform | Execution | Notes |
| --- | --- | --- |
| Windows / macOS | Browser/PWA via `localhost` | Local bridge for LMS and AI. Ollama runs only on the same computer. |
| Android | Capacitor app (debug APK) | Direct connection to the LMS, encrypted local vault and native notifications. |
| iPhone / iPad | Capacitor app (unsigned IPA) | Sideload and local signing. No CA installation required. |

Data is per installation and per device. There is no automatic synchronization
between devices. The PWA opens only on the computer running it; to use it from a
phone, install the Android or iOS app. The browser keeps reliable reminders only
while the app stays active; native apps can schedule local notifications in the
background.

## Supported LMS

- **Open eClass:** standard login with username and password, course discovery
  and material synchronization.
- **Moodle:** standard login and reading of courses/resources. A Web Services
  token is optionally supported. SSO-only and proprietary login flows are not
  supported and show a clear error.
- Other institutions appear as unsupported, unless their URL is recognized as a
  standard Open eClass or Moodle site.

Credentials are used to log in to the LMS you choose and are sent only to that
institution.

For some Moodle downloads, the LMS requires the token in the temporary download
URL. The token is not stored in the app's index, but the Moodle server or an
intermediate proxy may log the URL.

## AI and privacy

- You can use the core features without AI.
- **Ollama:** runs locally on the same Windows/macOS computer. Not available in
  the native apps.
- **Google Gemini:** requires your own API key. Sending material requires opt-in
  for every course and confirmation before every new, non-saved generation. The
  confirmation screen shows the content that is about to be sent to Google. The
  provider's terms and data management policies also apply.
- Text extraction and PDF OCR are done locally. Scanned PDFs are recognized with
  local Greek and English models.

## Storage and data protection

The vault encrypts data and course files with AES-256-GCM before storing them in
IndexedDB or the native app's private storage. In new vaults, the key is
protected with PBKDF2-HMAC-SHA256 600,000 iterations. A master password of at
least 12 characters is required. The master password is not stored.

A recovery key is generated during initial setup and displayed for safekeeping.
Store it separately and securely; it is an alternative unlock method. Encrypted
backups use a separate password and are restored only to a clean installation.
Backup restore is the manual way to transfer data between devices. Biometric
keys are not included in the backup. Existing vaults and older backups remain
compatible.

In native apps, credentials and API keys are kept in Keychain/Keystore, files
stay in the app's private storage and cloud/device backups are excluded. On iOS,
secrets are `ThisDeviceOnly` and iCloud Keychain sync is disabled. You can
optionally enable Face ID, Touch ID or Android biometrics; the master password
and recovery key remain available. In the browser, the vault locks when the app
goes to the background.

Encryption protects data at rest. When the vault is unlocked, the app needs the
key in the device's memory; this protection does not cover a compromised or
modified operating system, malicious browser extensions, keyboard logging or
physical access to an unlocked device. The optional CLI is a separate tool and
stores files without the vault.

### Local bridge of the browser

The PWA uses a local bridge for requests to the LMS and AI. The server only
listens on loopback (`127.0.0.1`), requires a pairing code displayed in the
terminal and generates a new code on every restart. Use the code only in the
browser and on the computer you trust; if it is exposed, close and restart the
server. Requests to the LMS require HTTPS; HTTP is allowed only for Ollama on
localhost. The bridge is not a server for phone access over Wi-Fi.

### Vulnerability report

Do not publish passwords, API keys, recovery keys, pairing codes, real course
data or backup files in issues, screenshots or logs. For a vulnerability report,
use the repository host's private channel, not a public issue. Check production
dependencies with `pnpm audit --prod` before distribution.

## Execution on Windows/macOS

**Node.js 22.15+** and **pnpm 10+** are required. From the repository root:

```bash
pnpm install
pnpm mobile:start
```

`pnpm mobile:start` builds and serves the production PWA at
`http://localhost:5173`. Keep the terminal open while you use the app, LMS
synchronization or AI. localhost provides the secure browser context that
WebCrypto and the service worker require. On Windows/macOS, the bridge uses the
OS trust store for upstream HTTPS connections.

For development with hot reload:

```bash
pnpm mobile:dev
```

The development build does not activate the offline PWA service worker.

## Native builds

### Android APK

JDK 21, Android SDK Platform 36 and Build Tools 36 are required, plus acceptance
of the Android SDK licenses. Run:

```bash
pnpm mobile:android
```

The debug-signed APK is produced at
`apps/mobile/native-artifacts/DPS.guide-android-debug.apk`. It is for
installation/sideload, not a Play Store release build.

### iOS IPA

Building requires macOS and Xcode 16+. Run on a Mac:

```bash
pnpm mobile:ios
```

An unsigned IPA is produced at `apps/mobile/native-artifacts/DPS.guide-unsigned.ipa`,
for local signing and sideload with a tool such as Sideloadly. Signing keys and
Apple credentials must stay outside the repository.

## Development and checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm check:ownership
pnpm mobile:build
pnpm audit --prod
```

Mocks and fixtures are used only by tests. LMS fixtures are synthetic; their
success does not replace a live connection check at every institution.
`mobile:build` produces the browser/PWA build at `apps/mobile/dist`.

## Repository structure

- `apps/mobile`: Ionic React, PWA and Capacitor iOS/Android apps.
- `apps/cli`: optional CLI without an encrypted vault.
- `packages/core`: domain models, contracts and deterministic computations.
- `packages/eclass`: Open eClass and Moodle connectors.
- `packages/extract`: PDF/Office content extraction.
- `packages/pipeline`: synchronization and course analysis.
- `packages/ai`: Gemini and Ollama adapters.
- `packages/adapters-capacitor`, `packages/adapters-node`: platform adapters.

The old specifications, orchestration prompts and handoff snapshots under
`docs/` are historical material; see the [documentation index](docs/README.md).

## License

DPS.guide is available under the [MIT](LICENSE) license. Third-party libraries
keep their own licenses and notices.
