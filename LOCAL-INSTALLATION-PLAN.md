# Total Serialism - Local Installation & Packaging Plan

## Executive Summary

While browser-based deployment is the **recommended** approach for Total Serialism, this document outlines packaging options for users who prefer local installation and offline usage.

**Key Insight:** Total Serialism already works locally with zero installation! Simply cloning the repository and opening HTML files in a browser provides full functionality. This document focuses on making that experience even easier for non-technical users.

---

## Why Local Installation?

### Use Cases ✅
- **Offline Work**: No internet connection required
- **Privacy**: All processing and storage stays on local machine
- **Performance**: No network latency
- **Customization**: Easy to modify source code
- **Workshop/Education**: Distribute to students on USB drives
- **Air-Gapped Environments**: Secure or isolated systems

### Limitations ❌
- Manual updates (no auto-update)
- No community preset sharing (unless self-managed)
- Requires local web server for some features (file:// protocol limits)
- More complex for non-technical users

---

## Current State: Already Works Locally! ✅

### Zero Installation Method (Current)
```bash
# Clone repository
git clone https://github.com/username/total-serialism.git
cd total-serialism

# Option 1: Python simple server (works on Mac/Linux/Windows with Python)
python3 -m http.server 8000

# Option 2: Node.js serve (if Node installed)
npx serve .

# Option 3: Direct file:// protocol (limited features)
# Just open pen-plotter/algorithms/[any-algorithm].html in browser
```

**Works great for developers and technical users, but intimidating for artists/non-programmers.**

---

## Proposed Packaging Solutions

### Option 1: Standalone Electron App (RECOMMENDED) ⭐

**What is Electron?**
Cross-platform desktop application framework. Bundles Chromium browser + Node.js.
Used by: VS Code, Slack, Discord, Figma Desktop

**Advantages:**
- ✅ Native desktop app (.exe, .dmg, .AppImage)
- ✅ Double-click to launch - no terminal needed
- ✅ Can include built-in web server (no Python/Node setup)
- ✅ File system access (save/load from disk, not just localStorage)
- ✅ System tray integration
- ✅ Auto-update capability
- ✅ Native file dialogs for export
- ✅ Cross-platform (Windows, macOS, Linux)

**Disadvantages:**
- ❌ Large file size (~150MB per platform due to bundled Chromium)
- ❌ Requires build tooling (Electron Forge or Electron Builder)
- ❌ Code signing for macOS ($99/year Apple Developer account)
- ❌ Antivirus false positives possible (unsigned Windows .exe)

#### Implementation Steps

**Step 1: Initialize Electron Project**
```bash
# Create electron wrapper directory
mkdir total-serialism-app
cd total-serialism-app

# Initialize npm project
npm init -y

# Install Electron
npm install --save-dev electron
npm install --save-dev @electron-forge/cli
npx electron-forge import

# OR use Electron Builder
npm install --save-dev electron-builder
```

**Step 2: Create Main Process (main.js)**
```javascript
// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');

// Embedded web server (so file:// not needed)
const server = express();
server.use(express.static(path.join(__dirname, 'total-serialism')));
const PORT = 8765;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // Start local server
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    mainWindow.loadURL(`http://localhost:${PORT}/dashboard.html`);
  });

  // Dev tools (remove in production)
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

**Step 3: Configure package.json**
```json
{
  "name": "total-serialism",
  "version": "1.0.0",
  "description": "Generative Art & Pen Plotting Tool",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "package": "electron-builder",
    "package:mac": "electron-builder --mac",
    "package:win": "electron-builder --win",
    "package:linux": "electron-builder --linux"
  },
  "build": {
    "appId": "com.totalserialism.app",
    "productName": "Total Serialism",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "total-serialism/**/*",
      "assets/**/*"
    ],
    "mac": {
      "category": "public.app-category.graphics-design",
      "icon": "assets/icon.icns"
    },
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "category": "Graphics"
    }
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0"
  }
}
```

**Step 4: Copy Total Serialism Files**
```bash
# Copy entire repository into electron app
cp -r /path/to/total-serialism ./total-serialism

# OR use git submodule
git submodule add https://github.com/username/total-serialism.git total-serialism
```

**Step 5: Create Icons**
```bash
# macOS: icon.icns (1024x1024)
# Windows: icon.ico (256x256)
# Linux: icon.png (512x512)

# Use tool like: https://cloudconvert.com/png-to-icns
# Or: npm install -g electron-icon-maker
electron-icon-maker --input=icon.png --output=assets
```

