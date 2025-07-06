# How to Fix the Extension - Quick Guide

## The Problem
Your tab is in "Follower" mode waiting for a leader tab that doesn't exist.

## The Solution

### Step 1: Reload the Extension
1. Go to `chrome://extensions`
2. Find "Otter Order Consolidator"
3. Click the refresh icon
4. Go back to https://app.tryotter.com/orders

### Step 2: Force Leader Mode
After the page loads, use ONE of these methods:

#### Method A: Keyboard Shortcut (Easiest)
Press **Ctrl+Shift+L** to force this tab to become the leader

#### Method B: Console Command
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Type: `otterDebug.forceLeader()`
4. Press Enter

You should see:
- A green notification saying "This tab is now the LEADER"
- The mode indicator (🔍) turns green
- Orders start extracting automatically

### Step 3: If Orders Don't Show
After forcing leader mode, if orders don't appear:
1. Click the refresh button (🔄) in the sidebar
2. Or in console: `otterDebug.extractOrders()`

## Debug Commands Available

Open Chrome console (F12) and use these commands:

```javascript
// Check status
otterDebug.status()

// Force leader mode
otterDebug.forceLeader()

// Reset everything
otterDebug.reset()

// Extract orders manually
otterDebug.extractOrders()

// Show current orders
otterDebug.showOrders()

// Show/hide sidebar
otterDebug.toggleSidebar()

// Get help
otterDebug.help()
```

## Keyboard Shortcuts
- **Ctrl+Shift+L** - Force leader mode (NEW!)
- **Ctrl+Shift+O** - Toggle sidebar visibility
- **Ctrl+Shift+N** - Export network findings

## Still Having Issues?

1. Check the console for errors
2. Make sure you're on https://app.tryotter.com/orders (not a specific order page)
3. Try `otterDebug.reset()` then `otterDebug.forceLeader()`

The Apollo/GraphQL errors from Otter's website are normal and won't affect the extension.