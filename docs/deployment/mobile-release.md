# Mobile Release & Distribution Pipeline

Guidelines for compiling, code-signing, and publishing the HomeVerse Flutter application to Google Play Store and Apple App Store.

## Prerequisites

- Flutter SDK (>=3.2.0)
- Android Studio / Android SDK (API 34)
- Xcode (>=15.0) & CocoaPods (for iOS)
- Fastlane (optional automated CI/CD)

## Android Production Build

1. Configure keystore in `mobile/android/key.properties`:
   ```properties
   storePassword=your_keystore_password
   keyPassword=your_key_password
   keyAlias=homeverse-key
   storeFile=../keystores/release.keystore
   ```

2. Build Google Play App Bundle (AAB):
   ```bash
   cd mobile
   flutter build appbundle --release --obfuscate --split-debug-info=build/app/outputs/symbols
   ```

## iOS Production Build

1. Provision certificates and profiles in Apple Developer portal.
2. Build iOS Archive:
   ```bash
   cd mobile
   flutter build ipa --release --obfuscate --split-debug-info=build/ios/outputs/symbols
   ```

## Environment Management

Mobile builds inject production API endpoints via `--dart-define`:
```bash
flutter run --release --dart-define=API_URL=https://api.homeverse.ai
```
