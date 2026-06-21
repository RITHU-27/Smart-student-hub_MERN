// Test script for activity points calculator
import { calculateActivityPoints, getCategories, getSubCategories } from './activityPointsCalculator';

// Test cases
const testCases = [
  {
    name: 'International Academic Conference',
    category: 'academic',
    subCategory: 'conference',
    level: 'international',
    expected: 10
  },
  {
    name: 'National Technical Competition',
    category: 'technical',
    subCategory: 'competition',
    level: 'national',
    expected: 8
  },
  {
    name: 'State Level Sports Competition',
    category: 'sports',
    subCategory: 'competition',
    level: 'state',
    expected: 6
  },
  {
    name: 'College Level Cultural Workshop',
    category: 'cultural',
    subCategory: 'workshop',
    level: 'college',
    expected: 1
  },
  {
    name: 'Department Level Leadership',
    category: 'academic',
    subCategory: 'leadership',
    level: 'department',
    expected: 1
  },
  {
    name: 'International Technical Publication',
    category: 'technical',
    subCategory: 'publication',
    level: 'international',
    expected: 10
  }
];

// Run tests
function runTests() {
  console.log('🧪 Running Activity Points Calculator Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const result = calculateActivityPoints(
      testCase.category,
      testCase.subCategory,
      testCase.level
    );
    
    const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} Test ${index + 1}: ${testCase.name}`);
    console.log(`   Input: ${testCase.category} - ${testCase.subCategory} - ${testCase.level}`);
    console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
    
    if (result === testCase.expected) {
      passed++;
    } else {
      failed++;
    }
    console.log('');
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  // Test categories and subcategories
  console.log('\n📋 Available Categories:');
  const categories = getCategories();
  categories.forEach(cat => {
    const subCategories = getSubCategories(cat);
    console.log(`   ${cat}: ${subCategories.join(', ')}`);
  });
}

// Export for use in other files
export { runTests };

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests();
}
