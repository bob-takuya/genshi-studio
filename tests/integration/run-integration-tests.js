#!/usr/bin/env node

/**
 * TESTER_INTEGRATION_001 - Integration Test Runner
 * Comprehensive test execution with quality gate validation
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class IntegrationTestRunner {
  constructor() {
    this.testResults = {
      multiModal: null,
      synchronization: null,
      translationQuality: null,
      crossPlatform: null,
      overall: null
    };
    
    this.qualityGates = {
      gate1_multiModal: { threshold: 100, weight: 0.3 },
      gate2_synchronization: { threshold: 100, weight: 0.25 },
      gate3_performance: { threshold: 90, weight: 0.2 },
      gate4_translationQuality: { threshold: 95, weight: 0.15 },
      gate5_browserCompatibility: { threshold: 90, weight: 0.05 },
      gate6_accessibility: { threshold: 85, weight: 0.05 }
    };
    
    this.startTime = Date.now();
  }

  async runTests() {
    console.log('🚀 Starting Genshi Studio Integration Test Suite');
    console.log('=' .repeat(60));
    
    try {
      // Pre-flight checks
      await this.performPreflightChecks();
      
      // Run test suites in parallel for efficiency
      await this.runTestSuites();
      
      // Analyze results and validate quality gates
      const overallResult = await this.analyzeResults();
      
      // Generate comprehensive report
      await this.generateReport(overallResult);
      
      // Exit with appropriate code
      process.exit(overallResult.passed ? 0 : 1);
      
    } catch (error) {
      console.error('❌ Integration test execution failed:', error.message);
      process.exit(1);
    }
  }

  async performPreflightChecks() {
    console.log('🔍 Performing pre-flight checks...');
    
    // Check if application is running
    try {
      const response = await this.checkApplicationStatus();
      if (!response) {
        console.log('⚠️ Application not running, starting development server...');
        await this.startDevelopmentServer();
      }
    } catch (error) {
      console.log('⚠️ Could not verify application status, proceeding with tests...');
    }
    
    // Verify test environment
    this.verifyTestEnvironment();
    
    // Clean previous test results
    this.cleanPreviousResults();
    
    console.log('✅ Pre-flight checks completed');
  }

  checkApplicationStatus() {
    return new Promise((resolve) => {
      const http = require('http');
      const req = http.get('http://localhost:3001/genshi-studio/', (res) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  startDevelopmentServer() {
    return new Promise((resolve, reject) => {
      console.log('🏃 Starting development server...');
      
      const server = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe',
        shell: true
      });
      
      let serverReady = false;
      const timeout = setTimeout(() => {
        if (!serverReady) {
          server.kill();
          reject(new Error('Development server failed to start within 2 minutes'));
        }
      }, 120000);
      
      server.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Local:') || output.includes('localhost:3001')) {
          serverReady = true;
          clearTimeout(timeout);
          console.log('✅ Development server started');
          // Give server additional time to fully initialize
          setTimeout(resolve, 5000);
        }
      });
      
      server.stderr.on('data', (data) => {
        console.log('Server stderr:', data.toString());
      });
    });
  }

  verifyTestEnvironment() {
    console.log('🔧 Verifying test environment...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`   Node.js: ${nodeVersion}`);
    
    // Check if Playwright is installed
    try {
      execSync('npx playwright --version', { stdio: 'pipe' });
      console.log('   Playwright: ✅ Installed');
    } catch (error) {
      throw new Error('Playwright not installed. Run: npm install @playwright/test');
    }
    
    // Check if browsers are installed
    try {
      execSync('npx playwright install --dry-run', { stdio: 'pipe' });
      console.log('   Browsers: ✅ Available');
    } catch (error) {
      console.log('   Browsers: ⚠️ Some browsers may need installation');
    }
  }

  cleanPreviousResults() {
    const resultsDir = path.join(__dirname, '../results');
    const reportsDir = path.join(__dirname, '../reports');
    
    try {
      if (fs.existsSync(resultsDir)) {
        execSync(`rm -rf "${resultsDir}"`);
      }
      if (fs.existsSync(reportsDir)) {
        execSync(`rm -rf "${reportsDir}"`);
      }
      console.log('🧹 Cleaned previous test results');
    } catch (error) {
      console.log('⚠️ Could not clean previous results:', error.message);
    }
  }

  async runTestSuites() {
    console.log('\n🧪 Executing integration test suites...');
    console.log('-'.repeat(60));
    
    const testSuites = [
      {
        name: 'Multi-Modal Integration',
        file: 'multi-modal-integration.spec.ts',
        key: 'multiModal'
      },
      {
        name: 'Synchronization Performance',
        file: 'synchronization-performance.spec.ts',
        key: 'synchronization'
      },
      {
        name: 'Translation Quality',
        file: 'translation-quality.spec.ts',
        key: 'translationQuality'
      },
      {
        name: 'Cross-Platform Accessibility',
        file: 'cross-platform-accessibility.spec.ts',
        key: 'crossPlatform'
      }
    ];

    // Run tests sequentially to avoid resource conflicts
    for (const suite of testSuites) {
      console.log(`\n📋 Running ${suite.name} tests...`);
      
      try {
        const result = await this.runSingleTestSuite(suite.file);
        this.testResults[suite.key] = result;
        
        const status = result.passed ? '✅' : '❌';
        const passRate = ((result.passed / result.total) * 100).toFixed(1);
        console.log(`${status} ${suite.name}: ${passRate}% (${result.passed}/${result.total})`);
        
      } catch (error) {
        console.error(`❌ ${suite.name} failed:`, error.message);
        this.testResults[suite.key] = {
          passed: 0,
          failed: 1,
          total: 1,
          duration: 0,
          passed: false
        };
      }
    }
  }

  runSingleTestSuite(testFile) {
    return new Promise((resolve, reject) => {
      const testPath = path.join(__dirname, testFile);
      const command = `npx playwright test "${testPath}" --reporter=json`;
      
      const startTime = Date.now();
      
      try {
        const output = execSync(command, { 
          encoding: 'utf8',
          maxBuffer: 1024 * 1024 * 10, // 10MB buffer
          timeout: 600000 // 10 minute timeout
        });
        
        const duration = Date.now() - startTime;
        
        // Parse Playwright JSON output
        try {
          const result = JSON.parse(output);
          const stats = this.parsePlaywrightResults(result);
          
          resolve({
            ...stats,
            duration,
            passed: stats.failed === 0
          });
        } catch (parseError) {
          // Fallback parsing if JSON is malformed
          resolve(this.parseFallbackResults(output, duration));
        }
        
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Try to extract some information from error output
        const fallbackResult = this.parseFallbackResults(error.stdout || error.message, duration);
        resolve(fallbackResult);
      }
    });
  }

  parsePlaywrightResults(result) {
    const stats = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0
    };

    if (result.suites) {
      this.countTestResults(result.suites, stats);
    }

    stats.total = stats.passed + stats.failed + stats.skipped;
    
    return stats;
  }

  countTestResults(suites, stats) {
    for (const suite of suites) {
      if (suite.tests) {
        for (const test of suite.tests) {
          if (test.status === 'passed') {
            stats.passed++;
          } else if (test.status === 'failed') {
            stats.failed++;
          } else {
            stats.skipped++;
          }
        }
      }
      
      if (suite.suites) {
        this.countTestResults(suite.suites, stats);
      }
    }
  }

  parseFallbackResults(output, duration) {
    // Extract basic pass/fail information from text output
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const skippedMatch = output.match(/(\d+) skipped/);
    
    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 1;
    const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;
    
    return {
      passed,
      failed,
      skipped,
      total: passed + failed + skipped,
      duration,
      passed: failed === 0
    };
  }

  async analyzeResults() {
    console.log('\n📊 Analyzing test results and quality gates...');
    console.log('-'.repeat(60));
    
    let overallScore = 0;
    let criticalFailures = 0;
    const gateResults = {};
    
    // Analyze each quality gate
    for (const [gateId, gate] of Object.entries(this.qualityGates)) {
      const score = this.calculateGateScore(gateId);
      const passed = score >= gate.threshold;
      
      gateResults[gateId] = {
        score,
        threshold: gate.threshold,
        weight: gate.weight,
        passed
      };
      
      overallScore += score * gate.weight;
      
      if (!passed && gate.weight >= 0.2) { // Critical gates
        criticalFailures++;
      }
      
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${gateId}: ${score.toFixed(1)}% (threshold: ${gate.threshold}%)`);
    }
    
    // Overall assessment
    const overallPassed = criticalFailures === 0 && overallScore >= 85;
    
    console.log(`\n📈 Overall Integration Score: ${overallScore.toFixed(1)}%`);
    console.log(`🎯 Critical Failures: ${criticalFailures}`);
    console.log(`🏆 Overall Status: ${overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
    
    return {
      overallScore,
      criticalFailures,
      gateResults,
      passed: overallPassed,
      testResults: this.testResults
    };
  }

  calculateGateScore(gateId) {
    // Map quality gates to test results
    switch (gateId) {
      case 'gate1_multiModal':
        return this.testResults.multiModal ? 
          (this.testResults.multiModal.passed / this.testResults.multiModal.total) * 100 : 0;
        
      case 'gate2_synchronization':
        return this.testResults.synchronization ? 
          (this.testResults.synchronization.passed / this.testResults.synchronization.total) * 100 : 0;
        
      case 'gate3_performance':
        // Performance is validated within multi-modal and sync tests
        const multiModalScore = this.testResults.multiModal ? 
          (this.testResults.multiModal.passed / this.testResults.multiModal.total) * 100 : 0;
        const syncScore = this.testResults.synchronization ? 
          (this.testResults.synchronization.passed / this.testResults.synchronization.total) * 100 : 0;
        return (multiModalScore + syncScore) / 2;
        
      case 'gate4_translationQuality':
        return this.testResults.translationQuality ? 
          (this.testResults.translationQuality.passed / this.testResults.translationQuality.total) * 100 : 0;
        
      case 'gate5_browserCompatibility':
        return this.testResults.crossPlatform ? 
          (this.testResults.crossPlatform.passed / this.testResults.crossPlatform.total) * 100 : 0;
        
      case 'gate6_accessibility':
        return this.testResults.crossPlatform ? 
          (this.testResults.crossPlatform.passed / this.testResults.crossPlatform.total) * 100 : 0;
        
      default:
        return 0;
    }
  }

  async generateReport(overallResult) {
    console.log('\n📝 Generating comprehensive test report...');
    
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      overallResult,
      testResults: this.testResults,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
    
    // Create reports directory
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Write JSON report
    const jsonReportPath = path.join(reportsDir, `integration-test-report-${Date.now()}.json`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));
    
    // Write summary report
    const summaryPath = path.join(reportsDir, 'integration-test-summary.md');
    const summaryContent = this.generateMarkdownSummary(reportData);
    fs.writeFileSync(summaryPath, summaryContent);
    
    console.log(`📄 Reports generated:`);
    console.log(`   JSON: ${jsonReportPath}`);
    console.log(`   Summary: ${summaryPath}`);
  }

  generateMarkdownSummary(reportData) {
    const { overallResult, testResults, duration } = reportData;
    const durationMinutes = (duration / 1000 / 60).toFixed(1);
    
    return `# Genshi Studio Integration Test Report

**Generated**: ${new Date().toISOString()}  
**Duration**: ${durationMinutes} minutes  
**Overall Score**: ${overallResult.overallScore.toFixed(1)}%  
**Status**: ${overallResult.passed ? '✅ PASSED' : '❌ FAILED'}

## Quality Gates Results

${Object.entries(overallResult.gateResults).map(([gate, result]) => 
  `- **${gate}**: ${result.passed ? '✅' : '❌'} ${result.score.toFixed(1)}% (threshold: ${result.threshold}%)`
).join('\n')}

## Test Suite Results

${Object.entries(testResults).map(([suite, result]) => {
  if (!result) return `- **${suite}**: ⏭️ SKIPPED`;
  const passRate = ((result.passed / result.total) * 100).toFixed(1);
  const status = result.passed ? '✅' : '❌';
  return `- **${suite}**: ${status} ${passRate}% (${result.passed}/${result.total}) - ${(result.duration / 1000).toFixed(1)}s`;
}).join('\n')}

## Summary

${overallResult.passed ? 
  '🎉 All critical integration tests passed! The system is ready for production deployment.' :
  '⚠️ Critical integration tests failed. Review failures before deployment.'}

**Critical Failures**: ${overallResult.criticalFailures}  
**Total Test Duration**: ${durationMinutes} minutes  
**Report Generated**: ${new Date().toLocaleString()}
`;
  }
}

// Execute if run directly
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  
  // Handle command line arguments
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Genshi Studio Integration Test Runner

Usage: node run-integration-tests.js [options]

Options:
  --help, -h     Show this help message
  --verbose, -v  Verbose output
  --suite <name> Run specific test suite only
  --quick        Run quick validation tests only

Examples:
  node run-integration-tests.js
  node run-integration-tests.js --suite multi-modal
  node run-integration-tests.js --quick
`);
    process.exit(0);
  }
  
  runner.runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTestRunner;