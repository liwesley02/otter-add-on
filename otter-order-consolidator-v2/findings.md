# Otter Dashboard Analysis - Technical Findings

## Site Structure

### Order Dashboard URL
- Main URL: `https://app.tryotter.com`
- Orders appear in real-time on the main dashboard
- No page refresh needed for new orders

### DOM Structure Analysis

#### Order List Container
```html
<div style="height: 1074px; width: 100%;">
  <!-- Order rows appear here -->
</div>
```

#### Order Row Structure
```html
<div data-testid="order-row" class="sc-dhHMav fdVdID">
  <!-- Order details, customer info, items preview -->
</div>
```

#### Key Selectors Discovered
1. **Order Row**: `[data-testid="order-row"]`
2. **Order Number**: `[data-testid="order-info-subtext"]` (e.g., "#E62C792E")
3. **Customer Name**: `.sc-dCesDq.kTVViB > div` (e.g., "Angelica H")
4. **Item Quantity Circle**: `.sc-hGsGDS.iSFqHC` (shows total items)
5. **Item Category**: `.sc-aeBcf.fVhLeR > p` (e.g., "Bowls of Rice")
6. **Item List**: `.sc-aeBcf.fVhLeR > div` (items separated by "•")
7. **Platform Icon**: `img[alt="DoorDash"]`, `img[alt="Uber Eats"]`

#### Order Detail Modal (After Clicking)
```html
<div data-testid="order-details-receipt-items">
  <div data-testid="order-details-receipt-item-row">
    <!-- Individual item details -->
  </div>
</div>
```

#### Detail Selectors
1. **Item Row**: `[data-testid="order-details-receipt-item-row"]`
2. **Item Name**: `.sc-jsFtja.hSUmFW`
3. **Item Quantity**: `.sc-einZSS.hnbVZg`
4. **Item Price**: `.sc-jsFtja.epewNT`
5. **Modifier Sections**: `.sc-euWMRQ.sc-bwjutS.chBMML.jgkBtA` (e.g., "Size Choice", "Choice of Dumpling")
6. **Modifier Values**: `.sc-jsFtja.epewNT` (following modifier label)
7. **Section Headers**: Elements containing modifier type labels

## Menu Categorization Findings

### Item Categories Observed

#### Entrees (Main Dishes)
- **Steak Dishes**:
  - Grilled Steak Rice Bowl (sauce as modifier)
  
- **Salmon Dishes**:
  - Grilled Salmon Rice Bowl (sauce as modifier)
  
- **Grilled Chicken Dishes**:
  - Grilled Chicken Bulgogi Rice Bowl
  - Grilled Sweet Sriracha Aioli Chicken Rice Bowl
  
- **Crispy Chicken Dishes**:
  - Crispy Orange Chicken Rice Bowl
  - Crispy Chipotle Aioli Chicken Rice Bowl
  - Crispy Jalapeño Herb Aioli Chicken Rice Bowl
  - Crispy Garlic Aioli Chicken Urban Bowl
  - Crispy Garlic Sesame Fusion Chicken Urban Bowl
  - Crispy Sesame Aioli Chicken Urban Bowl
  
- **Crispy Fish Items**:
  - Crispy Sesame Aioli Shrimp Rice Bowl
  
- **Vegetarian Dishes**:
  - Garlic Aioli Cauliflower Nugget Urban Bowl
  
- **Note on Urban Bowls**:
  - All Urban Bowls come with "Choice of 3 piece Dumplings"
  - Rice can be substituted (similar to size upgrades)
  
- **Meals**:
  - Bowl of Rice Meal (with modifiers)

#### Appetizers
- Crispy Pork Dumplings
- Crispy Vegetable Dumplings
- Crispy Chicken Dumplings
- Crab Rangoon

#### Sides
- Garlic Aioli Waffle Fries
- Various vegetable sides

#### Desserts
- Bao Nut
- Cinnamon Sugar Bao-Nut

#### Drinks
- Cucumber Lemon Soda
- Various beverages

### Size Modifiers
- Small
- Medium (default)
- Large
- Regular
- No size (for items like dumplings)

### Common Add-ons/Modifiers
- **Sauce Modifiers**:
  - "Top Steak with Our Signature Sauces" (for Grilled Steak)
  - "Top Salmon with Our Signature Sauces" (for Grilled Salmon)
  - Sauce included in item name for Chicken items (e.g., "Crispy Chipotle Aioli Chicken")
