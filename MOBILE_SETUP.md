# Mobile App Setup Guide (Capacitor)

Your Next.js application has been converted into a mobile project using **Capacitor**.
You now have two new folders in your project: `android` and `ios`.

## Prerequisites

- **Android Studio**: For building the Android app.
- **Xcode** (Mac only): For building the iOS app.
- **CocoaPods** (Mac only): Required for iOS dependencies.

## 1. Sync Changes

If you make changes to your specific code (Next.js), run the following to update the mobile apps:

```bash
# 1. Build the web app static export
npm run build

# 2. Sync the changes to native projects
npx cap sync
```

## 2. Running on Android

1. Open the project in Android Studio:

   ```bash
   npx cap open android
   ```

2. Wait for Gradle sync to finish.
3. Connect your Android device or create an Emulator.
4. Click the **Run** (Play) button in Android Studio.

## 3. Running on iOS

Note: You might need to install CocoaPods if `npx cap sync` failed.
Run `sudo gem install cocoapods` if needed.

1. Finalize setup (if not already done):

   ```bash
   npx cap sync ios
   ```

2. Open the project in Xcode:

   ```bash
   npx cap open ios
   ```

3. Select your Target (App) and a Simulator/Device.
4. Click the **Run** (Play) button.

## Architecture Notes

- The app uses **Static Export** (`output: 'export'` in `next.config.ts`).
- All server-side logic in `pages/api` (if any) will NOT work in the app unless converted to external API calls to a deployed backend.
- Since you use Supabase (client-side), authentication and database interactions **will work** natively.
