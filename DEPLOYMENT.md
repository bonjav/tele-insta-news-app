# 🚀 CI/CD Deployment Guide

This guide will help you set up automated deployment to both Google Play Store and Apple App Store using GitHub Actions and EAS (Expo Application Services).

## 📋 Prerequisites

- [ ] Expo account with EAS CLI access
- [ ] Apple Developer account (for iOS)
- [ ] Google Play Console account (for Android)
- [ ] GitHub repository with Actions enabled

## 🔧 Setup Instructions

### 1. EAS Configuration

Make sure you have EAS CLI installed and are logged in:

```bash
npm install -g @expo/eas-cli
eas login
```

### 2. GitHub Secrets Configuration

Add the following secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

#### Required Secrets:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `EXPO_TOKEN` | Expo authentication token | Run `eas whoami` then `eas token:create` |
| `GOOGLE_SERVICES_JSON` | Firebase/Google Services config | Download from Firebase Console |
| `PLAYSTORE_SERVICE_ACCOUNT` | Google Play Service Account JSON | Create in Google Cloud Console |
| `APPLE_ID` | Your Apple ID email | Your Apple Developer account email |
| `ASC_APP_ID` | App Store Connect App ID | Found in App Store Connect |
| `APPLE_TEAM_ID` | Apple Developer Team ID | Found in Apple Developer Portal |

#### Environment Variables (Optional):
```env
EXPO_PUBLIC_IS_PRODUCTION=true
EXPO_PUBLIC_SHOW_USER_ALERTS=false
EXPO_PUBLIC_ENABLE_DEBUG_PANEL=false
```

### 3. Apple App Store Setup

#### A. Create App in App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app with:
   - **Bundle ID**: `com.dailySnapShorts`
   - **Name**: `DailySnapShorts`
   - **Primary Language**: English

#### B. Generate App Store Connect API Key
1. Go to `Users and Access > Keys`
2. Create a new key with `Developer` role
3. Download the `.p8` file and note the Key ID and Issuer ID

#### C. Get Required IDs
```bash
# Get Apple Team ID
eas credentials:manager -p ios

# Get App Store Connect App ID
# Found in App Store Connect > App Information > General Information
```

### 4. Google Play Store Setup

#### A. Create App in Google Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app with:
   - **Package name**: `com.dailySnapShorts`
   - **App name**: `DailySnapShorts`

#### B. Generate Service Account Key
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new service account
3. Grant `Service Account User` and `Storage Admin` roles
4. Generate and download JSON key file
5. In Google Play Console, go to `Setup > API access`
6. Link the service account and grant permissions

#### C. Setup Release Tracks
```bash
# The pipeline uses these tracks:
# - internal: For testing builds
# - production: For public releases
```

### 5. Firebase Setup (Android)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create or select your project
3. Add Android app with package `com.dailySnapShorts`
4. Download `google-services.json`
5. Copy content to `GOOGLE_SERVICES_JSON` secret

## 🚀 Deployment Workflows

### Automatic Deployments

| Trigger | Platform | Track | Description |
|---------|----------|-------|-------------|
| `push` to `main` | Both | Internal | Automatic testing build |
| `push` to `release/*` | Both | Internal | Release candidate |
| `tag` `v*` | Both | Production | Public release |

### Manual Deployments

Use GitHub Actions tab and click "Run workflow":

1. **Platform**: Choose `all`, `ios`, or `android`
2. **Deploy Type**: Choose `internal` or `production`

### Example Commands

```bash
# Create a production release
git tag v1.0.0
git push origin v1.0.0

# Create a release branch
git checkout -b release/1.0.0
git push origin release/1.0.0
```

## 📱 Build Profiles

### Development
- **Purpose**: Local development with dev client
- **Distribution**: Internal only

### Preview
- **Purpose**: Internal testing (APK for Android)
- **Distribution**: Internal only

### Production
- **Purpose**: Store submission (AAB for Android)
- **Distribution**: App stores
- **Auto-increment**: Version numbers

## 🔍 Monitoring

### Build Status
- Check GitHub Actions tab for build progress
- EAS Dashboard shows build status and logs
- Store consoles show submission status

### Logs
```bash
# View EAS build logs
eas build:list

# View specific build
eas build:view [BUILD_ID]
```

## 🛠 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear EAS cache
eas build --clear-cache

# Check credentials
eas credentials:manager
```

#### Store Submission Issues
- Ensure app versions are properly incremented
- Check store-specific requirements (privacy policy, content rating)
- Verify signing certificates are valid

#### Environment Variables
- Double-check all GitHub secrets are set correctly
- Ensure JSON strings are properly formatted
- Verify Apple/Google account permissions

### Support Resources
- [EAS Documentation](https://docs.expo.dev/eas/)
- [Apple Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

## 📊 Release Checklist

Before creating a release:

- [ ] Update version in `app.json`
- [ ] Test app thoroughly
- [ ] Update release notes
- [ ] Ensure all secrets are configured
- [ ] Check store requirements compliance
- [ ] Create git tag with version number
- [ ] Monitor deployment pipeline
- [ ] Verify submissions in store consoles

## 🔄 Release Process

1. **Development** → Merge to `main` → Internal testing
2. **Release Candidate** → Create `release/*` branch → Internal testing
3. **Production** → Create `v*` tag → Store submission
4. **Monitoring** → Check store consoles → Update users

---

For questions or issues, check the GitHub Actions logs or contact the development team. 