console.log('[ItemMatcher.js] Script loaded at:', new Date().toISOString());

class ItemMatcher {
  constructor() {
    this.normalizeRules = {
      removeSpaces: false,
      lowercase: true,
      removeSpecialChars: false
    };
  }

  normalize(itemName) {
    // Handle non-string inputs
    if (!itemName || typeof itemName !== 'string') {
      console.warn('ItemMatcher.normalize: Invalid itemName:', itemName);
      return '';
    }
    
    let normalized = itemName.trim();
    
    if (this.normalizeRules.lowercase) {
      normalized = normalized.toLowerCase();
    }
    
    if (this.normalizeRules.removeSpaces) {
      normalized = normalized.replace(/\s+/g, '');
    }
    
    if (this.normalizeRules.removeSpecialChars) {
      normalized = normalized.replace(/[^a-zA-Z0-9\s]/g, '');
    }
    
    return normalized;
  }

  extractModifiers(itemText) {
    const modifierMatch = itemText.match(/\(([^)]+)\)/);
    if (modifierMatch) {
      return {
        baseName: itemText.replace(/\s*\([^)]+\)/, '').trim(),
        modifiers: modifierMatch[1].split(',').map(m => m.trim())
      };
    }
    return {
      baseName: itemText.trim(),
      modifiers: []
    };
  }
  
  extractSize(itemText) {
    // Extract size from parentheses (e.g., "Item Name (Small)")
    const sizeMatch = itemText.match(/\((Small|Medium|Large|Regular)\)/i);
    if (sizeMatch) {
      return sizeMatch[1];
    }
    
    // Check for size in modifiers
    const modifiers = this.extractModifiers(itemText).modifiers;
    const sizeModifier = modifiers.find(m => 
      /^(Small|Medium|Large|Regular)$/i.test(m.trim())
    );
    
    return sizeModifier || null;
  }

  areItemsIdentical(item1, item2) {
    const parsed1 = this.extractModifiers(item1);
    const parsed2 = this.extractModifiers(item2);
    
    if (this.normalize(parsed1.baseName) !== this.normalize(parsed2.baseName)) {
      return false;
    }
    
    if (parsed1.modifiers.length !== parsed2.modifiers.length) {
      return false;
    }
    
    const sorted1 = parsed1.modifiers.map(m => this.normalize(m)).sort();
    const sorted2 = parsed2.modifiers.map(m => this.normalize(m)).sort();
    
    return sorted1.every((mod, index) => mod === sorted2[index]);
  }

  generateItemKey(itemName, size = null, category = null, riceSubstitution = null) {
    const parsed = this.extractModifiers(itemName);
    let normalizedBase = this.normalize(parsed.baseName);
    
    // Extract size if not provided
    if (!size) {
      size = this.extractSize(itemName) || 'no-size';
    }
    
    // Special handling for rice items with size in the name
    // "Large - Fried Rice" should be different from "Regular Fried Rice"
    if (normalizedBase.includes('fried rice') && size && size !== 'no-size') {
      // Check if the size is already in the base name
      const sizeInName = normalizedBase.match(/^(small|medium|large|regular)\s*-?\s*/);
      if (sizeInName) {
        // Size is part of the item name, keep it in the base name
        // This ensures "Large - Fried Rice" stays distinct from "Fried Rice"
      } else if (size.toLowerCase().includes('fried rice')) {
        // This is a rice substitution being used as size
        normalizedBase = `${normalizedBase} - ${size}`;
      }
    }
    
    // For Urban Bowls with rice substitution, use that as the size
    if (normalizedBase.includes('urban bowl') && riceSubstitution) {
      size = riceSubstitution;
    }
    
    // Normalize size
    const normalizedSize = this.normalize(size || 'no-size');
    
    // Create a compound key: size|category|itemName|modifiers
    const keyParts = [normalizedSize];
    
    if (category) {
      // Handle category object or string
      const categoryStr = typeof category === 'string' ? category : (category?.category || 'uncategorized');
      keyParts.push(this.normalize(categoryStr));
    }
    
    keyParts.push(normalizedBase);
    
    // Include sorted modifiers in the key to ensure items with different modifiers are batched separately
    if (parsed.modifiers.length > 0) {
      const sortedModifiers = parsed.modifiers.map(m => this.normalize(m)).sort().join(',');
      keyParts.push(sortedModifiers);
    }
    
    return keyParts.join('|');
  }
  
  generateSizeGroupKey(size) {
    return this.normalize(size || 'no-size');
  }
}

// Make available globally
window.ItemMatcher = ItemMatcher;