#!/usr/bin/env node

const { default: chalk } = require('chalk');
const { default: ora } = require('ora');

// Test the deployed proxy
async function testProxy(proxyUrl) {
  if (!proxyUrl) {
    console.error(chalk.red('❌ Proxy URL is required'));
    process.exit(1);
  }

  console.log(chalk.blue.bold('\n🧪 Testing 1inch API Proxy...\n'));
  console.log(chalk.gray(`Proxy URL: ${proxyUrl}`));

  const tests = [
    {
      name: 'Token List (Ethereum)',
      endpoint: '/swap/v6.0/1/tokens',
      description: 'Fetch ERC20 token list on Ethereum mainnet'
    },
    {
      name: 'Swap Quote (ETH to USDC)',
      endpoint: '/swap/v6.0/1/quote?src=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&dst=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&amount=1000000000000000000&from=0x0000000000000000000000000000000000000000&origin=https://app.1inch.io',
      description: 'Get swap quote for 1 ETH to USDC'
    },
    {
      name: 'Protocol List',
      endpoint: '/swap/v6.0/1/liquidity-sources',
      description: 'Get available DEX protocols'
    },
    {
      name: 'Price Check (USDC)',
      endpoint: '/price/v1.1/1?currency=USD&contractAddresses=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      description: 'Check USDC price'
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    const spinner = ora(`Testing ${test.name}...`).start();
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${proxyUrl}${test.endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validate response has data
      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('Empty response received');
      }
      
      spinner.succeed(chalk.green(`✓ ${test.name} (${duration}ms)`));
      passedTests++;
      
      // Show sample data for first test
      if (passedTests === 1) {
        console.log(chalk.gray(`  Sample response: ${JSON.stringify(Object.keys(data)).slice(0, 100)}...`));
      }
      
    } catch (error) {
      spinner.fail(chalk.red(`✗ ${test.name}`));
      console.log(chalk.gray(`  Error: ${error.message}`));
      failedTests++;
    }
  }

  // Test CORS headers
  console.log(chalk.cyan('\n🔒 Testing CORS Headers...'));
  
  try {
    const corsResponse = await fetch(`${proxyUrl}/swap/v6.0/1/tokens`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsHeaders = {
      'access-control-allow-origin': corsResponse.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': corsResponse.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': corsResponse.headers.get('access-control-allow-headers')
    };
    
    const hasRequiredCors = 
      corsHeaders['access-control-allow-origin'] === '*' &&
      corsHeaders['access-control-allow-methods']?.includes('GET') &&
      corsHeaders['access-control-allow-headers']?.includes('Content-Type');
    
    if (hasRequiredCors) {
      console.log(chalk.green('✓ CORS headers are properly configured'));
      Object.entries(corsHeaders).forEach(([key, value]) => {
        if (value) console.log(chalk.gray(`  ${key}: ${value}`));
      });
    } else {
      console.log(chalk.yellow('⚠️  CORS headers may need adjustment'));
    }
  } catch (error) {
    console.log(chalk.yellow('⚠️  Could not test CORS headers'));
  }

  // Summary
  console.log(chalk.blue.bold('\n📊 Test Summary:'));
  console.log(chalk.green(`  ✓ Passed: ${passedTests}`));
  if (failedTests > 0) {
    console.log(chalk.red(`  ✗ Failed: ${failedTests}`));
  }
  
  if (passedTests > 0) {
    console.log(chalk.green.bold('\n✨ Proxy is working correctly!'));
    return 0;
  } else {
    console.log(chalk.red.bold('\n❌ Proxy tests failed!'));
    console.log(chalk.yellow('\nTroubleshooting:'));
    console.log(chalk.white('1. Check if your API key is set in Vercel'));
    console.log(chalk.white('2. Verify the proxy URL is correct'));
    console.log(chalk.white('3. Check Vercel logs for errors'));
    return 1;
  }
}

// Run if called directly
if (require.main === module) {
  const proxyUrl = process.argv[2];
  
  if (!proxyUrl) {
    // Try to read from env
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), 'packages/nextjs/.env.local');
    
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/NEXT_PUBLIC_PROXY_URL=(.+)/);
      if (match && match[1]) {
        testProxy(match[1]).then(code => process.exit(code));
      } else {
        console.error(chalk.red('❌ No proxy URL found in environment'));
        console.log(chalk.gray('Usage: node test-proxy.js <proxy-url>'));
        process.exit(1);
      }
    } else {
      console.error(chalk.red('❌ Proxy URL is required'));
      console.log(chalk.gray('Usage: node test-proxy.js <proxy-url>'));
      process.exit(1);
    }
  } else {
    testProxy(proxyUrl).then(code => process.exit(code));
  }
}

module.exports = { testProxy };