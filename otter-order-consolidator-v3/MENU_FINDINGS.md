# Otter Menu Structure Findings

## Overview
Based on analysis of the Otter API order data, here's what we've discovered about the menu structure and how items/modifiers work.

## Key Discoveries

### 1. Size Information Storage
- **Sizes are stored as modifiers** with names like "Large", "Small", "Medium"
- These modifiers have their own pricing (e.g., Large = $3.00)
- They appear in the `MODIFIER_GROUP` entity path
- Not all items have sizes (Urban Bowls appear to be one-size)

### 2. Urban Bowl Structure
Urban Bowls are complex items with integrated components:
- **Base**: The bowl itself (e.g., "Crispy Chipotle Aioli Chicken Urban Bowl")
- **Integrated Modifiers** (part of the bowl, NOT separate items):
  - "Choice of 3 piece Dumplings" (Vegetable or Chicken)
  - "Substitute Rice" (e.g., Garlic Butter Fried Rice)
  - Sauces/Aiolis
- **Size**: Urban Bowls use special "urban" size category

### 3. Section Names from Otter Menu

Based on actual data, here are the modifier section names and their behaviors:

#### Always INTEGRATED (modify/complete the main item):
- **Size Choice** - Size selection (Small/Medium/Large)
- **Size Choice - Salmon** - Size for salmon items
- **Boba Option** - Boba additions to drinks
- **Choice of 3 piece Dumplings** - Dumpling selection for items
- **Choice of Dressing** - Dressing selection for salads/bowls
- **Choice of Protein** - Protein selection for customizable items
- **House Sauces** - Sauce options that come with the item
- **Substitute Rice** - Rice options for bowls
- **Top Steak with Our Signature Sauces** - Sauce that goes ON the steak (part of dish)
- **Top Salmon with Our Signature Sauces** - Sauce that goes ON the salmon (part of dish)

#### Always SEPARATE items:
- **Add a Dessert** - Dessert upsells (30 items available)
- **Add a Drink** - Drink upsells (30 items available)  
- **Side Addition** - Side item additions (30 items available)

#### Combo/Required Sections:
- **(Dessert)** - Required dessert selection
- **(Dumplings)** - Required dumpling selection
- **(Small Rice Bowl)** - Required rice bowl configuration

#### Optional Add-ons:
- **Add-ons** - General add-ons
- **Add-Ons Vegetarian** - Vegetarian add-on options

### 4. Modifier Rules (Summary)

#### Integrated Modifiers (Part of Main Item)
These modifiers should NOT be separate items:
1. **Urban Bowls**:
   - Dumplings from "Choice of X piece Dumplings"
   - Rice substitutions
   - Sauces/Aiolis
   
2. **Drinks**:
   - Boba additions (when added to tea/drink items)

#### Separate Item Modifiers
These modifiers SHOULD be treated as additional items:
1. **Steak** - Sauces are separate items
2. **Salmon** - Sauces are separate items
3. **Side Additions** - Always separate
4. **Dessert Upsells** - Always separate (cookies, ice cream, etc.)
5. **Drink Upsells** - Always separate when added to non-drink items
6. **Standalone Dumplings** - When not part of Urban Bowl choice
7. **Meal Items** - ALL modifiers under "Bao Out" or "Bowl of Rice Meal" are separate items

#### Upsell Pattern
Otter uses modifiers for upselling:
- **"Add a Dessert"** sections - These are always separate items
- **"Add a Drink"** sections - These are always separate items
- These appear as modifiers but should be treated as additional order items

### 5. Menu Categories Observed

From the data, we've seen these item types:
- **Urban Bowls** - Complex bowls with integrated dumplings/rice
- **Dumplings** - Can be standalone or part of Urban Bowls
- **Drinks** - With optional boba integration
- **Steak** - With separate sauce options
- **Salmon** - With separate sauce options
- **Sides** - Additional items
- **Desserts** - Additional items

### 6. Order Structure Patterns

#### Modern Structure (customerOrder)
```javascript
{
  customerOrder: {
    customerItemsContainer: {
      items: [...],      // Main items
      modifiers: {...}   // All modifiers (sizes, additions, etc.)
    },
    stationOrders: [{
      menuReconciledItemsContainer: {
        modifiers: {
          // Contains sectionName for context
          "modId": {
            sectionName: "Choice of 3 piece Dumplings",
            stationItemDetail: { name: "Vegetable Dumplings" }
          }
        }
      }
    }]
  }
}
```

#### Key Fields for Processing
1. **sectionName** - Indicates the modifier context (e.g., "Choice of 3 piece Dumplings")
2. **entityPath** - Shows the menu hierarchy (MENU > CATEGORY > ITEM > MODIFIER_GROUP > ITEM)
3. **modifierCustomerItemIds** - Links modifiers to their parent items

### 7. Special Cases

1. **No Size Found**: Default to "no-size" for batching by name
2. **Urban Bowls**: Always use "urban" as size category
3. **Price Calculations**: Size modifiers add to base item price
4. **Dumplings Context**: Must check sectionName to determine if integrated or separate

### 8. Implementation Logic

```javascript
// Actual logic based on section names
const integratedSections = [
  'Size Choice',
  'Size Choice - Salmon', 
  'Boba Option',
  'Choice of 3 piece Dumplings',
  'Choice of Dressing',
  'Choice of Protein',
  'House Sauces',
  'Substitute Rice',
  'Top Steak with Our Signature Sauces',   // Sauce ON the item
  'Top Salmon with Our Signature Sauces'   // Sauce ON the item
];

const separateSections = [
  'Add a Dessert',
  'Add a Drink',
  'Side Addition'
];

if (integratedSections.includes(section)) {
  return true; // Part of main item
} else if (separateSections.includes(section)) {
  return false; // Separate item
} else {
  return false; // Default to separate
}
```

## Testing Scenarios

1. **Urban Bowl Order**:
   - Input: Urban Bowl + Large + Vegetable Dumplings + Garlic Rice
   - Output: 1 item (Urban Bowl Large with all components)

2. **Steak Order**:
   - Input: Steak + Medium + Sauce
   - Output: 2 items (Steak Medium + Sauce as separate)

3. **Drink Order**:
   - Input: Milk Tea + Boba
   - Output: 1 item (Milk Tea with Boba)

4. **Mixed Order**:
   - Input: Urban Bowl + Side Dumplings
   - Output: 2 items (Urban Bowl + Dumplings as separate)

5. **Upsell Order**:
   - Input: Urban Bowl + Cookie (Add a Dessert)
   - Output: 2 items (Urban Bowl + Cookie as separate)

6. **Drink Upsell**:
   - Input: Steak + Lemonade (Add a Drink)
   - Output: 2 items (Steak + Lemonade as separate)

7. **Complex Upsell**:
   - Input: Urban Bowl + Cookie + Lemonade
   - Output: 3 items (Urban Bowl + Cookie + Lemonade all separate)

## Future Considerations

1. **New Menu Items**: Logic may need updates as menu evolves
2. **Section Names**: Critical for determining modifier context
3. **Price Tracking**: Modifiers can affect total price
4. **Category Detection**: Use item names to auto-categorize