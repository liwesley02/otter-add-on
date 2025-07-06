# Icon Files

This directory contains placeholder icons for the Otter Order Consolidator extension.

## Required Icon Files:
- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels  
- `icon128.png` - 128x128 pixels

## Creating Icons:
To generate the PNG files from the SVG source:

1. Use an online SVG to PNG converter (e.g., https://cloudconvert.com/svg-to-png)
2. Or use ImageMagick: 
   ```bash
   convert -density 1200 -resize 16x16 icon.svg icon16.png
   convert -density 1200 -resize 48x48 icon.svg icon48.png
   convert -density 1200 -resize 128x128 icon.svg icon128.png
   ```
3. Or use any image editor to export the SVG at different sizes

## Icon Design:
- Green background (#2E8B57)
- White "O" letter (for Otter)
- White "v3" text below
- Rounded corners for modern look

## Note:
These are placeholder icons. Replace with professional icons before publishing to Chrome Web Store.