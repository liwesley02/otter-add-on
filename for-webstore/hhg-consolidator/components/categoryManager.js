// Log when script loads
try {
  if (window.logger && window.logger.log) {
    window.logger.log('[CategoryManager.js] Script loaded at:', new Date().toISOString());
  } else {
    console.log('[CategoryManager.js] Script loaded at:', new Date().toISOString());
  }
} catch (e) {
  console.log('[CategoryManager.js] Script loaded (logger error):', e.message);
}

class CategoryManager {
  constructor() {
    // Top-level categories - all at same hierarchy level
    this.topCategories = {
      'large': { name: 'Large', order: 1 },
      'large - garlic butter fried rice substitute': { name: 'Large - Garlic Butter Fried Rice Substitute', order: 2 },
      'large - fried rice substitute': { name: 'Large - Fried Rice Substitute', order: 3 },
      'large - fried rice': { name: 'Large - Fried Rice', order: 4 },
      'large - stir fry rice noodles substitute': { name: 'Large - Stir Fry Rice Noodles Substitute', order: 5 },
      'large - noodles': { name: 'Large - Noodles', order: 6 },
      'small': { name: 'Small', order: 7 },
      'small - garlic butter fried rice substitute': { name: 'Small - Garlic Butter Fried Rice Substitute', order: 8 },
      'small - fried rice substitute': { name: 'Small - Fried Rice Substitute', order: 9 },
      'small - fried rice': { name: 'Small - Fried Rice', order: 10 },
      'small - stir fry rice noodles substitute': { name: 'Small - Stir Fry Rice Noodles Substitute', order: 11 },
      'small - noodles': { name: 'Small - Noodles', order: 12 },
      'riceBowls': { name: 'Rice Bowls', order: 1 },  // Add rice bowls as top category
      'urban-bowls': { name: 'Urban Bowls', order: 2 },
      'bao': { name: 'Bao', order: 14 },
      'meals': { name: 'Meals', order: 15 },
      'appetizers': { name: 'Appetizers', order: 16 },
      'dumplings': { name: 'Dumplings', order: 17 },
      'desserts': { name: 'Desserts', order: 18 },
      'drinks': { name: 'Drinks', order: 19 },
      'sides': { name: 'Sides', order: 20 },
      'other': { name: 'Other', order: 21 }
    };

    // Protein/type subcategories
    this.proteinCategories = {
      'grilled-chicken': {
        name: 'Grilled Chicken',
        keywords: ['grilled chicken', 'grilled orange chicken', 'grilled sweet', 'grilled garlic aioli chicken', 'grilled jalapeño', 'grilled chipotle', 'grilled bulgogi', 'chicken bulgogi']
      },
      'crispy-chicken': {
        name: 'Crispy Chicken',
        keywords: ['crispy chicken', 'crispy orange chicken', 'crispy garlic', 'crispy chipotle', 'crispy jalapeño', 'crispy sesame']
      },
      'steak': {
        name: 'Steak',
        keywords: ['steak', 'grilled steak']
      },
      'salmon': {
        name: 'Salmon',
        keywords: ['salmon', 'grilled salmon']
      },
      'shrimp': {
        name: 'Shrimp',
        keywords: ['shrimp', 'crispy shrimp', 'grilled shrimp']
      },
      'fish': {
        name: 'Fish',
        keywords: ['fish', 'crispy fish', 'grilled fish']
      },
      'tofu': {
        name: 'Tofu',
        keywords: ['tofu', 'ponzu chili tofu', 'teriyaki tofu']
      },
      'vegetarian': {
        name: 'Vegetarian',
        keywords: ['cauliflower', 'vegetable', 'veggie', 'nugget']
      },
      'dumplings': {
        name: 'Dumplings',
        keywords: ['dumpling', 'pork dumpling', 'chicken dumpling', 'vegetable dumpling']
      },
      'appetizers': {
        name: 'Appetizers',
        keywords: ['crab rangoon', 'spring roll', 'egg roll', 'starter']
      },
      'sides': {
        name: 'Sides',
        keywords: ['waffle fries', 'side', 'fried rice', 'white rice', 'brown rice']
      },
      'desserts': {
        name: 'Desserts',
        keywords: ['bao-nut', 'baonut', 'bao nut', 'dessert', 'sweet', 'ice cream', 'mochi', 'cinnamon']
      },
      'drinks': {
        name: 'Drinks',
        keywords: ['drink', 'beverage', 'tea', 'coffee', 'soda', 'juice', 'water', 'lemonade', 'cucumber']
      },
      'other': {
        name: 'Other',
        keywords: []
      }
    };
  }

