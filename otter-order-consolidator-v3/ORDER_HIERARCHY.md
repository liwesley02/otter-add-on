# Order Hierarchy Documentation

## Overview

The Otter Order Consolidator organizes orders in a multi-level hierarchy designed to optimize kitchen operations. This document details the hierarchy structure, categorization logic, and special handling rules.

## Hierarchy Structure

### Primary Level: Bowl/Item Type

The top level groups items by their primary type or size category:

1. **Rice Bowls** - All rice bowl variations
2. **Urban Bowls** - Special urban bowl combinations  
3. **Large** - Large-sized items (non-bowls)
4. **Small** - Small-sized items (non-bowls)
5. **Large - Garlic Butter Fried Rice** - Large bowls with garlic butter fried rice substitution
6. **Small - Garlic Butter Fried Rice** - Small bowls with garlic butter fried rice substitution
7. **Large - Stir Fry Noodles** - Large bowls with noodle substitution
8. **Small - Stir Fry Noodles** - Small bowls with noodle substitution
9. **Appetizers** - Starter items
10. **Dumplings** - All dumpling varieties
11. **Sides** - Side dishes
12. **Desserts** - Sweet items and treats
13. **Drinks** - Beverages
14. **Other** - Uncategorized items

### Secondary Level: Protein Type

For rice bowls and urban bowls, items are further grouped by protein:

- **Tofu**
- **Grilled Chicken**
- **Crispy Chicken**
- **Steak**
- **Salmon**
- **Shrimp**
- **Crispy Fish**
- **Cauliflower Nugget**

### Tertiary Level: Sauce (Display Only)

Sauces are shown as additional information but don't create separate groupings:

- Sesame Aioli
- Garlic Aioli
- Chipotle Aioli
- Jalapeño Herb Aioli
- Sweet Sriracha Aioli
- Sweet Shoyu
- Orange Sauce
- Teriyaki
- Spicy Yuzu
- Garlic Sesame Fusion

## Categorization Logic

### Rice Bowls

1. **Detection**: Items containing "rice bowl" in the name
2. **Primary Category**: Always "Rice Bowls"
3. **Subcategory**: Determined by protein type extracted from:
   - Passed `proteinType` parameter
   - Item name analysis (fallback)
4. **Rice Type**: Shown as badge based on size/modifier information:
   - White Rice (default)
   - Garlic Butter Fried Rice
   - Fried Rice
   - Stir Fry Noodles

### Urban Bowls

1. **Detection**: Items containing "urban bowl" in the name
2. **Primary Category**: Always "Urban Bowls"
3. **Subcategory**: Protein type (same as rice bowls)
4. **Special Modifiers**:
   - Choice of 3 dumplings (tracked but not used for categorization)
   - Rice substitution options (displayed as badge)
   - Required sauce selection

### Size-Based Items (Legacy)

Items not recognized as bowls but with size information:
- Categorized by size first (Large/Small + modifier)
- Then by protein if applicable

### Other Categories

Non-bowl items are categorized by keywords:
- **Appetizers**: "crab rangoon", "spring roll", "egg roll"
- **Dumplings**: Items containing "dumpling"
- **Desserts**: "bao-nut", "cinnamon", "sweet treat"
- **Drinks**: "tea", "coffee", "soda", "juice", "water"
- **Sides**: "waffle fries", standalone rice items

## Modifier Handling

### Integrated Modifiers

These modify the base item and stay grouped:
- Size selections (Large/Small)
- Rice substitutions
- Sauce choices
- Protein swaps within same category

### Separate Items

These create new line items:
- "Add Drink" modifiers
- "Add Dessert" modifiers
- "Side Addition" modifiers
- Items from "Add" sections

## Display Rules

### Badges

Items display badges for quick identification:
- **Protein Badge**: Shows protein type for bowls
- **Rice Type Badge**: Color-coded by substitution:
  - White (default white rice)
  - Orange (garlic butter fried rice)
  - Yellow (fried rice)
  - Purple (noodles)

### Grouping

1. Items with identical name, size, and modifiers are consolidated
2. Quantity shown as multiplier (e.g., "×3")
3. Orders contributing to each item are tracked

### Sort Order

1. Categories appear in predefined order (bowls first)
2. Within categories, sorted by total quantity (descending)
3. Proteins appear in culinary order (vegetarian → poultry → red meat → seafood)

## Special Cases

### Steak & Salmon Bowls
- Always require sauce selection
- Sauce is required modifier, not optional

### Urban Bowls
- Require 3 dumpling selections
- Support rice/noodle substitution
- Must have sauce selection

### Modifier Conflicts
- If item appears in multiple categories, it's deduplicated
- Priority given to most specific category match
- "Other" is always last resort

## Data Flow

1. **Extraction**: React components → Item details with modifiers
2. **Categorization**: CategoryManager assigns hierarchy levels
3. **Batching**: OrderBatcher groups identical items
4. **Display**: Overlay renders hierarchical structure

## Configuration

Key configuration points:
- Category definitions: `categoryManager.js` → `topCategories`
- Protein mappings: `categoryManager.js` → `proteinCategories`
- Display order: `overlay.js` → `categoryOrder`
- CSS styling: `overlay.css` → category-specific classes

## Debugging

To debug categorization issues:

```javascript
// Check item categorization
categoryManager.categorizeItem("Crispy Chicken Rice Bowl", "large", {
  proteinType: "Crispy Chicken",
  sauce: "Sesame Aioli"
});

// View current hierarchy
window.otterOrderBatcher.getBatchesByCategory();
```

Enable debug logging:
```javascript
window.logger.setDebugMode(true);
```