- **Rice Options**:
  - White Rice (default)
  - Brown Rice
  - Garlic Butter Fried Rice (paid upgrade)
- **Side Additions**:
  - Crispy Pork Dumplings ($6.95)
  - Other dumpling varieties
- **Other Modifiers**:
  - Spice level
  - "Do not include utensils" / "Include utensils" (special instruction)
  - Choice of Dumpling (for Urban Bowl)
  - Rice substitutions (e.g., Brown Rice instead of White)

## Order Flow Observations

### Order Status Indicators
1. **Courier Status**:
   - "Pending" - Order just received
   - "2m" / "4m" - Time until courier arrival
   - "Checked in" - Courier has arrived
   - "Out for delivery" - Order picked up

2. **Platform Indicators**:
   - DoorDash orders show "Doordash Marketplace" or "Doordash Storefront"
   - Uber Eats orders show platform icon
   - Each platform has unique order number format

### Real-time Updates
- New orders appear at the top of the list
- Order status updates without page refresh
- Courier ETA updates dynamically

## Technical Challenges & Solutions

### Challenge 1: Dynamic Class Names
**Problem**: Class names like `sc-dhHMav` appear to be generated and may change
**Solution**: Rely primarily on `data-testid` attributes and structural selectors

### Challenge 2: Modal Management
**Problem**: Clicking orders opens modal that must be closed
**Solution**: Multiple close strategies implemented (click X, click outside, ESC key)

### Challenge 3: Item Modifier Extraction
**Problem**: Modifiers appear in various formats within the detail view
**Solution**: Traverse DOM siblings to find all modifier sections

### Challenge 4: Real-time Detection
**Problem**: Orders appear dynamically without page refresh
**Solution**: MutationObserver on order container with debouncing

## Data Extraction Strategy

### Two-Phase Approach
1. **Preview Extraction** (Fast but incomplete):
   - Get basic item names from order row
   - See total quantity but not individual items
   - No size or modifier information

2. **Detail Extraction** (Complete but slower):
   - Click each order to open modal
   - Extract full item details with modifiers
   - Parse modifier sections to extract size and other choices
   - Close modal before processing next order
   - 500ms delay between orders to avoid UI issues

### Modifier Extraction Pattern
Based on the user's examples, modifiers appear in a consistent pattern:
```html
<!-- Size modifier example -->
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Size Choice</div>
<span class="sc-jsFtja epewNT">Small</span>

<!-- Sauce modifier example (Steak/Salmon) -->
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Top Steak with Our Signature Sauces</div>
<span class="sc-jsFtja epewNT">Sweet Sriracha Aioli - Gluten Free</span>

<!-- Side addition with price -->
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Side Addition</div>
<span class="sc-jsFtja epewNT">Crispy Pork Dumplings</span>
<span class="sc-jsFtja epewNT">$6.95</span>

<!-- Complex size modifier with substitution and price -->
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Size Choice - Salmon</div>
<span class="sc-jsFtja epewNT">Large - Garlic Butter Fried Rice Substitute</span>
<span class="sc-jsFtja epewNT">$5.95</span>

<!-- Urban Bowl rice substitution (acts like size) -->
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Substitute Rice</div>
<span class="sc-jsFtja epewNT">Garlic Butter Fried Rice</span>
<span class="sc-jsFtja epewNT">$3.00</span>

<!-- Urban Bowl dumpling choice (part of the bowl) -->
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Choice of 3 piece Dumplings</div>
<span class="sc-jsFtja epewNT">Pork Dumplings</span>

<!-- Multiple choice modifier example -->
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Choice of Dumpling</div>
<span class="sc-jsFtja epewNT">Crispy Chicken Dumplings</span>

<!-- Substitution modifier example -->
<span class="sc-jsFtja epewNT">Brown Rice</span>
<span class="sc-jsFtja izpgPC">instead of White Rice</span>
```

Key patterns:
1. Modifier labels use class `.sc-euWMRQ.sc-bwjutS.chBMML.jgkBtA`
2. Modifier values use class `.sc-jsFtja.epewNT`
3. Modifier prices (when applicable) also use class `.sc-jsFtja.epewNT`
4. Substitutions include additional text with class `.sc-jsFtja.izpgPC`
5. Items without size modifiers (like dumplings) have no "Size Choice" section
6. Sauce modifiers vary by protein type (separate for Steak/Salmon, included in name for Chicken)

### Batching Logic
Items are considered identical only if ALL of these match:
- Base item name
- Size modifier (primary grouping key)
- All other modifiers
- Price (as validation)

