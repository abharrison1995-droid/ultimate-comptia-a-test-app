# A+ Revision (iOS)

Independent, **unofficial** CompTIA A+ (220-1201 / 220-1202) study app — revision sheets, mocks, and drills.

Part of a planned **exam-prep suite** for CompTIA certifications. Not affiliated with, endorsed by, or sponsored by CompTIA®.

## What’s in this repo

| Path | Role |
|------|------|
| `www/` | Web study app (source of truth for UI/content) |
| `ios/` | Capacitor native shell (Xcode project) |
| `capacitor.config.json` | App ID `com.revisionguide.aplus`, name **A+ Revision** |

This is **not** a clone of the GitHub Pages PWA repo — it’s a sister product: same study content, packaged for App Store distribution via Capacitor.

## Mac setup (required for build / TestFlight)

1. Install **Xcode**, **CocoaPods** (`sudo gem install cocoapods` or Homebrew).
2. Clone this repo and install JS deps:

```bash
npm install
npx cap sync ios
cd ios/App && pod install && cd ../..
npx cap open ios
```

3. In Xcode: set your **Team**, signing, and unique bundle ID if needed.
4. Run on simulator / device, then Archive → TestFlight / App Store Connect.

## Web preview (optional)

Serve `www/` locally to review content without Xcode:

```bash
npx --yes serve www -p 4173
```

## Branding rules (suite)

- Product name: **A+ Revision** (never imply official CompTIA software)
- Always keep the legal disclaimer + Privacy & settings → Delete study data
- Future apps (Network+, Security+, …) should use the same disclaimer pattern and distinct bundle IDs under `com.revisionguide.*`

## Sync workflow after editing `www/`

```bash
npx cap sync ios
```

Then rebuild in Xcode.
