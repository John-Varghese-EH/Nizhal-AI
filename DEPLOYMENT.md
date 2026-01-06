# Nizhal AI - Deployment Guide

Complete guide for signing, building, and distributing Nizhal AI for commercial distribution on Windows and macOS.

## Prerequisites

### Development Environment
- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 1.22+
- Git

### Platform-Specific Requirements

#### Windows
- Windows 10/11 (64-bit)
- Windows SDK 10.0.17763.0 or later
- Visual Studio 2019+ with C++ workload (optional, for native modules)

#### macOS
- macOS 11+ (Big Sur or later)
- Xcode Command Line Tools
- Apple Developer Account ($99/year for distribution)

---

## Building for Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

This launches:
1. Vite dev server on http://localhost:5173
2. Electron app connecting to the dev server

---

## Building for Production

### Windows Build

```bash
# Build for Windows (NSIS installer + portable)
npm run build:win
```

Output files will be in `dist-electron/`:
- `Nizhal AI Setup x.x.x.exe` - NSIS installer
- `Nizhal AI x.x.x.exe` - Portable executable

### macOS Build

```bash
# Build for macOS (DMG + ZIP)
npm run build:mac
```

Output files:
- `Nizhal AI-x.x.x.dmg` - Disk image installer
- `Nizhal AI-x.x.x-mac.zip` - ZIP archive

### Linux Build

```bash
# Build for Linux (AppImage + DEB)
npm run build:linux
```

---

## Code Signing

### Windows Code Signing

1. **Obtain a Code Signing Certificate**
   - Purchase from DigiCert, Sectigo, or Comodo
   - Extended Validation (EV) certificates provide SmartScreen reputation immediately

2. **Set Environment Variables**
   ```bash
   set WIN_CSC_LINK=path/to/certificate.pfx
   set WIN_CSC_KEY_PASSWORD=your_password
   ```

3. **Build with Signing**
   ```bash
   npm run build:win
   ```

### macOS Code Signing & Notarization

1. **Create Certificates in Apple Developer Portal**
   - Developer ID Application certificate
   - Developer ID Installer certificate (for PKG)

2. **Create entitlements file** (`build/entitlements.mac.plist`):
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
     <key>com.apple.security.cs.allow-jit</key>
     <true/>
     <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
     <true/>
     <key>com.apple.security.cs.disable-library-validation</key>
     <true/>
     <key>com.apple.security.automation.apple-events</key>
     <true/>
   </dict>
   </plist>
   ```

3. **Set Environment Variables**
   ```bash
   export APPLE_ID=your@email.com
   export APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
   export APPLE_TEAM_ID=XXXXXXXXXX
   ```

4. **Build with Notarization**
   ```bash
   npm run build:mac
   ```

---

## Auto-Update Configuration

### GitHub Releases (Recommended)

1. **Update `package.json`**
   ```json
   {
     "build": {
       "publish": {
         "provider": "github",
         "owner": "John-Varghese",
         "repo": "Nizhal-AI"
       }
     }
   }
   ```

2. **Create GitHub Release**
   ```bash
   # Set GitHub token
   export GH_TOKEN=your_github_token
   
   # Build and publish
   npm run build
   npx electron-builder --publish always
   ```

### Self-Hosted Updates

1. **Set up update server**
   - Use [Hazel](https://github.com/vercel/hazel) for Vercel
   - Or [nuts](https://github.com/GitbookIO/nuts) for self-hosting

2. **Configure update URL**
   ```json
   {
     "build": {
       "publish": {
         "provider": "generic",
         "url": "https://updates.nizhal.ai"
       }
     }
   }
   ```

---

## Environment Variables

Create `.env` file for development:

```env
# AI Providers

GEMINI_API_KEY=your_gemini_key

# Voice Services
ELEVENLABS_API_KEY=your_elevenlabs_key

# Payment Gateways
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Analytics (optional)
SENTRY_DSN=https://xxxx@sentry.io/xxxxx
```

---

## Store Submission

### Microsoft Store

1. Build APPX package:
   ```bash
   npx electron-builder --win appx
   ```

2. Submit via [Partner Center](https://partner.microsoft.com/dashboard)

### Mac App Store

1. Use Mac App Store provisioning profile
2. Build MAS package:
   ```bash
   npx electron-builder --mac mas
   ```

3. Submit via [App Store Connect](https://appstoreconnect.apple.com)

> **Note**: Mac App Store requires sandboxing, which may limit some features.

---

## Troubleshooting

### Common Issues

**Windows: "Windows protected your PC" warning**
- Solution: Use EV code signing certificate, or ask users to click "More info" → "Run anyway"

**macOS: "App is damaged and can't be opened"**
- Solution: Run `xattr -cr /Applications/Nizhal\ AI.app` to remove quarantine

**Build fails with native module errors**
- Solution: Run `npm run postinstall` or rebuild native modules:
  ```bash
  npx electron-rebuild
  ```

---

## Production Checklist

- [ ] Code signing certificates obtained
- [ ] Auto-update server configured
- [ ] Analytics/crash reporting enabled
- [ ] Payment gateway production keys set
- [ ] Privacy policy and terms of service URLs added
- [ ] App icons in all required sizes (16, 32, 48, 64, 128, 256, 512, 1024)
- [ ] Tested on clean Windows and macOS installations
- [ ] License validation server ready
- [ ] Support email configured