Example batches following size-first hierarchy:
```
LARGE:
  - Entrees:
    - 2x Crispy Chipotle Aioli Chicken Rice Bowl
    - 1x Crispy Jalapeño Herb Aioli Chicken Rice Bowl
  
SMALL:
  - Entrees:
    - 3x Crispy Sesame Aioli Shrimp Rice Bowl
  - Drinks:
    - 2x Cucumber Lemon Soda

NO SIZE:
  - Appetizers:
    - 5x Crispy Chicken Dumplings
    - 3x Crispy Pork Dumplings
```

## Performance Optimizations

1. **Incremental Processing**:
   - Track processed order IDs
   - Only extract new orders
   - Update existing batches

2. **Debounced Updates**:
   - 500ms debounce on mutation events
   - Batch multiple DOM changes

3. **Selective Extraction**:
   - Only click orders that haven't been processed
   - Cache extracted data in memory

## Detailed DOM Analysis Examples

### Example 1: Mixed Order with Dumplings and Urban Bowl
```html
<!-- Dumplings (no size) -->
<div data-testid="order-details-receipt-item-row">
  <span class="sc-einZSS hnbVZg">4</span>
  <span class="sc-jsFtja hSUmFW">Crispy Pork Dumplings</span>
  <span class="sc-jsFtja epewNT">$34.00</span>
</div>

<!-- Urban Bowl with modifiers -->
<div data-testid="order-details-receipt-item-row">
  <span class="sc-einZSS hnbVZg">1</span>
  <span class="sc-jsFtja hSUmFW">Crispy Garlic Sesame Fusion Chicken Urban Bowl</span>
  <span class="sc-jsFtja epewNT">$18.40</span>
</div>
<!-- Modifier sections follow immediately -->
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Choice of Dumpling</div>
<span class="sc-jsFtja epewNT">Crispy Chicken Dumplings</span>
<span class="sc-jsFtja epewNT">Brown Rice</span>
<span class="sc-jsFtja izpgPC">instead of White Rice</span>
```

### Example 2: Rice Bowls with Size Modifiers
```html
<!-- Small Rice Bowl -->
<div data-testid="order-details-receipt-item-row">
  <span class="sc-einZSS hnbVZg">1</span>
  <span class="sc-jsFtja hSUmFW">Crispy Sesame Aioli Shrimp Rice Bowl</span>
  <span class="sc-jsFtja epewNT">$14.95</span>
</div>
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Size Choice</div>
<span class="sc-jsFtja epewNT">Small</span>

<!-- Drink with size -->
<div data-testid="order-details-receipt-item-row">
  <span class="sc-einZSS hnbVZg">1</span>
  <span class="sc-jsFtja hSUmFW">Cucumber Lemon Soda</span>
  <span class="sc-jsFtja epewNT">$4.25</span>
</div>
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Size Choice</div>
<span class="sc-jsFtja epewNT">Small</span>
```

### Example 3: Steak and Salmon with Separate Sauce Modifiers
```html
<!-- Steak with sauce modifier -->
<div data-testid="order-details-receipt-item-row">
  <span class="sc-einZSS hnbVZg">1</span>
  <span class="sc-jsFtja hSUmFW">Grilled Steak Rice Bowl</span>
  <span class="sc-jsFtja epewNT">$12.95</span>
</div>
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Size Choice</div>
<span class="sc-jsFtja epewNT">Small</span>
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Top Steak with Our Signature Sauces</div>
<span class="sc-jsFtja epewNT">Sweet Sriracha Aioli - Gluten Free</span>

<!-- Salmon with paid size modifier -->
<div data-testid="order-details-receipt-item-row">
  <span class="sc-einZSS hnbVZg">1</span>
  <span class="sc-jsFtja hSUmFW">Grilled Salmon Rice Bowl</span>
  <span class="sc-jsFtja epewNT">$12.95</span>
</div>
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Top Salmon with Our Signature Sauces</div>
<span class="sc-jsFtja epewNT">Jalapeño Herb Aioli - Gluten Free</span>
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Size Choice - Salmon</div>
<span class="sc-jsFtja epewNT">Large - Garlic Butter Fried Rice Substitute</span>
<span class="sc-jsFtja epewNT">$5.95</span>
```

