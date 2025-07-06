# Fresh Start Instructions

## The Problem
Chrome is caching an old version of the extension with syntax errors, even though the files are fixed.

## Solution: Complete Fresh Install

### Step 1: Remove Old Extension Completely
1. Go to chrome://extensions
2. Find "Otter Order Consolidator" 
3. Click "Remove" (not just disable)
4. Close ALL Chrome tabs

### Step 2: Clear Chrome Cache
1. Press Ctrl+Shift+Delete
2. Select "Cached images and files"
3. Click "Clear data"

### Step 3: Rename Extension Folder
1. Close Chrome completely
2. Rename the folder from:
   `otter-order-consolidator`
   to:
   `otter-order-consolidator-v2`

### Step 4: Install Fresh
1. Open Chrome
2. Go to chrome://extensions
3. Enable Developer mode
4. Click "Load unpacked"
5. Select the renamed folder `otter-order-consolidator-v2`

### Step 5: Test
1. Open https://app.tryotter.com/orders
2. Press F12 to open console
3. You should see "Version: Fixed syntax errors - 2024"

## Alternative: Force Chrome to Reload

If renaming doesn't work, try this:

1. Open the extension folder
2. Edit manifest.json
3. Change version from "1.0.0" to "1.0.1"
4. Save the file
5. Reload extension in chrome://extensions

This forces Chrome to treat it as a new version and reload all files.