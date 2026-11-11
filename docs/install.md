# Installing DPS.guide on iPhone or iPad

This guide covers the iOS install path: build the unsigned IPA, install
[Sideloadly](https://sideloadly.io/) on your computer, and sideload the app.
No paid Apple Developer account is required.

> **Free Apple ID, 7-day signing.** A free Apple ID signs the app for 7 days;
> Sideloadly's automatic refresh daemon re-signs the app in the background
> before it expires. A paid Apple Developer account ($99/year) extends validity
> to 1 year.

## Prerequisites

- macOS 10.12+ (for the build) or a Mac with Xcode 16+
- A free Apple ID (or a paid Apple Developer account)
- An iPhone or iPad running iOS 7–27+
- USB connection, or the same Wi-Fi network for wireless sideloading

## Building the IPA

From the repository root on a Mac:

```bash
pnpm install
pnpm mobile:ios
```

The build produces an unsigned IPA at
`apps/mobile/native-artifacts/DPS.guide-unsigned.ipa`. This is done with
`CODE_SIGNING_ALLOWED=NO`, so no signing keys or Apple credentials are needed or
stored in the repository.

## Installing Sideloadly

1. Download Sideloadly for macOS or Windows from [sideloadly.io](https://sideloadly.io/).
2. On Windows, uninstall the Microsoft Store versions of iTunes and iCloud and
   install the [web version of iTunes](https://www.apple.com/itunes/download/win64)
   and iCloud before starting.
3. Open Sideloadly.

## Sideloading the app

1. Connect your iPhone or iPad to the computer via USB.
2. Drag the `DPS.guide-unsigned.ipa` file into the Sideloadly window.
3. Enter your Apple ID and password. Save credentials for easier future refreshes.
4. Click **Sideload**. The app is installed on the device.

### Wireless installation

After the first USB install, the device appears in Sideloadly over Wi-Fi as long
as both the computer and device are on the same network. On Windows, you may
need to install Apple's Bonjour service. On macOS, Wi-Fi sync must be enabled in
Finder for your device.

## After installation

1. Open **Settings** on the device and go to **General → VPN & Device
   Management**.
2. Trust the Apple ID developer certificate.
3. Open DPS.guide and complete the onboarding: base URL, LMS credentials and
   your Gemini API key.

The app icon will reappear after each refresh. The automatic refresh runs in the
background and re-signs the app before the 7-day certificate expires; you can
configure the refresh schedule in Sideloadly's settings.

## Troubleshooting

- **App expired:** refresh it from Sideloadly's dashboard, or drag the IPA in
  again to re-install.
- **Build fails on Mac:** Xcode 16+ is required for Capacitor 8; the GitHub
  workflow uses `macos-15` (Xcode 16). The workflow is `ios-unsigned-ipa.yml`,
  triggered manually to conserve macOS minutes.
- **Wi-Fi install fails:** verify both devices are on the same network and the
  first USB install completed.
- **Trust prompt missing:** disconnect and reconnect the device, then retry the
  install.

## Building from CI

For builds without a local Mac, the `ios-unsigned-ipa.yml` workflow builds the
unsigned IPA on `macos-15` with Xcode 16. It is triggered manually
(`workflow_dispatch`) only, because macOS runner minutes count for double in a
private repository (PLAN.md §2, D8).