### Example 4: Urban Bowls with Dumpling Choice and Rice Substitution
```html
<!-- Urban Bowl with cauliflower nuggets -->
<div data-testid="order-details-receipt-item-row">
  <span class="sc-einZSS hnbVZg">1</span>
  <span class="sc-jsFtja hSUmFW">Garlic Aioli Cauliflower Nugget Urban Bowl</span>
  <span class="sc-jsFtja epewNT">$11.45</span>
</div>
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Choice of 3 piece Dumplings</div>
<span class="sc-jsFtja epewNT">Vegetable Dumplings</span>

<!-- Urban Bowl with chicken and rice substitution -->
<div data-testid="order-details-receipt-item-row">
  <span class="sc-einZSS hnbVZg">1</span>
  <span class="sc-jsFtja hSUmFW">Crispy Sesame Aioli Chicken Urban Bowl</span>
  <span class="sc-jsFtja epewNT">$11.45</span>
</div>
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Choice of 3 piece Dumplings</div>
<span class="sc-jsFtja epewNT">Pork Dumplings</span>
<div class="sc-euWMRQ sc-bwjutS chBMML jgkBtA">Substitute Rice</div>
<span class="sc-jsFtja epewNT">Garlic Butter Fried Rice</span>
<span class="sc-jsFtja epewNT">$3.00</span>
```

### Key Learning Points:
1. **Size extraction**: Look for "Size Choice" section immediately after item row
2. **Items without sizes**: Dumplings and similar items have no size modifier section
3. **Urban Bowl structure**: 
   - "Choice of 3 piece Dumplings" is part of the bowl, NOT a separate appetizer
   - "Substitute Rice" acts like size modifiers for Urban Bowls
4. **DOM traversal**: Modifier sections are siblings of the item row, not children
5. **Price validation**: Each item has its total price including modifiers
6. **Sauce patterns**: Salmon and Steak have sauces as separate modifiers, while Chicken items have sauce in the item name
7. **Size variations**: "Size Choice" for some items, "Size Choice - Salmon" for others
8. **Paid modifiers**: Some modifiers have prices (e.g., "Large - Garlic Butter Fried Rice Substitute" $5.95)
9. **Categorization**: Items that don't fit standard categories should get their own category

## Order Time Extraction

### Time Display Structure
Orders show wait time in the courier status section:
```html
<div data-testid="order-type-time" class="sc-ixKSzz irfKLT">
  <div class="sc-iSTKmn chYNGa">
    <img src="..." alt="" class="sc-jRsTgw fEIeaN">
    <p class="sc-jsFtja sc-bjbJYN epewNT iPemda">Courier</p>
    <span class="sc-glPjVa jpEQhm"> • 19m</span>
  </div>
</div>
```

### Time Formats Observed
- Minutes only: "• 19m", "• 5m"
- Hours and minutes: "• 1h 5m", "• 2h 30m"
- Just arrived: "• 0m" or "• Just now"

### Wave Assignment Strategy
With 8.5 minute average prep time:
- **Urgent Wave (15+ min)**: Orders that exceeded target prep time
- **Warning Wave (8-15 min)**: Orders approaching the limit
- **Normal Wave (0-8 min)**: Fresh orders within prep window

### Automatic Order Aging
Implemented automatic refresh every 30 seconds that:
- Re-extracts current orders and their wait times
- Reassigns orders to appropriate waves based on age
- Shows visual notification when orders move to urgent wave
- Displays time since last refresh in the UI
- Adds shake animation to urgent wave when new orders arrive

### Wave Management UI
- Wave-centric view showing all waves simultaneously
- Items displayed clearly by name within each wave
- Size-first grouping within waves (Large → Medium → Small → No Size)
- Category grouping within each size
- Send button for each wave with confirmation dialog
- Visual urgency indicators:
  - Red border/background with pulse animation for urgent (15+ min)
  - Orange for warning (8-15 min)
  - Green for normal (0-8 min)

## Future Considerations

1. **API Integration**:
   - Investigate if Otter has internal API calls
   - Could potentially intercept XHR/Fetch requests

2. **WebSocket Monitoring**:
   - Check for real-time order updates via WebSocket
   - More efficient than DOM polling

3. **Predictive Categorization**:
   - Learn from restaurant's specific menu
   - Auto-categorize new items based on patterns

4. **Enhanced Modifier Parsing**:
   - Build comprehensive modifier type list
   - Handle complex substitutions and customizations
   - Track modifier pricing if available

5. **Time-Based Analytics**:
   - Track average wait times by item type
   - Predict rush periods
   - Optimize wave sizes based on kitchen capacity