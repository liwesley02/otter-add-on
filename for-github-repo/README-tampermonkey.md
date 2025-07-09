# Otter Order Consolidator v4 - Tampermonkey Edition

This is a tablet-compatible version of the Otter Order Consolidator Chrome extension, converted to work as a Tampermonkey userscript.

## Features
- Works on tablets (iPad Safari, Android Chrome/Firefox)
- All core functionality from the Chrome extension
- Single-tab operation (simplified from multi-tab sync)
- Touch-friendly interface
- No browser extension required - just Tampermonkey

## Installation

### Prerequisites
1. Install Tampermonkey on your tablet browser:
   - **iOS (Safari)**: [Tampermonkey from App Store](https://apps.apple.com/app/tampermonkey/id1482490089)
   - **Android**: Install Tampermonkey extension in Firefox or Kiwi Browser

### Install the Userscript
1. Open `otter-order-consolidator.user.js` in a text editor
2. Copy the entire content
3. Open Tampermonkey dashboard
4. Click "Create a new script"
5. Replace the default content with the copied code
6. Save (Ctrl+S or Cmd+S)

## Usage
1. Navigate to https://app.tryotter.com
2. The consolidator will automatically initialize
3. Use the interface to batch orders and print labels

## Building from Source
If you need to rebuild the userscript:

```bash
cd v4-tampermonkey
node build-userscript.js
```

This will combine all the Chrome extension scripts into a single userscript file.

## Differences from Chrome Extension
- **Single Tab**: No multi-tab synchronization (simpler for tablets)
- **Storage**: Uses Tampermonkey's GM storage instead of Chrome storage
- **Label Printing**: Opens in new tab/window (tablet print dialog)
- **No Background Script**: All functionality runs in the content script

## Troubleshooting
- **Script not running**: Check Tampermonkey is enabled for tryotter.com
- **Storage issues**: Clear Tampermonkey storage for this script
- **Print issues**: Ensure pop-ups are allowed for tryotter.com

## Development
To modify the userscript:
1. Edit the source files in `otter-order-consolidator-v4/`
2. Run `node build-userscript.js` to rebuild
3. Copy the new version to Tampermonkey

## API Configuration
The userscript maintains compatibility with the KDS API:
- Default: http://localhost:8000
- Configure in the auth modal when prompted