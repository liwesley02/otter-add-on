# Otter Order Consolidator v5

A Chrome extension that consolidates and organizes restaurant orders from tryotter.com with intelligent prep time tracking to optimize kitchen operations and improve order fulfillment efficiency.

## 🎯 Project Purpose

This extension solves a critical problem in restaurant order management by:
- **Consolidating orders** from Otter's dashboard into organized batches
- **Categorizing items** by type, protein, and preparation requirements
- **Optimizing kitchen workflow** by grouping similar items together
- **Reducing errors** by providing clear, organized views of what needs to be prepared

The goal is to transform a chaotic list of individual orders into an organized, kitchen-friendly format that shows exactly what needs to be cooked, in what quantities, with all relevant modifications clearly displayed.

## 📊 Current Implementation Status

### ✅ Working Features
- React data extraction from Otter dashboard
- Basic order batching and grouping
- Real-time order monitoring
- Multi-tab synchronization (leader/follower)
- Rice type badge display (White Rice, Fried Rice, Garlic Butter, Noodles)
- Two-column layout for better space usage
- Completed order detection and removal
- **NEW in v5**: Intelligent prep time tracking and analytics
- **NEW in v5**: Real-time average prep time display
- **NEW in v5**: Estimated completion times for batches
- **NEW in v5**: Visual indicators for orders running late
- **NEW in v5**: Historical prep time data (7-day retention)

### 🚧 In Progress
- Three-level hierarchy implementation (Size/Type → Protein → Sauce)
- Proper protein-based categorization for rice bowls
- Comprehensive modifier extraction and display

### ❌ Known Issues
1. **Rice bowls grouped incorrectly**: Currently grouped by size (Small/Large) instead of protein type
2. **Duplicate items**: Same items appearing in both their category and "Other"
3. **Data loss in pipeline**: Rich modifier data extracted but not passed to categorization
4. **Missing protein grouping**: Items not properly organized by protein type within categories

## 📋 Intended Hierarchy Structure

The extension should organize items in a three-level hierarchy:

### Level 1: Size/Type Categories
```
├── Large
├── Small  
├── Large - Garlic Butter Fried Rice
├── Small - Garlic Butter Fried Rice
├── Large - Stir Fry Noodles
├── Small - Stir Fry Noodles
├── Urban Bowls
├── Desserts
├── Appetizers
├── Sides
├── Dumplings
└── Drinks
```

### Level 2: Protein Subcategories (for bowls)
```
Rice Bowls
├── Tofu
├── Grilled Chicken
├── Crispy Chicken
├── Steak
├── Salmon
├── Shrimp
├── Crispy Fish
└── Cauliflower Nugget
```

### Level 3: Sauce Variants
```
Grilled Chicken Rice Bowls
├── Sesame Aioli
├── Garlic Aioli
├── Sweet Shoyu
├── Orange Sauce
└── Chipotle Aioli
```

## 🏗️ Architecture Overview

### Key Components

1. **pageContextExtractor.js** - Runs in page context to access React internals
2. **reactDataExtractor.js** - Processes React fiber data into order information
3. **categoryManager.js** - Handles item categorization logic
4. **orderBatcher.js** - Groups orders into batches
5. **overlay.js** - Renders the UI overlay
6. **content.js** - Main content script coordinator

### Data Flow
```
React Fiber Tree → pageContextExtractor → reactDataExtractor → 
→ categoryManager → orderBatcher → overlay (UI)
```

### Important Data Structures

```javascript
// Order Item Structure
{
  name: "Crispy Chipotle Aioli Chicken Rice Bowl",
  size: "large - garlic butter fried rice substitute",
  quantity: 1,
  modifiers: {
    proteinType: "Crispy Chicken",
    sauceType: "Chipotle Aioli",
    riceSubstitution: "Garlic Butter Fried Rice"
  },
  categoryInfo: {
    topCategory: "riceBowls",
    subCategory: "crispy-chicken",
    sauce: "Chipotle Aioli"
  }
}
```

## 🔧 Developer Guidelines