  categorizeItem(itemName, itemSize = 'no-size', itemData = {}) {
    // Handle both old format (modifiers object) and new format (full item data)
    const modifiers = itemData.modifiers || itemData;
    const proteinType = itemData.proteinType || modifiers.proteinType || '';
    const sauce = itemData.sauce || modifiers.sauce || '';
    const modifierDetails = itemData.modifierDetails || {};
    const isRiceBowl = itemData.isRiceBowl || (itemName && itemName.toLowerCase().includes('rice bowl'));
    const isUrbanBowl = itemData.isUrbanBowl || (itemName && itemName.toLowerCase().includes('urban bowl'));
    
    // Check cache first
    if (window.categoryCache) {
      const cached = window.categoryCache.get(itemName, itemSize, modifiers);
      if (cached) {
        if (window.logger) {
          window.logger.debug(`[CategoryManager] Using cached category for: ${itemName}`);
        }
        return cached;
      }
    }
    
    // Enhanced logging for debugging
    const debugEnabled = window.logger && typeof window.logger.isDebugEnabled === 'function' && window.logger.isDebugEnabled();
    
    if (isRiceBowl || debugEnabled) {
      console.log(`[CategoryManager] === CATEGORIZATION START ===`);
      console.log(`[CategoryManager] Item: "${itemName}"`);
      console.log(`[CategoryManager] Size: "${itemSize}" (type: ${typeof itemSize})`);
      console.log(`[CategoryManager] Item Data:`, {
        proteinType: proteinType,
        sauce: sauce,
        isRiceBowl: isRiceBowl,
        isUrbanBowl: isUrbanBowl,
        modifierDetails: modifierDetails
      });
    }
    
    // Handle non-string inputs
    if (!itemName || typeof itemName !== 'string') {
      if (window.logger) {
        window.logger.warn('CategoryManager: Invalid itemName:', itemName);
      }
      return {
        topCategory: 'other',
        subCategory: 'other',
        topCategoryName: 'Other',
        subCategoryName: 'Other',
        displayCategory: 'Other'
      };
    }
    
    const lowerName = itemName.toLowerCase();
    
    // Handle potential object or undefined sizes
    let normalizedSize = itemSize;
    if (typeof itemSize === 'object' && itemSize !== null) {
      // If size is an object, try to extract the string value
      normalizedSize = itemSize.toString() || 'no-size';
      console.log(`[CategoryManager] Size was an object, converted to: ${normalizedSize}`);
    } else if (itemSize === undefined || itemSize === null || itemSize === '') {
      normalizedSize = 'no-size';
    }
    
    let lowerSize = normalizedSize.toLowerCase().trim();
    
    // Debug logging for rice substitutions
    if (lowerSize.includes('fried rice') || lowerSize.includes('garlic butter')) {
      console.log(`[CategoryManager] Rice substitution detected - original: "${itemSize}", normalized: "${normalizedSize}", lowercase: "${lowerSize}"`);
    }
    
    // Keep the size exactly as provided - no normalization
    // This allows us to handle whatever size variations come from the order system
    
    // First, determine if this is a size-based item or a non-bowl item
    let topCategoryKey = null;
    let topCategoryName = null;
    let subCategoryKey = null;
    let subCategoryName = null;
    
    // Check if this is a rice bowl FIRST - this takes priority over everything
    const isRiceBowlItem = lowerName.includes('rice bowl') || 
                          lowerName.includes('ricebowl') || 
                          (lowerName.includes('rice') && lowerName.includes('bowl'));
    
    if (isRiceBowlItem) {
      // All rice bowls go to riceBowls category
      topCategoryKey = 'riceBowls';
      topCategoryName = 'Rice Bowls';
      console.log(`[CategoryManager] Categorized as Rice Bowl: ${itemName}`);
    }
    
    // If not a rice bowl, check if it's an Urban Bowl
    if (!topCategoryKey && lowerName.includes('urban bowl')) {
      topCategoryKey = 'urban-bowls';
      topCategoryName = 'Urban Bowls';
    }
    
    // If still no category, check non-bowl categories
    if (!topCategoryKey) {
      const nonBowlCategories = {
        // Check desserts first to catch bao-nut before generic bao
        'desserts': ['bao-nut', 'baonut', 'bao nut', 'dessert', 'sweet treat', 'cinnamon sugar bao'],
        'bao': ['bao'],
        'meals': ['bao out', 'bowl of rice meal'],
        'appetizers': ['crab rangoon', 'spring roll', 'egg roll', 'starter'],
        'dumplings': ['dumpling'],
        'drinks': ['tea', 'coffee', 'soda', 'juice', 'water', 'lemonade'],
        'sides': ['waffle fries']
      };
      
      // Check for non-bowl categories
      for (const [category, keywords] of Object.entries(nonBowlCategories)) {
        for (const keyword of keywords) {
          if (category === 'bao') {
            // For bao category, ensure we're matching actual bao items
            // But exclude bao-nut items which are desserts
            if (keyword === 'bao' && (lowerName.includes(' bao') || lowerName.endsWith('bao')) && 
                !lowerName.includes('bao out') && !lowerName.includes('bao-nut') && !lowerName.includes('baonut') && !lowerName.includes('bao nut')) {
              topCategoryKey = category;
              topCategoryName = this.topCategories[category].name;
              break;
            } else if (keyword !== 'bao' && lowerName === keyword) {
              // For specific bao types, match exact name
              topCategoryKey = category;
              topCategoryName = this.topCategories[category].name;
              break;
            }
          } else if (lowerName.includes(keyword)) {
            topCategoryKey = category;
            topCategoryName = this.topCategories[category].name;
            break;
          }
        }
        if (topCategoryKey) break;
      }
    }
    
    
    // Default to 'other' if no category found
    if (!topCategoryKey) {
      console.log(`[CategoryManager] No category found for item: "${itemName}", defaulting to 'other'`);
      console.log(`[CategoryManager] Item analysis:`, {
        isRiceBowl: isRiceBowlItem,
        lowerName: lowerName,
        size: lowerSize
      });
      topCategoryKey = 'other';
      topCategoryName = 'Other';
    }
    
    // Now determine subcategory (protein type for bowls, or specific type for others)
    if (topCategoryKey === 'riceBowls') {
      // For rice bowls, use PROTEIN as subcategory, not size!
      // Extract protein from passed data or item name
      let extractedProtein = proteinType;
      if (!extractedProtein) {
        // Fallback to extracting from name
        if (lowerName.includes('pork belly')) {
          extractedProtein = 'Pork Belly';
        } else if (lowerName.includes('grilled') && lowerName.includes('chicken')) {
          // Handle both "grilled chicken" and "grilled orange chicken" patterns
          extractedProtein = 'Grilled Chicken';
        } else if (lowerName.includes('crispy') && lowerName.includes('chicken')) {
          // Handle both "crispy chicken" and "crispy orange chicken" patterns
          extractedProtein = 'Crispy Chicken';
        } else if (lowerName.includes('steak')) {
          extractedProtein = 'Steak';
        } else if (lowerName.includes('salmon')) {
          extractedProtein = 'Salmon';
        } else if (lowerName.includes('shrimp')) {
          extractedProtein = 'Shrimp';
        } else if (lowerName.includes('fish')) {
          extractedProtein = 'Crispy Fish';
        } else if (lowerName.includes('tofu')) {
          extractedProtein = 'Tofu';
        } else if (lowerName.includes('cauliflower')) {
          extractedProtein = 'Cauliflower Nugget';
        }
      }
      
      // Set subcategory based on protein
      if (extractedProtein === 'Pork Belly') {
        subCategoryKey = 'pork-belly';
        subCategoryName = 'Pork Belly';
      } else if (extractedProtein === 'Grilled Chicken') {
        subCategoryKey = 'grilled-chicken';
        subCategoryName = 'Grilled Chicken';
      } else if (extractedProtein === 'Crispy Chicken') {
        subCategoryKey = 'crispy-chicken';
        subCategoryName = 'Crispy Chicken';
      } else if (extractedProtein === 'Steak') {
        subCategoryKey = 'steak';
        subCategoryName = 'Steak';
      } else if (extractedProtein === 'Salmon') {
        subCategoryKey = 'salmon';
        subCategoryName = 'Salmon';
      } else if (extractedProtein === 'Shrimp') {
        subCategoryKey = 'shrimp';
        subCategoryName = 'Shrimp';
      } else if (extractedProtein === 'Crispy Fish') {
        subCategoryKey = 'fish';
        subCategoryName = 'Crispy Fish';
      } else if (extractedProtein === 'Tofu') {
        subCategoryKey = 'tofu';
        subCategoryName = 'Tofu';
      } else if (extractedProtein === 'Cauliflower Nugget') {
        subCategoryKey = 'vegetarian';
        subCategoryName = 'Cauliflower Nugget';
      } else {
        subCategoryKey = 'other';
        subCategoryName = 'Other';
      }
      
      // REMOVED: Logic that was overriding riceBowls category with size-based categories
      // Rice bowls should stay in riceBowls category, not be moved to size categories
      
      // Store extracted values for result
      modifiers.proteinType = extractedProtein;
      modifiers.sauceType = sauce || this.getSauceFromName(itemName);
    } else if (topCategoryKey.startsWith('large') || topCategoryKey.startsWith('medium') || topCategoryKey.startsWith('small')) {
      // For old-style size-based rice bowl categories, determine protein
      if (lowerName.includes('chicken')) {
        if (lowerName.includes('grilled')) {
          subCategoryKey = 'grilled-chicken';
          subCategoryName = 'Grilled Chicken';
        } else if (lowerName.includes('crispy')) {
          subCategoryKey = 'crispy-chicken';
          subCategoryName = 'Crispy Chicken';
        } else {
          subCategoryKey = 'chicken';
          subCategoryName = 'Chicken';
        }
      } else if (lowerName.includes('steak')) {
        subCategoryKey = 'steak';
        subCategoryName = 'Steak';
      } else if (lowerName.includes('salmon')) {
        subCategoryKey = 'salmon';
        subCategoryName = 'Salmon';
      } else if (lowerName.includes('shrimp')) {
        subCategoryKey = 'shrimp';
        subCategoryName = 'Shrimp';
      } else if (lowerName.includes('fish')) {
        subCategoryKey = 'fish';
        subCategoryName = 'Fish';
      } else if (lowerName.includes('cauliflower') || lowerName.includes('tofu') || lowerName.includes('vegetable')) {
        subCategoryKey = 'vegetarian';
        subCategoryName = 'Vegetarian';
      } else {
        subCategoryKey = 'other';
        subCategoryName = 'Other';
      }
    } else if (topCategoryKey === 'urban-bowls') {
      // For Urban Bowls, use PROTEIN as subcategory (same as rice bowls)
      let extractedProtein = proteinType;
      if (!extractedProtein) {
        // Fallback to extracting from name
        if (lowerName.includes('pork belly')) {
          extractedProtein = 'Pork Belly';
        } else if (lowerName.includes('grilled') && lowerName.includes('chicken')) {
          // Handle both "grilled chicken" and "grilled orange chicken" patterns
          extractedProtein = 'Grilled Chicken';
        } else if (lowerName.includes('crispy') && lowerName.includes('chicken')) {
          // Handle both "crispy chicken" and "crispy orange chicken" patterns
          extractedProtein = 'Crispy Chicken';
        } else if (lowerName.includes('steak')) {
          extractedProtein = 'Steak';
        } else if (lowerName.includes('salmon')) {
          extractedProtein = 'Salmon';
        } else if (lowerName.includes('shrimp')) {
          extractedProtein = 'Shrimp';
        } else if (lowerName.includes('fish')) {
          extractedProtein = 'Crispy Fish';
        } else if (lowerName.includes('tofu')) {
          extractedProtein = 'Tofu';
        } else if (lowerName.includes('cauliflower')) {
          extractedProtein = 'Cauliflower Nugget';
        }
      }
      
      // Set subcategory based on protein
      if (extractedProtein === 'Pork Belly') {
        subCategoryKey = 'pork-belly';
        subCategoryName = 'Pork Belly';
      } else if (extractedProtein === 'Grilled Chicken') {
        subCategoryKey = 'grilled-chicken';
        subCategoryName = 'Grilled Chicken';
      } else if (extractedProtein === 'Crispy Chicken') {
        subCategoryKey = 'crispy-chicken';
        subCategoryName = 'Crispy Chicken';
      } else if (extractedProtein === 'Steak') {
        subCategoryKey = 'steak';
        subCategoryName = 'Steak';
      } else if (extractedProtein === 'Salmon') {
        subCategoryKey = 'salmon';
        subCategoryName = 'Salmon';
      } else if (extractedProtein === 'Shrimp') {
        subCategoryKey = 'shrimp';
        subCategoryName = 'Shrimp';
      } else if (extractedProtein === 'Crispy Fish') {
        subCategoryKey = 'fish';
        subCategoryName = 'Crispy Fish';
      } else if (extractedProtein === 'Tofu') {
        subCategoryKey = 'tofu';
        subCategoryName = 'Tofu';
      } else if (extractedProtein === 'Cauliflower Nugget') {
        subCategoryKey = 'vegetarian';
        subCategoryName = 'Cauliflower Nugget';
      } else {
        subCategoryKey = 'other';
        subCategoryName = 'Other';
      }
      
      // Store protein type for display
      modifiers.proteinType = extractedProtein;
    } else {
      // For non-bowl categories that aren't size-based, still try to extract protein
      if (topCategoryKey === 'other' || topCategoryKey === 'sides') {
        // Still extract protein information for "other" items
        if (lowerName.includes('chicken')) {
          if (lowerName.includes('grilled')) {
            subCategoryKey = 'grilled-chicken';
            subCategoryName = 'Grilled Chicken';
          } else if (lowerName.includes('crispy')) {
            subCategoryKey = 'crispy-chicken';
            subCategoryName = 'Crispy Chicken';
          } else {
            subCategoryKey = 'chicken';
            subCategoryName = 'Chicken';
          }
        } else if (lowerName.includes('steak')) {
          subCategoryKey = 'steak';
          subCategoryName = 'Steak';
        } else if (lowerName.includes('salmon')) {
          subCategoryKey = 'salmon';
          subCategoryName = 'Salmon';
        } else if (lowerName.includes('shrimp')) {
          subCategoryKey = 'shrimp';
          subCategoryName = 'Shrimp';
        } else if (lowerName.includes('fish')) {
          subCategoryKey = 'fish';
          subCategoryName = 'Fish';
        } else if (lowerName.includes('tofu')) {
          subCategoryKey = 'tofu';
          subCategoryName = 'Tofu';
        } else if (lowerName.includes('cauliflower') || lowerName.includes('vegetable') || lowerName.includes('nugget')) {
          subCategoryKey = 'vegetarian';
          subCategoryName = 'Vegetarian';
        } else {
          subCategoryKey = 'general';
          subCategoryName = 'General';
        }
      } else {
        // For categories like desserts, drinks, appetizers, bao
        // Still try to extract protein for Bao items
        if (topCategoryKey === 'bao') {
          if (lowerName.includes('tofu')) {
            subCategoryKey = 'tofu';
            subCategoryName = 'Tofu';
          } else if (lowerName.includes('cauliflower') || lowerName.includes('nugget')) {
            subCategoryKey = 'vegetarian';
            subCategoryName = 'Vegetarian';
          } else if (lowerName.includes('chicken')) {
            subCategoryKey = 'chicken';
            subCategoryName = 'Chicken';
          } else if (lowerName.includes('steak')) {
            subCategoryKey = 'steak';
            subCategoryName = 'Steak';
          } else {
            subCategoryKey = 'general';
            subCategoryName = 'General';
          }
        } else {
          subCategoryKey = 'general';
          subCategoryName = 'General';
        }
      }
    }
    
    // Get sauce if it's a bowl (now using passed sauce or extracting from name)
    const isBowl = isRiceBowl || isUrbanBowl;
    const extractedSauce = sauce || (isBowl ? this.getSauceFromName(itemName) : '');
    
    // Build display category
    let displayCategory = topCategoryName;
    
    // Store rice substitution info for Urban Bowls (but don't change subcategory)
    if (topCategoryKey === 'urban-bowls' && modifierDetails.riceSubstitution) {
      modifiers.riceSubstitution = modifierDetails.riceSubstitution;
    }
    
    if (subCategoryName && subCategoryName !== 'General') {
      displayCategory += ` > ${subCategoryName}`;
    }
    
    // Add sauce to display category for bowls
    if ((topCategoryKey === 'urban-bowls' || topCategoryKey === 'riceBowls') && extractedSauce) {
      displayCategory += ` > ${extractedSauce}`;
    }
    
    const result = {
      topCategory: topCategoryKey,
      subCategory: subCategoryKey,
      sauce: extractedSauce,
      topCategoryName: topCategoryName,
      subCategoryName: subCategoryName,
      displayCategory: displayCategory,
      fullSize: itemSize, // Store the full size info for rice type display
      proteinType: modifiers.proteinType || '', // For rice bowls
      sauceType: modifiers.sauceType || '', // For rice bowls
      // Legacy properties for compatibility
      sizeCategory: topCategoryKey,
      proteinCategory: subCategoryKey,
      sizeName: topCategoryName,
      proteinName: subCategoryName
    };
    
    // Debug log for rice bowls showing as "Other"
    if (isRiceBowl && topCategoryKey === 'other') {
      console.log(`[CategoryManager] WARNING: Rice bowl categorized as Other!`, {
        itemName: itemName,
        itemSize: itemSize,
        lowerSize: lowerSize,
        result: result
      });
    }
    
    // Enhanced debug logging for results
    if (isRiceBowl || debugEnabled) {
      console.log(`[CategoryManager] === CATEGORIZATION RESULT ===`);
      console.log(`[CategoryManager] Top Category: ${topCategoryKey} (${topCategoryName})`);
      console.log(`[CategoryManager] Sub Category: ${subCategoryKey} (${subCategoryName})`);
      console.log(`[CategoryManager] Display: ${displayCategory}`);
      console.log(`[CategoryManager] Full Result:`, result);
      console.log(`[CategoryManager] === END ===`);
    }
    
    // Cache the result
    if (window.categoryCache) {
      window.categoryCache.set(itemName, itemSize, modifiers, result);
    }
    
    return result;
  }
  
