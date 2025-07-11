# Otter Order Consolidator Mobile Add-on

A powerful Tampermonkey userscript that enhances the Otter (tryotter.com) food ordering platform with advanced order management, batch processing, and label printing capabilities. Optimized for Firefox Mobile and tablet devices.

## Purpose

The Otter Order Consolidator streamlines restaurant operations by automating order processing workflows. It consolidates multiple orders from the same customer, organizes items by category, and enables efficient batch label printing - saving valuable time during busy service periods.

## Key Features

### Order Consolidation
- Automatically detects and groups orders from the same customer
- Intelligent item matching across multiple orders
- Reduces duplicate preparation work in the kitchen
- Visual indicators for consolidated order groups

### Batch Label Printing
- Generate professional labels formatted for Avery 5163/8163 sheets (2" x 4")
- Includes customer name, item details, modifiers, and special instructions
- Restaurant logo support on labels
- Optimized print layouts with proper margins and color adjustment
- Preview labels before printing

### Smart Organization
- **Category Management**: Organize items by type (appetizers, entrees, desserts, etc.)
- **Preparation Time Tracking**: Monitor and prioritize time-sensitive orders
- **Batch Processing**: Handle multiple orders simultaneously
- **Custom Categories**: Create and manage your own item categories

### Mobile-First Design
- Touch-friendly interface with large, accessible buttons
- Visual loading indicators and real-time status updates
- Responsive design for phones and tablets
- Manual trigger button for easy access
- Works seamlessly with Firefox Mobile

## Installation

1. **Install Tampermonkey**
   - Firefox Mobile: Install from Firefox Add-ons
   - Firefox Desktop: Install from [Firefox Add-ons Store](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)

2. **Add the Script**
   - Open `otter-consolidator-mobile.user.js` in this repository
   - Click "Raw" to view the raw script
   - Tampermonkey should prompt to install the script
   - Alternatively, copy the script content and create a new script in Tampermonkey

3. **Verify Installation**
   - Navigate to [tryotter.com](https://tryotter.com)
   - Log in to your account
   - Go to the Orders page
   - Look for the "Open Consolidator" button

## How to Use

1. **Access the Consolidator**
   - Navigate to your Otter orders page
   - Click the "Open Consolidator" button that appears
   - The consolidator overlay will open

2. **Select Orders**
   - Review the list of available orders
   - Select orders you want to consolidate (same-customer orders are highlighted)
   - Click "Consolidate Selected Orders"

3. **Print Labels**
   - Review the consolidated order details
   - Click "Print Labels" to generate batch labels
   - Preview the labels in the new window
   - Print using Avery 5163/8163 label sheets

4. **Manage Categories**
   - Access category settings from the main interface
   - Create custom categories for your menu items
   - Assign items to categories for better organization

## Technical Architecture

### Core Components

- **`OrderConsolidator`**: Main orchestrator managing the entire workflow
- **`ItemMatcher`**: Intelligent matching of similar items across orders
- **`OrderBatcher`**: Groups orders for efficient batch processing
- **`CategoryManager`**: Handles item categorization and custom categories
- **`BatchLabelPrinter`**: Generates and formats labels for printing
- **`PrepTimeTracker`**: Monitors and displays preparation times

### Data Flow

1. **Order Detection**: Monitors Otter page for new orders
2. **Data Extraction**: Extracts order details from React components
3. **Consolidation**: Groups orders by customer and matches items
4. **Label Generation**: Creates formatted labels with all necessary information
5. **Print Output**: Generates print-ready pages optimized for label sheets

### Storage

- Uses Tampermonkey's GM storage API for persistent settings
- Provides Chrome storage API compatibility for seamless integration
- Stores user preferences, custom categories, and session data

## Configuration

The script includes configurable options accessible through the consolidator interface:

- **Label Format**: Customize label appearance and information
- **Category Settings**: Manage food categories and assignments
- **Print Options**: Adjust margins and layout for your printer
- **API Settings**: Configure integration with external services

## Troubleshooting

### Common Issues

1. **Button Not Appearing**
   - Ensure you're on the correct Otter orders page
   - Check that Tampermonkey is enabled
   - Refresh the page

2. **Labels Not Printing Correctly**
   - Verify printer settings match Avery 5163/8163 format
   - Check print preview before printing
   - Ensure no scaling is applied in print dialog

3. **Orders Not Consolidating**
   - Verify customer names match exactly
   - Check that orders are within the time window
   - Ensure orders haven't been previously processed

### Debug Mode

For troubleshooting, use the simplified debug version:
- `otter-mobile-simplified.user.js` - Basic functionality for testing
- `firefox-mobile-debug-guide.md` - Detailed troubleshooting guide

## Security & Privacy

- All data processing happens locally in your browser
- No order information is sent to external servers
- API communication only with Otter's official endpoints
- Secure storage of preferences using Tampermonkey's sandboxed environment

## Version History

- **v4.7.0** (Current) - Stable production version with full feature set
- **v4.6.0** - Known working version with core functionality
- **v4.5.0** - Fixed critical Firefox mobile UI visibility issues
- **v4.4.0** - Complete mobile/tablet optimization

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test thoroughly on Firefox Mobile
4. Submit a pull request with clear description

## License

This project is provided as-is for use with the Otter platform. Please ensure compliance with Otter's terms of service when using this tool.

## Acknowledgments

Built to help restaurant staff work more efficiently. Special thanks to all the kitchen teams who provided feedback and testing.

---

**Note**: This is an unofficial add-on and is not affiliated with or endorsed by Otter. Use at your own discretion.