### Getting Started

1. **Read these files first**:
   - `CLAUDE.md` - Guidelines for AI agents
   - `MENU_FINDINGS.md` - Detailed menu structure analysis
   - `projectplan.md` - Project roadmap and architecture

2. **Key concepts to understand**:
   - React Fiber extraction
   - Modifier classification (integrated vs separate items)
   - Three-level hierarchy structure
   - Batch management system

### Common Pitfalls

1. **Don't filter modifiers too early** - All modifier data is needed for categorization
2. **Preserve modifier context** - Section names indicate if items should be separate
3. **Test with complex orders** - Urban bowls and items with multiple modifiers
4. **Check for data loss** - Ensure extracted data flows through entire pipeline

### Making Changes

1. **Always preserve existing data** - Don't remove fields, add new ones
2. **Test extraction first** - Use `window.__otterExtractOrders()` in console
3. **Check categorization** - Verify items appear in correct categories
4. **Validate UI rendering** - Ensure hierarchy displays correctly

## 🧪 Testing

### Manual Testing Checklist
- [ ] Rice bowls group by protein, not size
- [ ] Urban bowls show with correct modifiers
- [ ] Add-on items (drinks, desserts) appear as separate items
- [ ] No duplicate items across categories
- [ ] Protein badges display correctly
- [ ] Rice type badges show appropriate colors
- [ ] Completed orders are removed after 30 seconds

### Debug Commands

```javascript
// Test React extraction
window.otterReactDataExtractor.extractOrders()

// Check category for specific item
categoryManager.categorizeItem("Crispy Chicken Rice Bowl", "large")

// View current batch data
window.otterOverlayUI.batchManager.getAllBatches()

// Force UI refresh
window.otterOverlayUI.render()
```

## 📚 Additional Documentation

- **[CLAUDE.md](CLAUDE.md)** - Guidelines for AI agents working on this project
- **[MENU_FINDINGS.md](MENU_FINDINGS.md)** - Detailed analysis of Otter's menu structure
- **[projectplan.md](projectplan.md)** - Technical roadmap and implementation details
- **[ORDER_HIERARCHY.md](ORDER_HIERARCHY.md)** - Detailed hierarchy specifications (TODO)

## 🚀 Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `otter-order-consolidator-v3` folder

## 💡 Usage

1. Navigate to `https://app.tryotter.com/orders`
2. The extension will automatically activate
3. Orders will be consolidated in the right sidebar
4. Use keyboard shortcuts for additional features:
   - **Ctrl+Shift+O**: Toggle overlay visibility
   - **Ctrl+Shift+L**: Force leader mode
   - **Ctrl+Shift+I**: Show diagnostics

## 🤝 Contributing

When contributing to this project:

1. **Understand the current issues** - See "Known Issues" section above
2. **Follow the hierarchy structure** - Maintain the three-level organization
3. **Preserve data integrity** - Don't lose modifier information in the pipeline
4. **Test thoroughly** - Use the testing checklist
5. **Document changes** - Update relevant documentation

## 📈 Future Enhancements

- API integration when available
- Kitchen performance metrics
- Order prediction and prep time estimates
- Multi-location support
- Export functionality for reporting

## 🐛 Troubleshooting

### Orders not showing
1. Check if you're on the correct URL: `https://app.tryotter.com/orders`
2. Verify React extraction: `window.reactExtractionSuccessful`
3. Check console for errors (F12)

### Wrong categorization
1. Enable debug mode: `window.otterReactDataExtractor.enableDebug()`
2. Check modifier extraction in console logs
3. Verify categoryManager is receiving complete item data

### Performance issues
1. Check batch size settings (default: 5 orders)
2. Clear completed orders regularly
3. Refresh page if memory usage is high

## 📝 Version History

- **v3.2.0** (In Development): Three-level hierarchy implementation
- **v3.1.0**: Fixed data overwriting, improved React integration
- **v3.0.0**: React fiber extraction and page context injection
- **v2.0.0**: Batch system with visual indicators
- **v1.0.0**: Initial wave-based consolidation