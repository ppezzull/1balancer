#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

console.log(chalk.blue.bold('\n🔐 Setting up 1inch API Proxy...\n'));

console.log(chalk.white('The 1inch API requires CORS headers that browsers block.'));
console.log(chalk.white('We\'ll deploy a simple proxy to Vercel to handle this.\n'));

async function setupProxy() {
  // Check if Vercel CLI is installed
  const vercelSpinner = ora('Checking for Vercel CLI...').start();
  let vercelInstalled = false;
  
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    vercelInstalled = true;
    vercelSpinner.succeed(chalk.green('Vercel CLI is installed'));
  } catch {
    vercelSpinner.warn(chalk.yellow('Vercel CLI not found'));
  }

  if (!vercelInstalled) {
    console.log(chalk.yellow('\n📦 Installing Vercel CLI...'));
    console.log(chalk.gray('Run: npm install -g vercel'));
    console.log(chalk.gray('Then run this script again.\n'));
    process.exit(0);
  }

  // Instructions for proxy setup
  console.log(chalk.cyan.bold('\n📋 Proxy Setup Instructions:\n'));
  
  console.log(chalk.white('1. Clone the proxy repository:'));
  console.log(chalk.gray('   git clone https://github.com/Tanz0rz/1inch-vercel-proxy'));
  console.log(chalk.gray('   cd 1inch-vercel-proxy\n'));
  
  console.log(chalk.white('2. Deploy to Vercel:'));
  console.log(chalk.gray('   vercel'));
  console.log(chalk.gray('   (Follow the prompts to deploy)\n'));
  
  console.log(chalk.white('3. Set your 1inch API key in Vercel:'));
  console.log(chalk.gray('   - Go to your Vercel dashboard'));
  console.log(chalk.gray('   - Select the deployed project'));
  console.log(chalk.gray('   - Go to Settings → Environment Variables'));
  console.log(chalk.gray('   - Add: ONE_INCH_API_KEY = your-api-key\n'));
  
  console.log(chalk.white('4. Get your proxy URL:'));
  console.log(chalk.gray('   It will be something like: https://your-project.vercel.app\n'));

  // Ask if user wants to update env file
  const updateEnv = await question(chalk.yellow('Do you have your Vercel proxy URL ready? (y/n): '));
  
  if (updateEnv.toLowerCase() === 'y') {
    const proxyUrl = await question(chalk.cyan('Enter your Vercel proxy URL: '));
    
    if (proxyUrl) {
      // Update the Next.js env file
      const envPath = path.join(process.cwd(), 'packages/nextjs/.env.local');
      
      try {
        let content = '';
        if (fs.existsSync(envPath)) {
          content = fs.readFileSync(envPath, 'utf8');
          // Update existing NEXT_PUBLIC_PROXY_URL
          content = content.replace(
            /NEXT_PUBLIC_PROXY_URL=.*/,
            `NEXT_PUBLIC_PROXY_URL=${proxyUrl}`
          );
          content = content.replace(
            /NEXT_PUBLIC_ONE_INCH_API_URL=.*/,
            `NEXT_PUBLIC_ONE_INCH_API_URL=${proxyUrl}/api`
          );
        } else {
          // Create new env file with proxy URL
          content = `NEXT_PUBLIC_PROXY_URL=${proxyUrl}
NEXT_PUBLIC_ONE_INCH_API_URL=${proxyUrl}/api
`;
        }
        
        fs.writeFileSync(envPath, content);
        console.log(chalk.green('\n✅ Proxy URL saved to packages/nextjs/.env.local'));
      } catch (error) {
        console.error(chalk.red('\n❌ Failed to update .env.local:'), error.message);
      }
    }
  }

  console.log(chalk.yellow.bold('\n⚠️  Don\'t forget:'));
  console.log(chalk.white('   1. Add your ONE_INCH_API_KEY to Vercel environment variables'));
  console.log(chalk.white('   2. Add your ONE_INCH_API_KEY to .env.local (for reference)'));
  console.log(chalk.white('   3. Redeploy your Vercel app after adding the API key\n'));

  console.log(chalk.gray('For API key: Contact 1inch team or use ETHGlobal process\n'));

  rl.close();
}

setupProxy().catch(error => {
  console.error(chalk.red('\n❌ Proxy setup failed:'), error);
  rl.close();
  process.exit(1);
});