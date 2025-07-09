import * as fs from 'fs';
import * as path from 'path';

/**
 * Comprehensive Test Report Generator
 * Generates detailed reports from E2E test results
 */

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  duration: number;
  browser: string;
}

interface TestReport {
  suites: TestSuite[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
    duration: number;
  };
  timestamp: string;
  environment: {
    node: string;
    os: string;
    browsers: string[];
  };
}

export class ReportGenerator {
  private reportDir: string;
  
  constructor(reportDir = 'tests/reports') {
    this.reportDir = reportDir;
    this.ensureDirectories();
  }
  
  private ensureDirectories() {
    const dirs = [
      this.reportDir,
      path.join(this.reportDir, 'html'),
      path.join(this.reportDir, 'json'),
      path.join(this.reportDir, 'markdown'),
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  /**
   * Generate comprehensive test report
   */
  async generateReport(testResults: any): Promise<TestReport> {
    const report = this.processTestResults(testResults);
    
    // Generate different report formats
    await this.generateHTMLReport(report);
    await this.generateMarkdownReport(report);
    await this.generateJSONReport(report);
    
    // Generate quality metrics
    await this.generateQualityMetrics(report);
    
    return report;
  }
  
  private processTestResults(results: any): TestReport {
    const suites: TestSuite[] = [];
    let totalDuration = 0;
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    
    // Process each test suite
    results.suites?.forEach((suite: any) => {
      const tests: TestResult[] = [];
      let suiteDuration = 0;
      
      suite.specs?.forEach((spec: any) => {
        const test: TestResult = {
          name: spec.title,
          status: spec.ok ? 'passed' : 'failed',
          duration: spec.duration || 0,
          error: spec.error?.message,
          screenshot: spec.attachments?.find((a: any) => a.name === 'screenshot')?.path,
        };
        
        tests.push(test);
        suiteDuration += test.duration;
        totalTests++;
        
        if (test.status === 'passed') passedTests++;
        else if (test.status === 'failed') failedTests++;
        else skippedTests++;
      });
      
      suites.push({
        name: suite.title,
        tests,
        duration: suiteDuration,
        browser: suite.project || 'default',
      });
      
      totalDuration += suiteDuration;
    });
    
    return {
      suites,
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        skipped: skippedTests,
        passRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
        duration: totalDuration,
      },
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        os: process.platform,
        browsers: [...new Set(suites.map(s => s.browser))],
      },
    };
  }
  