  formatSizeName(size) {
    if (!size || size === 'no-size') return 'NO SIZE';
    
    // Capitalize each word
    return size.split(/[\s-]+/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }
  
  extractSizeInfo(sizeString) {
    // Extract base size and rice type from size string
    const result = {
      baseSize: '',
      riceType: ''
    };
    
    if (!sizeString) return result;
    
    const lower = sizeString.toLowerCase();
    
    // Extract base size
    if (lower.includes('large')) {
      result.baseSize = 'large';
    } else if (lower.includes('small')) {
      result.baseSize = 'small';
    }
    
    // Extract rice type
    if (lower.includes('garlic butter fried rice')) {
      result.riceType = 'garlic butter fried rice substitute';
    } else if (lower.includes('fried rice')) {
      result.riceType = 'fried rice substitute';
    } else if (lower.includes('stir fry rice noodles') || lower.includes('stir fry noodles')) {
      result.riceType = 'stir fry rice noodles substitute';
    } else if (lower.includes('noodles')) {
      result.riceType = 'noodles';
    }
    
    return result;
  }
  
  getSauceFromName(itemName) {
    if (!itemName) return '';
    
    const lowerName = itemName.toLowerCase();
    
    // Extract sauce for different patterns
    // Pattern: [Cooking Method] [Sauce] [Protein] Rice/Urban Bowl
    
    // List of known sauces
    const sauces = [
      'orange',
      'chipotle aioli',
      'jalapeño herb aioli',
      'sesame aioli',
      'garlic aioli',
      'sweet sriracha aioli',
      'garlic sesame fusion',
      'teriyaki',
      'sweet sriracha',
      'spicy yuzu',
      'yuzu',
      'crispy garlic sesame fusion',
      'crispy sesame',
      'crispy jalapeño herb aioli',
      'crispy sweet sriracha aioli',
      'crispy chipotle aioli',
      'crispy orange'
    ];
    
    for (const sauce of sauces) {
      if (lowerName.includes(sauce)) {
        // Capitalize first letter of each word
        return sauce.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    }
    
    return 'Original'; // Default sauce
  }

  getCategoryDisplay(categoryInfo) {
    // Handle new size-first format
    if (categoryInfo.displayCategory) {
      return categoryInfo.displayCategory;
    }
    
    // Fallback for any old format
    return 'Uncategorized';
  }

  getTopCategories() {
    return Object.entries(this.topCategories)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([key, value]) => ({
        key,
        ...value
      }));
  }

  getSubCategories() {
    // Return protein categories as subcategories
    return Object.entries(this.proteinCategories)
      .map(([key, value]) => ({
        key,
        ...value
      }));
  }

  // For backward compatibility
  getAllCategories() {
    const categories = [];
    
    // Add all top-level categories
    this.getTopCategories().forEach(cat => {
      categories.push({
        key: cat.key,
        name: cat.name,
        isMainCategory: true,
        type: 'top'
      });
    });
    
    // Add subcategories
    this.getSubCategories().forEach(subcat => {
      categories.push({
        key: subcat.key,
        name: subcat.name,
        isMainCategory: false,
        type: 'sub'
      });
    });
    
    return categories;
  }
  
  // Legacy method names for compatibility
  getSizeCategories() {
    return this.getTopCategories();
  }
  
  getProteinCategories() {
    return this.getSubCategories();
  }
}

// Make available globally
window.CategoryManager = CategoryManager;
console.log('[CategoryManager.js] Class exposed to window:', typeof window.CategoryManager);

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CategoryManager;
}