**Step 6: Build for Distribution**
```bash
# Build for current platform
npm run package

# Build for all platforms (requires platform-specific tools)
npm run package:mac
npm run package:win
npm run package:linux

# Output in dist/ folder:
# - Total Serialism-1.0.0.dmg (macOS)
# - Total Serialism Setup 1.0.0.exe (Windows)
# - Total Serialism-1.0.0.AppImage (Linux)
```

**Effort Estimate:** 2-3 days initial setup, 1 day per platform testing
**File Size:** ~180MB per platform installer
**Cost:** $0 (or $99/year for macOS code signing)

---

### Option 2: Portable Web Server Bundle ⭐

**Concept:** Package Total Serialism with a tiny web server in a single folder. No installation, just extract and run.

**Advantages:**
- ✅ Much smaller than Electron (~20MB vs 180MB)
- ✅ No installation required
- ✅ Works on any platform
- ✅ Easy to update (replace files)
- ✅ Transparent (users see it's just HTML/JS)

**Disadvantages:**
- ❌ Not as polished as native app
- ❌ Requires running executable (antivirus concerns)
- ❌ No system integration (no desktop icon, etc.)

#### Windows Implementation: Mongoose Web Server

**Step 1: Download Mongoose**
```bash
# Mongoose is a tiny (~1MB) standalone web server
# Download from: https://cesanta.com/binary.html
# Or use alternative: https://github.com/lwithers/miniserve
```

**Step 2: Create Package Structure**
```
TotalSerialism-Portable/
├── START-Total-Serialism.bat          # Windows launcher
├── START-Total-Serialism.sh           # macOS/Linux launcher
├── mongoose.exe                       # Windows server (1MB)
├── mongoose                           # macOS/Linux server
├── README.txt                         # Instructions
└── total-serialism/                   # All HTML/JS files
    ├── dashboard.html
    ├── algorithm-catalog.json
    └── pen-plotter/
        └── algorithms/
```

**Step 3: Create Launcher Scripts**

**Windows (START-Total-Serialism.bat):**
```batch
@echo off
echo Starting Total Serialism...
echo.
echo Opening in your default browser at http://localhost:8765
echo.
echo IMPORTANT: Keep this window open while using Total Serialism
echo Close this window to stop the server
echo.

start http://localhost:8765/total-serialism/dashboard.html
mongoose.exe -listening_ports 8765 -document_root .

pause
```

**macOS/Linux (START-Total-Serialism.sh):**
```bash
#!/bin/bash
echo "Starting Total Serialism..."
echo ""
echo "Opening in your default browser at http://localhost:8765"
echo ""
echo "IMPORTANT: Keep this terminal open while using Total Serialism"
echo "Press Ctrl+C to stop"
echo ""

# Make mongoose executable
chmod +x mongoose

# Open browser
open http://localhost:8765/total-serialism/dashboard.html  # macOS
# xdg-open http://localhost:8765/total-serialism/dashboard.html  # Linux

# Start server
./mongoose -listening_ports 8765 -document_root .
```

**Step 4: Create README.txt**
```
==============================================
    TOTAL SERIALISM - Portable Edition
==============================================

QUICK START (Windows):
1. Double-click "START-Total-Serialism.bat"
2. Your browser will open automatically
3. Start creating!

QUICK START (macOS/Linux):
1. Open Terminal in this folder
2. Run: bash START-Total-Serialism.sh
3. Your browser will open automatically
4. Start creating!

IMPORTANT:
- Keep the console window open while using the app
- Close the window to stop the server
- Your presets are saved in your browser (localStorage)
- To backup presets, use Export All Presets button

TROUBLESHOOTING:
- Port 8765 already in use? Edit the .bat/.sh file to change port
- Antivirus blocking? Add exception for mongoose.exe
- macOS "unidentified developer"? Right-click > Open

For more info: https://github.com/username/total-serialism
==============================================
```

**Step 5: Package for Distribution**
```bash
# Create ZIP file
zip -r TotalSerialism-Portable-v1.0.0.zip TotalSerialism-Portable/

# Or use 7-Zip on Windows
7z a TotalSerialism-Portable-v1.0.0.zip TotalSerialism-Portable\
```

**Effort Estimate:** 1 day
**File Size:** ~25MB compressed
**Cost:** $0

---

### Option 3: Docker Container (For Advanced Users)

**Use Case:** Developers, self-hosters, enterprise deployments

**Dockerfile:**
```dockerfile
FROM nginx:alpine

# Copy Total Serialism files
COPY . /usr/share/nginx/html

# Expose port
EXPOSE 80

# Nginx automatically serves static files
CMD ["nginx", "-g", "daemon off;"]
```

**Build and Run:**
```bash
# Build image
docker build -t total-serialism:latest .

# Run container
docker run -d -p 8080:80 --name total-serialism total-serialism:latest

# Access at http://localhost:8080
```

**Docker Compose:**
```yaml
# docker-compose.yml
version: '3'
services:
  total-serialism:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

**Effort Estimate:** 1 hour
**Audience:** Technical users only

---

### Option 4: USB Drive Distribution

**Use Case:** Workshops, classrooms, conferences

**Preparation:**
```bash
# Create portable bundle (Option 2)
# Copy to USB drive with autorun (Windows only)

USB-Drive/
├── AUTORUN.INF                        # Windows auto-launch
├── START-Total-Serialism.bat
├── mongoose.exe
├── README.txt
└── total-serialism/
```

**AUTORUN.INF (Windows):**
```ini
[autorun]
open=START-Total-Serialism.bat
icon=total-serialism\assets\icon.ico
label=Total Serialism
```

**Note:** Autorun disabled by default in modern Windows for security. Users still need to manually launch.

**Effort Estimate:** 30 minutes (after portable bundle created)

---

## Comparison Matrix

| Solution | File Size | Setup Difficulty | User Experience | Update Process | Cost |
|----------|-----------|------------------|-----------------|----------------|------|
| **Web (Recommended)** | 0 | None | ⭐⭐⭐⭐⭐ | Automatic | $0 |
| **Git Clone** | 50MB | Medium | ⭐⭐⭐ | `git pull` | $0 |
| **Electron App** | 180MB | Easy | ⭐⭐⭐⭐⭐ | Auto-update | $0-$99 |
| **Portable Bundle** | 25MB | Very Easy | ⭐⭐⭐⭐ | Replace files | $0 |
| **Docker** | 50MB | Hard | ⭐⭐⭐ | `docker pull` | $0 |
| **USB Drive** | 25MB | Very Easy | ⭐⭐⭐⭐ | Replace USB | $0 |

---

## Recommended Approach

### Primary: Web Deployment (GitHub Pages)
**For:** 90% of users
**Why:** Zero setup, always updated, works everywhere

### Secondary: Portable Bundle
**For:** Offline users, workshops, education
**Why:** Easy distribution, no installation, cross-platform

### Tertiary: Electron App (Future)
**For:** Users wanting "real" desktop app experience
**Why:** Polish and integration, but significant development effort

---

## Distribution Strategy

### Tier 1: GitHub Repository (Always Available)
```
Users can always:
git clone https://github.com/username/total-serialism.git
```

### Tier 2: Web Version (Primary Recommendation)
```
Visit: https://totalserialism.art
No installation required!
```

### Tier 3: Portable Bundle (Secondary)
```
Download: TotalSerialism-Portable-v1.0.0.zip (25MB)
Extract and run - works offline!
```

### Tier 4: Electron App (Future Enhancement)
```
Download: Total-Serialism-Setup.exe (180MB)
Full desktop application experience
```

---

## Implementation Priority

### Phase 1: Current State (DONE ✅)
- Repository cloneable and works locally
- File:// protocol support
- Basic README instructions

### Phase 2: Portable Bundle (1-2 days) 🎯 RECOMMENDED FIRST
- Create launcher scripts
- Bundle with Mongoose
- Write comprehensive README
- Test on Windows, macOS, Linux
- Create GitHub Release with downloadable ZIP

### Phase 3: Documentation (1 day)
- Update README with download options
- Create video walkthrough (optional)
- Write troubleshooting guide

### Phase 4: Electron App (1-2 weeks) - FUTURE
- Set up Electron project
- Build for all platforms
- Code signing (macOS)
- Auto-update mechanism
- GitHub Releases integration

---

## Portable Bundle - Detailed Implementation

### Complete Build Script
```bash
#!/bin/bash
# build-portable.sh

VERSION="1.0.0"
BUILD_DIR="TotalSerialism-Portable-v${VERSION}"

echo "Building Total Serialism Portable v${VERSION}..."

# Create directory structure
mkdir -p "${BUILD_DIR}"

# Copy Total Serialism files
cp -r ../pen-plotter "${BUILD_DIR}/"
cp ../algorithm-catalog.json "${BUILD_DIR}/"
cp ../preset-manager.js "${BUILD_DIR}/"
cp ../preset-manager.css "${BUILD_DIR}/"
cp ../ui-utils.js "${BUILD_DIR}/"
cp ../export-utils.js "${BUILD_DIR}/"

# Create dashboard
cp ../dashboard.html "${BUILD_DIR}/"

# Download Mongoose web server
echo "Downloading Mongoose web server..."
curl -L https://github.com/cesanta/mongoose/releases/download/7.11/mongoose-7.11.exe \
     -o "${BUILD_DIR}/mongoose.exe"
curl -L https://github.com/cesanta/mongoose/releases/download/7.11/mongoose-7.11 \
     -o "${BUILD_DIR}/mongoose"
chmod +x "${BUILD_DIR}/mongoose"

# Create launcher scripts
cat > "${BUILD_DIR}/START-Total-Serialism.bat" << 'EOF'
@echo off
title Total Serialism
echo ==========================================
echo    TOTAL SERIALISM - Generative Art Tool
echo ==========================================
echo.
echo Starting local server...
echo Opening browser at http://localhost:8765
echo.
echo KEEP THIS WINDOW OPEN while using the app
echo Close window to stop server
echo.
echo ==========================================

start http://localhost:8765/dashboard.html
mongoose.exe -listening_ports 8765 -document_root .

pause
EOF

cat > "${BUILD_DIR}/START-Total-Serialism.sh" << 'EOF'
#!/bin/bash
echo "=========================================="
echo "   TOTAL SERIALISM - Generative Art Tool"
echo "=========================================="
echo ""
echo "Starting local server..."
echo "Opening browser at http://localhost:8765"
echo ""
echo "KEEP THIS TERMINAL OPEN while using the app"
echo "Press Ctrl+C to stop server"
echo ""
echo "=========================================="

chmod +x mongoose

# Detect OS and open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:8765/dashboard.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:8765/dashboard.html
fi

./mongoose -listening_ports 8765 -document_root .
EOF

chmod +x "${BUILD_DIR}/START-Total-Serialism.sh"

# Create README
cat > "${BUILD_DIR}/README.txt" << 'EOF'
==============================================
    TOTAL SERIALISM v1.0.0
    Generative Art & Pen Plotting Tool
==============================================

QUICK START:

  Windows:
    1. Double-click "START-Total-Serialism.bat"
    2. Browser opens automatically
    3. Start creating!

  macOS/Linux:
    1. Open Terminal in this folder
    2. Run: bash START-Total-Serialism.sh
    3. Browser opens automatically
    4. Start creating!

FEATURES:
  • 74 generative art algorithms
  • Save/load presets
  • Export to SVG (pen plotter ready) or PNG
  • No internet connection required
  • All processing happens locally in your browser

IMPORTANT NOTES:
  • Keep the server window/terminal open
  • Close it to stop the app
  • Presets saved in browser localStorage
  • Use "Export Presets" to backup

TROUBLESHOOTING:
  • Port in use? Edit launcher to change 8765 to another number
  • Antivirus warning? Add exception for mongoose
  • macOS security? Right-click mongoose > Open

MORE INFO:
  GitHub: https://github.com/username/total-serialism
  Docs: [URL to documentation]
  Issues: [URL to issue tracker]

==============================================
EOF

# Create manifest
cat > "${BUILD_DIR}/VERSION.txt" << EOF
Total Serialism Portable
Version: ${VERSION}
Build Date: $(date +%Y-%m-%d)
Included Algorithms: 74
License: [Your License]
EOF

# Package
echo "Creating ZIP archive..."
zip -r "TotalSerialism-Portable-v${VERSION}.zip" "${BUILD_DIR}"

echo ""
echo "Build complete!"
echo "Output: TotalSerialism-Portable-v${VERSION}.zip"
echo "Size: $(du -sh "TotalSerialism-Portable-v${VERSION}.zip" | cut -f1)"
```

### Testing Checklist
- [ ] Extracts correctly on Windows
- [ ] Extracts correctly on macOS
- [ ] Extracts correctly on Linux
- [ ] Windows .bat launches browser
- [ ] macOS .sh launches browser
- [ ] Linux .sh launches browser
- [ ] All 74 algorithms load
- [ ] Presets save/load correctly
- [ ] SVG export works
- [ ] PNG export works
- [ ] No console errors
- [ ] Works offline (disconnect internet)

---

## Update Mechanism

### Web Version (Automatic)
```
User visits URL → Always gets latest version ✅
```

### Portable Bundle (Manual)
```markdown
## Updating Total Serialism Portable

1. Download latest version from: [URL]
2. Extract new version to new folder
3. (Optional) Copy presets from old version:
   - Export presets from old version (Export All button)
   - Import presets in new version

OR:

1. Keep old folder
2. Replace files from new download (don't replace launcher scripts)
3. Presets automatically preserved (browser localStorage)
```

### Electron App (Automatic)
```javascript
// Use electron-updater
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();
```

---

## Licensing Considerations

### If Open Source (Recommended):
```
MIT License or GPL
- Include LICENSE file
- Mention p5.js license
- Credit dependencies
```

### If Commercial:
```
- End User License Agreement (EULA)
- Terms of Service
- Privacy Policy (even if offline, explain localStorage)
```

---

## Distribution Channels

### GitHub Releases
```bash
# Create release on GitHub
gh release create v1.0.0 \
  TotalSerialism-Portable-v1.0.0.zip \
  --title "Total Serialism v1.0.0 - Portable Edition" \
  --notes "Release notes here"
```

### itch.io (For Creative Tools)
- Great for indie creative tools
- Pay-what-you-want option
- Built-in download management
- Community features

### Gumroad (For Commercial)
- Payment processing
- License key management
- Analytics

---

## Cost Analysis

### Portable Bundle (Recommended)
- **Development:** 1-2 days (~$0 if DIY)
- **Maintenance:** Minimal (update scripts rarely)
- **Distribution:** Free (GitHub Releases)
- **Total:** $0

### Electron App
- **Development:** 1-2 weeks (~$0 if DIY)
- **Code Signing:** $99/year (macOS only)
- **Distribution:** Free (GitHub Releases)
- **Total:** $0-$99/year

### Docker
- **Development:** 1 hour
- **Distribution:** Free (Docker Hub)
- **Total:** $0

---

## Recommendation

**Don't overthink local installation!**

### Immediate Action (This Week):
1. **Create Portable Bundle** (1-2 days)
   - Use Mongoose web server
   - Create launcher scripts
   - Write clear README
   - Test on all platforms
   - Upload to GitHub Releases

2. **Update Main README** (1 hour)
   ```markdown
   ## Download & Installation

   ### Option 1: Web Version (Recommended)
   Visit https://totalserialism.art - no installation needed!

   ### Option 2: Portable Offline Version
   Download: [TotalSerialism-Portable-v1.0.0.zip](link)
   Extract and run - works without internet!

   ### Option 3: Clone Repository
   ```bash
   git clone https://github.com/username/total-serialism.git
   ```

### Future Enhancement (If Demand Exists):
- **Electron App** for users who want "real" app experience
- Only build if community requests it
- Not essential given web version works so well

---

## Success Metrics

### Portable Bundle
- [ ] Downloads > 50 in first month
- [ ] <5% support requests related to installation
- [ ] Works on Windows 10+, macOS 10.14+, Ubuntu 20.04+
- [ ] ZIP size < 30MB
- [ ] README rated as clear/helpful

### User Feedback Goals
- "Easy to install" - 90% of users
- "Works offline perfectly" - 95% of users
- "Instructions were clear" - 90% of users

---

## Conclusion

**Local installation is already supported** via git clone. Creating a **Portable Bundle** with embedded web server is the easiest way to make it even more accessible for non-technical users.

**Recommendation:**
1. ✅ **Portable Bundle** - Build this week (low effort, high value)
2. ⏸️ **Electron App** - Defer until proven demand (high effort, moderate value)
3. ✅ **Web Version** - Primary distribution (already planned)

**Most users will use the web version. Portable bundle serves the 10-20% who need offline access.**

---

**Document Version:** 1.0
**Last Updated:** 2025-11-12
**Status:** Portable Bundle recommended for Phase 1
