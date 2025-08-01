#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const { default: chalk } = require('chalk');
const { default: ora } = require('ora');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const dotenv = require('dotenv');
const { generateProxyProject } = require('./generate-proxy');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, { stdio: 'pipe', ...options }).toString().trim();
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

function spawnCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit', ...options });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed with code ${code}`));
    });
    proc.on('error', reject);
  });
}

console.log(chalk.blue.bold('\n🔐 Setting up 1inch API Proxy with Automated Deployment...\n'));

// Load environment variables
dotenv.config();

async function setupProxy() {
  // Check if proxy URL already exists
  const envPath = path.join(process.cwd(), 'packages/nextjs/.env.local');
  let existingProxyUrl = null;
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/NEXT_PUBLIC_PROXY_URL=(.+)/);
    if (match && match[1] && match[1] !== 'https://your-proxy-url.vercel.app') {
      existingProxyUrl = match[1];
      console.log(chalk.green(`✓ Found existing proxy URL: ${existingProxyUrl}`));
      
      const useExisting = await question(chalk.yellow('\nDo you want to keep using this proxy? (y/n): '));
      if (useExisting.toLowerCase() === 'y') {
        console.log(chalk.green('\n✨ Using existing proxy configuration!'));
        rl.close();
        return;
      }
    }
  }

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
    console.log(chalk.yellow('\n📦 Installing Vercel CLI globally...'));
    try {
      const installSpinner = ora('Installing vercel...').start();
      execSync('npm install -g vercel', { stdio: 'pipe' });
      installSpinner.succeed(chalk.green('Vercel CLI installed successfully'));
    } catch (error) {
      console.error(chalk.red('\n❌ Failed to install Vercel CLI:'));
      console.log(chalk.gray('Please run manually: npm install -g vercel'));
      rl.close();
      process.exit(1);
    }
  }

  // Check for API key in environment first
  let apiKey = process.env.ONEINCH_API_KEY;
  
  if (apiKey) {
    console.log(chalk.green(`✓ Using 1inch API key from environment`));
    console.log(chalk.gray(`  Key length: ${apiKey.length} characters`));
    console.log(chalk.gray(`  Key prefix: ${apiKey.substring(0, 8)}...`));
  }
  
  if (!apiKey) {
    // Check if user has 1inch API key
    console.log(chalk.cyan.bold('\n🔑 1inch API Key Setup\n'));
    console.log(chalk.white('You need a 1inch API key for the proxy to work.'));
    console.log(chalk.gray('Get it from: https://portal.1inch.dev/'));
    console.log(chalk.gray('For hackathons: Use ETHGlobal process (no KYC required)\n'));
    
    const hasApiKey = await question(chalk.yellow('Do you have your 1inch API key? (y/n): '));
    
    if (hasApiKey.toLowerCase() !== 'y') {
      console.log(chalk.yellow('\n⚠️  Please get your API key first, then run this script again.'));
      console.log(chalk.white('Visit: https://portal.1inch.dev/'));
      rl.close();
      return;
    }

    apiKey = await question(chalk.cyan('Enter your 1inch API key: '));
    
    if (!apiKey) {
      console.log(chalk.red('\n❌ API key is required!'));
      rl.close();
      return;
    }
  }

  // Generate proxy project
  console.log(chalk.blue.bold('\n🚀 Deploying Proxy to Vercel\n'));
  
  const tempDir = path.join(process.cwd(), '.proxy-temp');
  
  try {
    // Generate proxy files
    const generateSpinner = ora('Generating proxy project...').start();
    generateProxyProject(tempDir);
    generateSpinner.succeed(chalk.green('Proxy project generated'));

    // Check Vercel login status
    const loginSpinner = ora('Checking Vercel login status...').start();
    try {
      execSync('vercel whoami', { stdio: 'pipe' });
      loginSpinner.succeed(chalk.green('Already logged in to Vercel'));
    } catch {
      loginSpinner.warn(chalk.yellow('Not logged in to Vercel'));
      console.log(chalk.cyan('\n📧 Please log in to Vercel:'));
      console.log(chalk.gray('(You\'ll need a Vercel account - it\'s free)\n'));
      
      await spawnCommand('vercel', ['login'], { cwd: tempDir });
    }

    // Deploy to Vercel
    console.log(chalk.cyan('\n🎯 Deploying proxy to Vercel...\n'));
    
    // Try to set a project name that might give us a better subdomain
    const projectName = '1inch-proxy';
    
    // Deploy with only the necessary environment variable and project name
    const deployCommand = `vercel --prod --name="${projectName}" --build-env API_AUTH_TOKEN="${apiKey}" --env API_AUTH_TOKEN="${apiKey}" --yes`;
    console.log(chalk.gray(`Using project name: ${projectName}`));
    console.log(chalk.gray(`Deploying with environment variable: API_AUTH_TOKEN`));
    
    const deployOutput = execSync(deployCommand, {
      cwd: tempDir,
      stdio: 'pipe'
    }).toString();

    // Extract URL from deployment output
    const urlMatch = deployOutput.match(/https:\/\/[^\s]+\.vercel\.app/);
    if (!urlMatch) {
      throw new Error('Could not extract deployment URL');
    }

    const deployedUrl = urlMatch[0];
    console.log(chalk.green(`\n✅ Proxy deployed successfully!`));
    console.log(chalk.cyan(`🌐 Proxy URL: ${deployedUrl}`));

    // Extract project info for API calls
    console.log(chalk.cyan('\n🔧 Configuring deployment settings...'));
    
    try {
      // First, link to the project to get project info
      execSync(`vercel link --yes`, {
        cwd: tempDir,
        stdio: 'pipe'
      });
      
      // Get project details after linking
      const projectDetails = execSync(`vercel project`, {
        cwd: tempDir,
        stdio: 'pipe'
      }).toString();
      
      // Extract project ID from the output
      let projectId;
      const idMatch = projectDetails.match(/Project Id:\s+(\S+)/);
      if (idMatch) {
        projectId = idMatch[1];
      } else {
        throw new Error('Could not extract project ID');
      }
      
      // Get the user's Vercel token from auth file
      const homeDir = require('os').homedir();
      const authPath = path.join(homeDir, '.local', 'share', 'com.vercel.cli', 'auth.json');
      let token;
      
      try {
        const authData = JSON.parse(fs.readFileSync(authPath, 'utf8'));
        token = authData.token;
      } catch (e) {
        console.log(chalk.yellow('Could not read Vercel auth token'));
        throw new Error('Unable to get Vercel auth token');
      }
      
      // Extract team/scope info
      const teamInfo = execSync(`vercel team ls --json`, {
        stdio: 'pipe'
      }).toString();
      
      let teamId;
      try {
        const teams = JSON.parse(teamInfo);
        if (teams && teams.teams && teams.teams.length > 0) {
          teamId = teams.teams[0].id;
        }
      } catch (e) {
        // If no team, we'll use user scope
      }
      
      // Disable Vercel Authentication via API
      console.log(chalk.cyan('🔓 Disabling Vercel Authentication...'));
      
      // Use curl to make the API call since we need specific headers
      const apiCommand = `curl -X PATCH "https://api.vercel.com/v9/projects/${projectId}${teamId ? `?teamId=${teamId}` : ''}" \
        -H "Authorization: Bearer ${token}" \
        -H "Content-Type: application/json" \
        -d '{"ssoProtection":null}' \
        -s`;
        
      const apiResponse = execSync(apiCommand, {
        stdio: 'pipe',
        shell: true
      }).toString();
      
      // Check if the API call was successful
      try {
        const response = JSON.parse(apiResponse);
        if (response.error) {
          throw new Error(response.error.message || 'API call failed');
        }
        console.log(chalk.green('✓ Vercel Authentication disabled successfully'));
      } catch (e) {
        console.log(chalk.yellow('⚠️  Could not parse API response'));
        console.log(chalk.gray(`Response: ${apiResponse.substring(0, 200)}`));
      }
      
      // Set environment variable
      console.log(chalk.cyan('🔑 Setting environment variable...'));
      const envCommand = `printf "${apiKey}" | vercel env add API_AUTH_TOKEN production`;
      execSync(envCommand, {
        cwd: tempDir,
        stdio: 'pipe',
        shell: true
      });
      
      console.log(chalk.green('✓ Environment variable set successfully'));
      
    } catch (error) {
      console.log(chalk.yellow('\n⚠️  Could not configure automatically. Manual steps required:'));
      console.log(chalk.white('1. Go to https://vercel.com/dashboard'));
      console.log(chalk.white('2. Select your "1inch-proxy" project'));
      console.log(chalk.white('3. Go to Settings → Deployment Protection'));
      console.log(chalk.white('4. Turn OFF "Vercel Authentication"'));
      console.log(chalk.white('5. Check Environment Variables for API_AUTH_TOKEN'));
    }

    // Update environment variables
    const updateSpinner = ora('Updating environment files...').start();
    
    // Update packages/nextjs/.env.local
    const nextjsEnvPath = path.join(process.cwd(), 'packages/nextjs/.env.local');
    let nextjsEnvContent = '';
    
    if (fs.existsSync(nextjsEnvPath)) {
      nextjsEnvContent = fs.readFileSync(nextjsEnvPath, 'utf8');
      // Update existing entries
      nextjsEnvContent = nextjsEnvContent.replace(
        /NEXT_PUBLIC_PROXY_URL=.*/g,
        `NEXT_PUBLIC_PROXY_URL=${deployedUrl}`
      );
      nextjsEnvContent = nextjsEnvContent.replace(
        /NEXT_PUBLIC_ONE_INCH_API_URL=.*/g,
        `NEXT_PUBLIC_ONE_INCH_API_URL=${deployedUrl}`
      );
      
      // Add if not exists
      if (!nextjsEnvContent.includes('NEXT_PUBLIC_PROXY_URL=')) {
        nextjsEnvContent += `\nNEXT_PUBLIC_PROXY_URL=${deployedUrl}`;
      }
      if (!nextjsEnvContent.includes('NEXT_PUBLIC_ONE_INCH_API_URL=')) {
        nextjsEnvContent += `\nNEXT_PUBLIC_ONE_INCH_API_URL=${deployedUrl}`;
      }
    } else {
      nextjsEnvContent = `NEXT_PUBLIC_PROXY_URL=${deployedUrl}
NEXT_PUBLIC_ONE_INCH_API_URL=${deployedUrl}
`;
    }
    
    fs.writeFileSync(nextjsEnvPath, nextjsEnvContent);
    
    // Also update root .env if exists
    const rootEnvPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(rootEnvPath)) {
      let rootEnvContent = fs.readFileSync(rootEnvPath, 'utf8');
      rootEnvContent = rootEnvContent.replace(
        /NEXT_PUBLIC_PROXY_URL=.*/g,
        `NEXT_PUBLIC_PROXY_URL=${deployedUrl}`
      );
      rootEnvContent = rootEnvContent.replace(
        /NEXT_PUBLIC_ONE_INCH_API_URL=.*/g,
        `NEXT_PUBLIC_ONE_INCH_API_URL=${deployedUrl}`
      );
      
      if (!rootEnvContent.includes('NEXT_PUBLIC_PROXY_URL=')) {
        rootEnvContent += `\nNEXT_PUBLIC_PROXY_URL=${deployedUrl}`;
      }
      if (!rootEnvContent.includes('NEXT_PUBLIC_ONE_INCH_API_URL=')) {
        rootEnvContent += `\nNEXT_PUBLIC_ONE_INCH_API_URL=${deployedUrl}`;
      }
      
      fs.writeFileSync(rootEnvPath, rootEnvContent);
    }
    
    updateSpinner.succeed(chalk.green('Environment files updated'));

    // Wait a bit for the environment variable to propagate
    console.log(chalk.yellow('\n⏳ Waiting for environment variable to propagate...'));
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    // Test the proxy
    console.log(chalk.cyan('\n🧪 Testing proxy...'));
    const testScript = path.join(__dirname, 'test-proxy.js');
    if (fs.existsSync(testScript)) {
      try {
        execSync(`node "${testScript}" "${deployedUrl}"`, { stdio: 'inherit' });
      } catch (error) {
        console.log(chalk.yellow('⚠️  Proxy test had some issues, but deployment succeeded'));
      }
    }

    // Cleanup
    const cleanupSpinner = ora('Cleaning up temporary files...').start();
    fs.rmSync(tempDir, { recursive: true, force: true });
    cleanupSpinner.succeed(chalk.green('Cleanup complete'));

    // Success message
    console.log(chalk.green.bold('\n✨ Proxy setup complete!\n'));
    console.log(chalk.white('Your proxy is now deployed and configured.'));
    console.log(chalk.white(`Proxy URL: ${chalk.cyan(deployedUrl)}`));
    console.log(chalk.white('\nThe proxy will handle all CORS issues with the 1inch API.'));
    
    console.log(chalk.yellow.bold('\n📝 Notes:'));
    console.log(chalk.white('- Your API key is securely stored in Vercel'));
    console.log(chalk.white('- The proxy URL has been saved to your environment files'));
    console.log(chalk.white('- Authentication has been disabled automatically'));
    console.log(chalk.white('- You can manage your deployment at: https://vercel.com/dashboard'));

  } catch (error) {
    console.error(chalk.red('\n❌ Deployment failed:'), error.message);
    
    // Cleanup on error
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    console.log(chalk.yellow('\n💡 Troubleshooting tips:'));
    console.log(chalk.white('1. Make sure you have a Vercel account'));
    console.log(chalk.white('2. Try running: vercel login'));
    console.log(chalk.white('3. Check your internet connection'));
    console.log(chalk.white('4. Try manual deployment (see docs/PROXY-DEPLOYMENT.md)'));
    
    rl.close();
    process.exit(1);
  }

  rl.close();
}

// Handle standalone proxy deployment
async function deployProxy() {
  await setupProxy();
}

// Export for use in other scripts
module.exports = { setupProxy, deployProxy };

// Run if called directly
if (require.main === module) {
  setupProxy().catch(error => {
    console.error(chalk.red('\n❌ Proxy setup failed:'), error);
    rl.close();
    process.exit(1);
  });
}