class CategoryManager {
  constructor() {
    this.categories = {
      // Protein-based categories
      steakDishes: {
        name: 'Steak Dishes',
        keywords: ['grilled steak', 'steak rice bowl', 'steak urban bowl'],
        items: []
      },
      salmonDishes: {
        name: 'Salmon Dishes',
        keywords: ['grilled salmon', 'salmon rice bowl', 'salmon urban bowl'],
        items: []
      },
      grilledChicken: {
        name: 'Grilled Chicken',
        keywords: ['grilled chicken', 'grilled sweet sriracha', 'chicken bulgogi'],
        items: []
      },
      crispyChicken: {
        name: 'Crispy Chicken',
        keywords: ['crispy chicken', 'crispy orange chicken', 'crispy chipotle', 'crispy jalapeño', 'crispy garlic', 'crispy sesame aioli chicken'],
        items: []
      },
      crispyFish: {
        name: 'Crispy Fish',
        keywords: ['crispy shrimp', 'crispy fish', 'crispy sesame aioli shrimp'],
        items: []
      },
      vegetarian: {
        name: 'Vegetarian',
        keywords: ['cauliflower', 'vegetable bowl', 'vegetarian'],
        items: []
      },
      // Standard categories
      appetizers: {
        name: 'Appetizers',
        keywords: ['crab rangoon', 'spring roll', 'starter', 'appetizer', 'egg roll'],
        items: []
      },
      dumplings: {
        name: 'Dumplings',
        keywords: ['crispy pork dumpling', 'crispy chicken dumpling', 'crispy vegetable dumpling', 'dumpling'],
        items: []
      },
      sides: {
        name: 'Sides',
        keywords: ['waffle fries', 'garlic aioli waffle', 'side', 'fried rice', 'white rice', 'brown rice'],
        items: []
      },
      desserts: {
        name: 'Desserts',
        keywords: ['bao-nut', 'baonut', 'dessert', 'sweet', 'ice cream', 'mochi'],
        items: []
      },
      desserts: {
        name: 'Desserts',
        keywords: ['bao-nut', 'bao nut', 'ice cream', 'dessert', 'cinnamon sugar'],
        items: []
      },
      drinks: {
        name: 'Drinks',
        keywords: ['drink', 'beverage', 'tea', 'coffee', 'soda', 'juice', 'water', 'lemon soda', 'cucumber'],
        items: []
      },
      uncategorized: {
        name: 'Uncategorized',
        keywords: [],
        items: []
      }
    };
  }

  async loadCustomCategories() {
    const customCategories = await Storage.get('categories');
    if (customCategories) {
      Object.keys(customCategories).forEach(key => {
        if (this.categories[key]) {
          this.categories[key].keywords = customCategories[key];
        }
      });
    }
  }

  categorizeItem(itemName, isUrbanBowlComponent = false) {
    const lowerName = itemName.toLowerCase();
    
    // Urban Bowl components should not be categorized separately
    if (isUrbanBowlComponent) {
      return null; // Will be handled as part of the parent Urban Bowl
    }
    
    // Check for dumplings first (most specific)
    if (lowerName.includes('dumpling')) {
      return 'dumplings';
    }
    
    // Check categories in order of specificity
    for (const [categoryKey, category] of Object.entries(this.categories)) {
      // Skip dumplings since we already checked
      if (categoryKey === 'dumplings') continue;
      
      for (const keyword of category.keywords) {
        if (lowerName.includes(keyword.toLowerCase())) {
          return categoryKey;
        }
      }
    }
    
    // Additional pattern matching
    if (lowerName.includes('steak') && (lowerName.includes('bowl') || lowerName.includes('meal'))) {
      return 'steakDishes';
    }
    if (lowerName.includes('salmon') && (lowerName.includes('bowl') || lowerName.includes('meal'))) {
      return 'salmonDishes';
    }
    if (lowerName.includes('grilled') && lowerName.includes('chicken')) {
      return 'grilledChicken';
    }
    if (lowerName.includes('crispy') && lowerName.includes('chicken')) {
      return 'crispyChicken';
    }
    if (lowerName.includes('crispy') && (lowerName.includes('shrimp') || lowerName.includes('fish'))) {
      return 'crispyFish';
    }
    if (lowerName.includes('crispy') && lowerName.includes('dumpling')) {
      return 'dumplings';
    }
    if (lowerName.includes('urban bowl')) {
      // Determine by protein type
      if (lowerName.includes('chicken')) {
        return lowerName.includes('crispy') ? 'crispyChicken' : 'grilledChicken';
      }
      if (lowerName.includes('cauliflower')) {
        return 'vegetarian';
      }
    }
    
    return 'uncategorized';
  }

  getCategoryDisplay(categoryKey) {
    return this.categories[categoryKey]?.name || 'Uncategorized';
  }

  getAllCategories() {
    return Object.keys(this.categories).map(key => ({
      key,
      name: this.categories[key].name,
      keywords: this.categories[key].keywords
    }));
  }

  addKeywordToCategory(categoryKey, keyword) {
    if (this.categories[categoryKey]) {
      this.categories[categoryKey].keywords.push(keyword.toLowerCase());
      this.saveCustomCategories();
    }
  }

  async saveCustomCategories() {
    const customCategories = {};
    Object.keys(this.categories).forEach(key => {
      customCategories[key] = this.categories[key].keywords;
    });
    await Storage.set('categories', customCategories);
  }
}