#!/bin/bash

# 🚀 DailySnapShorts Deployment Setup Script
# This script helps you set up EAS credentials and prepare for deployment

set -e

echo "🚀 Setting up deployment for DailySnapShorts..."
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI is not installed. Installing now..."
    npm install -g @expo/eas-cli
else
    echo "✅ EAS CLI is already installed"
fi

# Login to EAS
echo ""
echo "🔐 Logging in to EAS..."
eas login

# Configure EAS project
echo ""
echo "🔧 Configuring EAS project..."
eas init --id 16ae2ea9-f9c6-4ad8-804d-396a20159ea4

# Setup credentials for iOS
echo ""
echo "📱 Setting up iOS credentials..."
echo "This will help you configure:"
echo "- Apple Team ID"
echo "- App Store Connect API Key"
echo "- Signing certificates"
eas credentials:manager -p ios

# Setup credentials for Android
echo ""
echo "🤖 Setting up Android credentials..."
echo "This will help you configure:"
echo "- Android keystore"
echo "- Google Service Account"
eas credentials:manager -p android

# Create initial builds
echo ""
read -p "🚀 Would you like to create initial preview builds? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Building preview builds..."
    eas build --platform all --profile preview --non-interactive
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure GitHub secrets (see DEPLOYMENT.md)"
echo "2. Set up App Store Connect and Google Play Console"
echo "3. Push your code to trigger the CI/CD pipeline"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md" 