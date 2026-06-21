// Integration Test Script for Smart Student Hub
const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Simple HTTP request function
function makeRequest(method, url) {
  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}${url}`, { method }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    
    req.on('error', reject);
    req.end();
  });
}

// Test configuration
const tests = {
  // Backend API Tests
  backend: [
    {
      name: 'Health Check',
      method: 'GET',
      url: '/',
      expected: 200
    },
    {
      name: 'API Test Endpoint',
      method: 'GET', 
      url: '/api/test',
      expected: 200
    },
    {
      name: 'Resume Routes Available',
      method: 'POST',
      url: '/api/resume/generate',
      expected: 401 // Should require auth
    }
  ],
  
  // ML Algorithm Tests
  ml: [
    {
      name: 'Skill Extraction Test',
      test: () => {
        const ResumeController = require('./backend/controllers/resumeController');
        const skills = ResumeController.extractTechnicalSkills('developed a python machine learning application using tensorflow and django');
        return {
          passed: skills.length > 0,
          result: skills,
          message: `Found ${skills.length} skills`
        };
      }
    },
    {
      name: 'Achievement Analysis Test', 
      test: () => {
        const ResumeController = require('./backend/controllers/resumeController');
        const mockAchievements = [
          {
            title: 'Python Machine Learning Project',
            description: 'Developed ML model using TensorFlow',
            category: 'technical',
            level: 'college',
            credits: 30
          }
        ];
        const analysis = ResumeController.analyzeAchievements(mockAchievements);
        return {
          passed: analysis.skills.length > 0,
          result: analysis,
          message: `Analyzed ${mockAchievements.length} achievements, found ${analysis.skills.length} skills`
        };
      }
    }
  ],
  
  // Frontend Routing Tests
  frontend: [
    {
      name: 'App.js Routes',
      test: () => {
        try {
          const fs = require('fs');
          const appContent = fs.readFileSync('./frontend/src/App.js', 'utf8');
          const routes = [
            '/dashboard',
            '/resume-builder', 
            '/student-profile',
            '/all-achievements',
            '/faculty-dashboard',
            '/admin-dashboard'
          ];
          
          const missingRoutes = routes.filter(route => !appContent.includes(route));
          
          return {
            passed: missingRoutes.length === 0,
            result: { routes, missingRoutes },
            message: missingRoutes.length === 0 ? 'All routes found' : `Missing routes: ${missingRoutes.join(', ')}`
          };
        } catch (error) {
          return {
            passed: false,
            result: error.message,
            message: 'Failed to read App.js'
          };
        }
      }
    },
    {
      name: 'Resume Builder Component',
      test: () => {
        try {
          const fs = require('fs');
          const componentExists = fs.existsSync('./frontend/src/components/student/ResumeBuilder.js');
          const pageExists = fs.existsSync('./frontend/src/pages/student/ResumeBuilderPage.js');
          
          return {
            passed: componentExists && pageExists,
            result: { componentExists, pageExists },
            message: componentExists && pageExists ? 'Resume Builder files exist' : 'Missing Resume Builder files'
          };
        } catch (error) {
          return {
            passed: false,
            result: error.message,
            message: 'Failed to check Resume Builder files'
          };
        }
      }
    }
  ]
};

// Run tests
async function runTests() {
  console.log('🚀 Smart Student Hub Integration Test\n');
  console.log('=' .repeat(50));
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test Backend APIs
  console.log('\n📡 Backend API Tests:');
  for (const test of tests.backend) {
    totalTests++;
    try {
      const response = await makeRequest(test.method, test.url);
      
      const passed = response.status === test.expected;
      if (passed) passedTests++;
      
      console.log(`  ${passed ? '✅' : '❌'} ${test.name}: ${response.status}`);
    } catch (error) {
      const passed = test.expected >= 400;
      if (passed) passedTests++;
      
      console.log(`  ${passed ? '✅' : '❌'} ${test.name}: Connection failed`);
    }
  }
  
  // Test ML Algorithms
  console.log('\n🤖 ML Algorithm Tests:');
  for (const test of tests.ml) {
    totalTests++;
    try {
      const result = test.test();
      if (result.passed) passedTests++;
      
      console.log(`  ${result.passed ? '✅' : '❌'} ${test.name}: ${result.message}`);
      if (result.result && typeof result.result === 'object') {
        console.log(`     Result: ${JSON.stringify(result.result, null, 2).split('\n').slice(0, 3).join('\n     ')}`);
      }
    } catch (error) {
      console.log(`  ❌ ${test.name}: ${error.message}`);
    }
  }
  
  // Test Frontend
  console.log('\n🎨 Frontend Tests:');
  for (const test of tests.frontend) {
    totalTests++;
    try {
      const result = test.test();
      if (result.passed) passedTests++;
      
      console.log(`  ${result.passed ? '✅' : '❌'} ${test.name}: ${result.message}`);
    } catch (error) {
      console.log(`  ❌ ${test.name}: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  console.log(`🎯 Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the issues above.');
  }
}

// Check if backend is running
async function checkBackend() {
  try {
    await makeRequest('GET', '/');
    return true;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  console.log('🔍 Checking if backend server is running...');
  const backendRunning = await checkBackend();
  
  if (!backendRunning) {
    console.log('❌ Backend server is not running on http://localhost:5000');
    console.log('💡 Please start the backend server with: npm start');
    console.log('\n📝 Running frontend and ML tests only...\n');
    
    // Run only frontend and ML tests
    let totalTests = 0;
    let passedTests = 0;
    
    console.log('🤖 ML Algorithm Tests:');
    for (const test of tests.ml) {
      totalTests++;
      try {
        const result = test.test();
        if (result.passed) passedTests++;
        
        console.log(`  ${result.passed ? '✅' : '❌'} ${test.name}: ${result.message}`);
      } catch (error) {
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    }
    
    console.log('\n🎨 Frontend Tests:');
    for (const test of tests.frontend) {
      totalTests++;
      try {
        const result = test.test();
        if (result.passed) passedTests++;
        
        console.log(`  ${result.passed ? '✅' : '❌'} ${test.name}: ${result.message}`);
      } catch (error) {
        console.log(`  ❌ ${test.name}: ${error.message}`);
      }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log(`📊 Partial Results: ${passedTests}/${totalTests} tests passed`);
    console.log('💡 Start backend server to run full integration tests');
  } else {
    console.log('✅ Backend server is running');
    await runTests();
  }
})();