  private async generateHTMLReport(report: TestReport) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Genshi Studio E2E Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        h1 {
            color: #2c3e50;
            margin: 0 0 20px 0;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        .metric-label {
            color: #666;
            font-size: 0.9em;
        }
        .passed { color: #27ae60; }
        .failed { color: #e74c3c; }
        .skipped { color: #f39c12; }
        .suite {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .test {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        .test:last-child {
            border-bottom: none;
        }
        .test-name {
            flex: 1;
        }
        .test-status {
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: bold;
        }
        .status-passed {
            background: #d4edda;
            color: #155724;
        }
        .status-failed {
            background: #f8d7da;
            color: #721c24;
        }
        .pass-rate-bar {
            width: 100%;
            height: 30px;
            background: #e0e0e0;
            border-radius: 15px;
            overflow: hidden;
            margin: 20px 0;
        }
        .pass-rate-fill {
            height: 100%;
            background: linear-gradient(90deg, #27ae60, #2ecc71);
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        .quality-gate {
            background: ${report.summary.passRate >= 90 ? '#d4edda' : '#f8d7da'};
            color: ${report.summary.passRate >= 90 ? '#155724' : '#721c24'};
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            font-size: 1.2em;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 Genshi Studio E2E Test Report</h1>
        <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
        <p>Environment: Node ${report.environment.node} | ${report.environment.os}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <div class="metric-label">Total Tests</div>
            <div class="metric-value">${report.summary.total}</div>
        </div>
        <div class="metric">
            <div class="metric-label">Passed</div>
            <div class="metric-value passed">${report.summary.passed}</div>
        </div>
        <div class="metric">
            <div class="metric-label">Failed</div>
            <div class="metric-value failed">${report.summary.failed}</div>
        </div>
        <div class="metric">
            <div class="metric-label">Duration</div>
            <div class="metric-value">${(report.summary.duration / 1000).toFixed(2)}s</div>
        </div>
    </div>
    
    <div class="quality-gate">
        ${report.summary.passRate >= 90 
          ? '✅ Quality Gate PASSED - ' + report.summary.passRate.toFixed(1) + '% pass rate'
          : '❌ Quality Gate FAILED - ' + report.summary.passRate.toFixed(1) + '% pass rate (90% required)'}
    </div>
    
    <div class="pass-rate-bar">
        <div class="pass-rate-fill" style="width: ${report.summary.passRate}%">
            ${report.summary.passRate.toFixed(1)}%
        </div>
    </div>
    
    ${report.suites.map(suite => `
        <div class="suite">
            <h2>${suite.name} (${suite.browser})</h2>
            <p>Duration: ${(suite.duration / 1000).toFixed(2)}s</p>
            ${suite.tests.map(test => `
                <div class="test">
                    <div class="test-name">${test.name}</div>
                    <div class="test-status status-${test.status}">${test.status.toUpperCase()}</div>
                </div>
            `).join('')}
        </div>
    `).join('')}
</body>
</html>
`;
    
    fs.writeFileSync(
      path.join(this.reportDir, 'html', 'index.html'),
      html
    );
  }
  
  private async generateMarkdownReport(report: TestReport) {
    const markdown = `# Genshi Studio E2E Test Report

Generated: ${new Date(report.timestamp).toLocaleString()}

## Summary

- **Total Tests**: ${report.summary.total}
- **Passed**: ${report.summary.passed} ✅
- **Failed**: ${report.summary.failed} ❌
- **Skipped**: ${report.summary.skipped} ⏭️
- **Pass Rate**: ${report.summary.passRate.toFixed(1)}%
- **Duration**: ${(report.summary.duration / 1000).toFixed(2)}s

## Quality Gate

${report.summary.passRate >= 90 
  ? '✅ **PASSED** - ' + report.summary.passRate.toFixed(1) + '% pass rate achieved'
  : '❌ **FAILED** - ' + report.summary.passRate.toFixed(1) + '% pass rate (90% required)'}

## Test Results by Suite

${report.suites.map(suite => `
### ${suite.name} (${suite.browser})

Duration: ${(suite.duration / 1000).toFixed(2)}s

| Test | Status | Duration |
|------|--------|----------|
${suite.tests.map(test => 
`| ${test.name} | ${test.status === 'passed' ? '✅' : '❌'} ${test.status} | ${(test.duration / 1000).toFixed(2)}s |`
).join('\n')}
`).join('\n')}

## Environment

- **Node Version**: ${report.environment.node}
- **Platform**: ${report.environment.os}
- **Browsers**: ${report.environment.browsers.join(', ')}
`;
    
    fs.writeFileSync(
      path.join(this.reportDir, 'markdown', 'report.md'),
      markdown
    );
  }
  
  private async generateJSONReport(report: TestReport) {
    fs.writeFileSync(
      path.join(this.reportDir, 'json', 'report.json'),
      JSON.stringify(report, null, 2)
    );
  }
  
  private async generateQualityMetrics(report: TestReport) {
    const metrics = {
      qualityScore: this.calculateQualityScore(report),
      testCoverage: {
        functionality: this.calculateCoverage(report, 'functionality'),
        performance: this.calculateCoverage(report, 'performance'),
        accessibility: this.calculateCoverage(report, 'accessibility'),
        visual: this.calculateCoverage(report, 'visual'),
      },
      recommendations: this.generateRecommendations(report),
    };
    
    fs.writeFileSync(
      path.join(this.reportDir, 'json', 'quality-metrics.json'),
      JSON.stringify(metrics, null, 2)
    );
  }
  
  private calculateQualityScore(report: TestReport): number {
    const passRateScore = report.summary.passRate;
    const coverageScore = Math.min(report.summary.total / 50 * 100, 100); // Assume 50 tests is full coverage
    const performanceScore = report.summary.duration < 300000 ? 100 : 80; // Under 5 minutes is good
    
    return (passRateScore * 0.5 + coverageScore * 0.3 + performanceScore * 0.2);
  }
  
  private calculateCoverage(report: TestReport, category: string): number {
    const categoryTests = report.suites.filter(s => 
      s.name.toLowerCase().includes(category)
    ).flatMap(s => s.tests);
    
    return categoryTests.length > 0 ? 
      (categoryTests.filter(t => t.status === 'passed').length / categoryTests.length) * 100 : 0;
  }
  
  private generateRecommendations(report: TestReport): string[] {
    const recommendations: string[] = [];
    
    if (report.summary.passRate < 90) {
      recommendations.push('Focus on fixing failing tests to achieve 90% pass rate');
    }
    
    if (report.summary.duration > 600000) {
      recommendations.push('Consider optimizing test execution time (currently over 10 minutes)');
    }
    
    const failedTests = report.suites.flatMap(s => 
      s.tests.filter(t => t.status === 'failed')
    );
    
    if (failedTests.length > 0) {
      recommendations.push(`Fix ${failedTests.length} failing tests`);
    }
    
    return recommendations;
  }
}