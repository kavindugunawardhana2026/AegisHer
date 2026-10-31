# AegisHer mobile (Flutter)

Screens: **Shield** (pick or receive a shared photo → shield → share to Instagram/Facebook or save),
**Report** (3-step evidence wizard → PDF), **My reports** (saved PDFs, open offline, send).

This folder holds the Dart source only. Generate the Android/iOS platform folders once:

```bash
cd mobile
flutter create --platforms=android,ios --org lk.aegisher --project-name aegisher .
flutter pub get
flutter run
```

`flutter create .` keeps the existing `lib/` and `pubspec.yaml`.

## "Share to AegisHer" (Android)

In `android/app/src/main/AndroidManifest.xml`, inside the main `<activity>`, add:

```xml
<intent-filter>
    <action android:name="android.intent.action.SEND" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="image/*" />
</intent-filter>
```

and set `android:launchMode="singleTask"` on that activity so a share reuses the open app.

Allow plain HTTP to your dev server (debug only), on `<application>`:
`android:usesCleartextTraffic="true"`.

## iOS

- `ios/Runner/Info.plist`: add `NSPhotoLibraryUsageDescription` and `NSPhotoLibraryAddUsageDescription`.
- The share sheet entry needs a **Share Extension** target. Follow the iOS steps in the
  `receive_sharing_intent` package README.

## Server URL

The app calls the FastAPI backend. Default: `http://10.0.2.2:8000` (Android emulator → your PC).
On a real phone, run the backend with `--host 0.0.0.0` and enter `http://<your PC's IP>:8000` in
Settings (gear icon).

## Phase 2 – offline cloaking

The plan is to export a small cloaking generator to ONNX and run it with ONNX Runtime Mobile, so
photos never leave the phone. The current PGD optimiser needs gradients through ArcFace, which is too
heavy for phones. A trained feed-forward generator (one forward pass) is the usual route.
