// Activity Points Calculator
// This utility calculates student activity points based on category, subcategory, and level

const ACTIVITY_POINTS_MATRIX = {
  // Academic Activities
  academic: {
    conference: {
      international: 50,
      national: 20,
      state: 10,
      district: 5,
      college: 5,
      department: 2
    },
    workshop: {
      international: 50,
      national: 20,
      state: 10,
      district: 5,
      college: 5,
      department: 2
    },
    certification: {
      international: 50,
      national: 20,
      state: 10,
      district: 5,
      college: 5,
      department: 2
    },
    competition: {
      international: 50,
      national: 20,
      state: 10,
      district: 5,
      college: 5,
      department: 2
    },
    internship: {
      international: 50,
      national: 20,
      state: 10,
      district: 5,
      college: 5,
      department: 2
    },
    project: {
      international: 50,
      national: 20,
      state: 10,
      district: 5,
      college: 5,
      department: 2
    },
    publication: {
      international: 50,
      national: 20,
      state: 10,
      district: 5,
      college: 5,
      department: 2
    },
    volunteering: {
      international: 50,
      national: 20,
      state: 10,
      district: 5,
      college: 5,
      department: 2
    },
    leadership: {
      international: 50,
      national: 20,
      state: 10,
      district: 5,
      college: 5,
      department: 2
    },
    other: {
      international: 5,
      national: 4,
      state: 3,
      district: 2,
      college: 1,
      department: 1
    }
  },
  
  // Sports Activities
  sports: {
    competition: {
      international: 50,
      national: 20,
      state: 10,
      district: 5,
      college: 5,
      department: 2
    },
    workshop: {
      international: 50,
      national: 20,
      state: 10,
      district: 5,
      college: 5,
      department: 2
    },
    volunteering: {
      international: 5,
      national: 4,
      state: 3,
      district: 2,
      college: 1,
      department: 1
    },
    leadership: {
      international: 7,
      national: 6,
      state: 5,
      district: 3,
      college: 2,
      department: 1
    },
    other: {
      international: 5,
      national: 4,
      state: 3,
      district: 2,
      college: 1,
      department: 1
    }
  },
  
  // Cultural Activities
  cultural: {
    competition: {
      international: 8,
      national: 6,
      state: 5,
      district: 3,
      college: 2,
      department: 1
    },
    workshop: {
      international: 50,
      national: 20,
      state: 10,
      district: 5,
      college: 5,
      department: 2
    },
    volunteering: {
      international: 4,
      national: 3,
      state: 2,
      district: 2,
      college: 1,
      department: 1
    },
    leadership: {
      international: 6,
      national: 5,
      state: 4,
      district: 3,
      college: 2,
      department: 1
    },
    other: {
      international: 4,
      national: 3,
      state: 2,
      district: 2,
      college: 1,
      department: 1
    }
  },
  
  // Technical Activities
  technical: {
    conference: {
      international: 10,
      national: 8,
      state: 6,
      district: 4,
      college: 3,
      department: 2
    },
    workshop: {
      international: 50,
      national: 20,
      state: 10,
      district: 5,
      college: 5,
      department: 2
    },
    certification: {
      international: 50,
      national: 20,
      state: 10,
      district: 5,
      college: 5,
      department: 2
    },
    competition: {
      international: 10,
      national: 8,
      state: 6,
      district: 4,
      college: 3,
      department: 2
    },
    project: {
      international: 50,
      national: 20,
      state: 10,
      district: 5,
      college: 5,
      department: 2
    },
    publication: {
      international: 10,
      national: 8,
      state: 6,
      district: 4,
      college: 3,
      department: 2
    },
    volunteering: {
      international: 5,
      national: 4,
      state: 3,
      district: 2,
      college: 1,
      department: 1
    },
    leadership: {
      international: 7,
      national: 6,
      state: 5,
      district: 3,
      college: 2,
      department: 1
    },
    other: {
      international: 5,
      national: 4,
      state: 3,
      district: 2,
      college: 1,
      department: 1
    }
  },
  
  // Social Activities
  social: {
    volunteering: {
      international: 7,
      national: 6,
      state: 5,
      district: 3,
      college: 2,
      department: 1
    },
    leadership: {
      international: 8,
      national: 6,
      state: 5,
      district: 3,
      college: 2,
      department: 1
    },
    workshop: {
      international: 5,
      national: 4,
      state: 3,
      district: 2,
      college: 1,
      department: 1
    },
    other: {
      international: 5,
      national: 4,
      state: 3,
      district: 2,
      college: 1,
      department: 1
    }
  },
  
  // Other Activities
  other: {
    other: {
      international: 5,
      national: 4,
      state: 3,
      district: 2,
      college: 1,
      department: 1
    }
  }
};

/**
 * Calculate activity points based on category, subcategory, and level
 * @param {string} category - The activity category
 * @param {string} subCategory - The activity subcategory
 * @param {string} level - The activity level
 * @returns {number} - The calculated points
 */
const calculateActivityPoints = (category, subCategory, level) => {
  try {
    // Default to 0 points if any parameter is missing
    if (!category || !subCategory || !level) {
      return 0;
    }
    
    // Get the points matrix for the category
    const categoryMatrix = ACTIVITY_POINTS_MATRIX[category];
    if (!categoryMatrix) {
      console.warn(`Category '${category}' not found in points matrix`);
      return 0;
    }
    
    // Get the points matrix for the subcategory
    const subCategoryMatrix = categoryMatrix[subCategory];
    if (!subCategoryMatrix) {
      console.warn(`SubCategory '${subCategory}' not found in category '${category}'`);
      return 0;
    }
    
    // Get the points for the level
    const points = subCategoryMatrix[level];
    if (points === undefined) {
      console.warn(`Level '${level}' not found for subcategory '${subCategory}' in category '${category}'`);
      return 0;
    }
    
    return points;
  } catch (error) {
    console.error('Error calculating activity points:', error);
    return 0;
  }
};

/**
 * Get all available categories
 * @returns {string[]} - Array of category names
 */
const getCategories = () => {
  return Object.keys(ACTIVITY_POINTS_MATRIX);
};

/**
 * Get available subcategories for a category
 * @param {string} category - The category
 * @returns {string[]} - Array of subcategory names
 */
const getSubCategories = (category) => {
  if (!category || !ACTIVITY_POINTS_MATRIX[category]) {
    return [];
  }
  return Object.keys(ACTIVITY_POINTS_MATRIX[category]);
};

/**
 * Get available levels
 * @returns {string[]} - Array of level names
 */
const getLevels = () => {
  return ['international', 'national', 'state', 'district', 'college', 'department'];
};

/**
 * Validate if a combination of category, subcategory, and level is valid
 * @param {string} category - The activity category
 * @param {string} subCategory - The activity subcategory
 * @param {string} level - The activity level
 * @returns {boolean} - True if the combination is valid
 */
const isValidCombination = (category, subCategory, level) => {
  if (!category || !subCategory || !level) {
    return false;
  }
  
  const categoryMatrix = ACTIVITY_POINTS_MATRIX[category];
  if (!categoryMatrix) {
    return false;
  }
  
  const subCategoryMatrix = categoryMatrix[subCategory];
  if (!subCategoryMatrix) {
    return false;
  }
  
  return subCategoryMatrix[level] !== undefined;
};

module.exports = {
  calculateActivityPoints,
  getCategories,
  getSubCategories,
  getLevels,
  isValidCombination,
  ACTIVITY_POINTS_MATRIX
};
