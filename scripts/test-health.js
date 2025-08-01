const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function checkTestHealth() {
  console.log(chalk.blue('📊 Test Health Report'));
  console.log('='.repeat(50));
  
  const results = {
    coverage: {},
    lastRun: {},
    failures: [],
    recommendations: []
  };

  // Check coverage for each package
  const packages = ['hardhat', 'orchestrator'];
  
  packages.forEach(pkg => {
    const coveragePath = path.join(__dirname, `../packages/${pkg}/coverage/coverage-summary.json`);
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      results.coverage[pkg] = {
        lines: coverage.total.lines.pct,
        branches: coverage.total.branches.pct,
        functions: coverage.total.functions.pct,
        statements: coverage.total.statements.pct
      };
    } else {
      results.coverage[pkg] = null;
    }
  });

  // Check for test results
  const testResultsPath = path.join(__dirname, '../test-results.json');
  if (fs.existsSync(testResultsPath)) {
    const tests = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
    results.lastRun = {
      total: tests.numTotalTests,
      passed: tests.numPassedTests,
      failed: tests.numFailedTests,
      time: tests.time,
      timestamp: tests.timestamp || new Date().toISOString()
    };
  }

  // Display coverage report
  console.log(chalk.yellow('\n📈 Code Coverage:'));
  Object.entries(results.coverage).forEach(([pkg, coverage]) => {
    if (coverage) {
      console.log(`\n${chalk.bold(pkg)}:`);
      console.log(`  Lines:      ${formatCoverage(coverage.lines)}%`);
      console.log(`  Branches:   ${formatCoverage(coverage.branches)}%`);
      console.log(`  Functions:  ${formatCoverage(coverage.functions)}%`);
      console.log(`  Statements: ${formatCoverage(coverage.statements)}%`);
      
      // Add recommendations
      if (coverage.lines < 80) {
        results.recommendations.push(`${pkg}: Increase line coverage (currently ${coverage.lines.toFixed(1)}%)`);
      }
      if (coverage.branches < 75) {
        results.recommendations.push(`${pkg}: Improve branch coverage (currently ${coverage.branches.toFixed(1)}%)`);
      }
    } else {
      console.log(`\n${chalk.bold(pkg)}: ${chalk.red('No coverage data found')}`);
      results.recommendations.push(`${pkg}: Generate coverage report with 'yarn test:coverage'`);
    }
  });

  // Display last test run
  if (results.lastRun.total) {
    console.log(chalk.yellow('\n🏃 Last Test Run:'));
    console.log(`  Total Tests: ${results.lastRun.total}`);
    console.log(`  Passed:      ${chalk.green(results.lastRun.passed)}`);
    console.log(`  Failed:      ${results.lastRun.failed > 0 ? chalk.red(results.lastRun.failed) : '0'}`);
    console.log(`  Duration:    ${(results.lastRun.time / 1000).toFixed(2)}s`);
    console.log(`  Run at:      ${results.lastRun.timestamp}`);
  }

  // Check for common test files
  console.log(chalk.yellow('\n📁 Test File Status:'));
  const testFiles = [
    'packages/hardhat/test/ethereum-hub/unit/AtomicSwapERC20.test.ts',
    'packages/hardhat/test/ethereum-hub/fork/ForkTest.test.ts',
    'packages/orchestrator/tests/unit/SessionManager.test.ts',
    'packages/orchestrator/tests/unit/SecretManager.test.ts',
    'packages/orchestrator/tests/integration/orchestrator.test.js',
    'tests/integration/cross-service.test.ts'
  ];

  testFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, '..', file));
    console.log(`  ${exists ? chalk.green('✓') : chalk.red('✗')} ${file}`);
    if (!exists) {
      results.recommendations.push(`Create missing test file: ${file}`);
    }
  });

  // Display recommendations
  if (results.recommendations.length > 0) {
    console.log(chalk.yellow('\n💡 Recommendations:'));
    results.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }

  // Overall health score
  const healthScore = calculateHealthScore(results);
  console.log(chalk.yellow('\n🏥 Overall Test Health Score:'));
  console.log(`  ${getHealthBar(healthScore)} ${healthScore}%`);
  
  if (healthScore < 70) {
    console.log(chalk.red('\n⚠️  Test health needs improvement!'));
    return false;
  } else if (healthScore < 85) {
    console.log(chalk.yellow('\n⚡ Test health is good but could be better'));
    return true;
  } else {
    console.log(chalk.green('\n🎉 Excellent test health!'));
    return true;
  }
}

function formatCoverage(value) {
  if (value >= 80) return chalk.green(value.toFixed(1));
  if (value >= 60) return chalk.yellow(value.toFixed(1));
  return chalk.red(value.toFixed(1));
}

function calculateHealthScore(results) {
  let score = 100;
  
  // Coverage impact (40 points)
  Object.values(results.coverage).forEach(coverage => {
    if (!coverage) {
      score -= 20;
    } else {
      const avgCoverage = (coverage.lines + coverage.branches + coverage.functions) / 3;
      if (avgCoverage < 80) {
        score -= (80 - avgCoverage) * 0.5;
      }
    }
  });
  
  // Test failures impact (30 points)
  if (results.lastRun.failed > 0 && results.lastRun.total > 0) {
    const failureRate = results.lastRun.failed / results.lastRun.total;
    score -= failureRate * 30;
  }
  
  // Missing test files (30 points)
  const missingFiles = results.recommendations.filter(r => r.includes('Create missing')).length;
  score -= missingFiles * 5;
  
  return Math.max(0, Math.round(score));
}

function getHealthBar(score) {
  const filled = Math.round(score / 5);
  const empty = 20 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  if (score >= 80) return chalk.green(bar);
  if (score >= 60) return chalk.yellow(bar);
  return chalk.red(bar);
}

// Run health check
const isHealthy = checkTestHealth();
process.exit(isHealthy ? 0 : 1);