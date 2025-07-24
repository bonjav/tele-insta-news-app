# 🚀 Quick Reference - CI/CD Commands

## Manual Deployment Commands

```bash
# Build specific platform
npm run build:ios          # Build iOS only
npm run build:android       # Build Android only
npm run build:all          # Build both platforms

# Submit to stores
npm run submit:ios         # Submit iOS to App Store
npm run submit:android     # Submit Android to Play Store
npm run submit:all         # Submit both platforms

# Full deployment
npm run deploy:internal    # Build + Submit to internal tracks
npm run deploy:production  # Build + Submit to production

# Version management
npm run release:patch      # 1.0.0 → 1.0.1
npm run release:minor      # 1.0.0 → 1.1.0
npm run release:major      # 1.0.0 → 2.0.0
```

## GitHub Actions Workflows

### Automatic Triggers
- **Push to `main`** → Internal testing builds
- **Push to `release/*`** → Release candidate builds
- **Create `v*` tag** → Production store submission
- **Create GitHub Release** → Production store submission

### Manual Triggers
1. Go to **GitHub Actions** tab
2. Select **"Build and Deploy to App Stores"**
3. Click **"Run workflow"**
4. Choose platform and deployment type

## GitHub Secrets Setup

| Secret | Required For | Example |
|--------|--------------|---------|
| `EXPO_TOKEN` | All builds | `eas token:create` |
| `GOOGLE_SERVICES_JSON` | Android | `{"project_info": {...}}` |
| `PLAYSTORE_SERVICE_ACCOUNT` | Android submission | `{"type": "service_account",...}` |
| `APPLE_ID` | iOS submission | `developer@example.com` |
| `ASC_APP_ID` | iOS submission | `1234567890` |
| `APPLE_TEAM_ID` | iOS submission | `ABCD123456` |

## Store Console Links

- **iOS**: [App Store Connect](https://appstoreconnect.apple.com)
- **Android**: [Google Play Console](https://play.google.com/console)
- **EAS Dashboard**: [Expo Dashboard](https://expo.dev)

## Common Workflows

### Development Release
```bash
git add .
git commit -m "feat: new feature"
git push origin main        # Triggers internal build
```

### Production Release
```bash
npm run release:minor       # Updates version + creates tag
# or manually:
git tag v1.1.0
git push origin v1.1.0     # Triggers production build
```

### GitHub Release
1. Go to **Releases** tab on GitHub
2. Click **"Create a new release"**
3. Choose tag `v1.1.0` (or create new)
4. Add release notes
5. Click **"Publish release"** → Triggers production build

## Quick Setup

```bash
# 1. Run setup script
./scripts/setup-deployment.sh

# 2. Configure GitHub secrets (see DEPLOYMENT.md)

# 3. Test with preview build
npm run build:all
```

## Troubleshooting

```bash
# Check build status
eas build:list

# View specific build
eas build:view <BUILD_ID>

# Check credentials
eas credentials:manager

# Clear cache if issues
eas build --clear-cache
```

---

📖 **Full Guide**: See `DEPLOYMENT.md` for complete setup instructions. 