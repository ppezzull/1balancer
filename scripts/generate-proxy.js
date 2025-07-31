#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { default: chalk } = require('chalk');

/**
 * Generates a complete Vercel proxy project for 1inch API
 * This script creates all necessary files for deployment
 */

function generateProxyProject(outputDir) {
  console.log(chalk.blue('🔨 Generating Vercel proxy project...'));

  // Create directory structure
  const dirs = [
    outputDir,
    path.join(outputDir, 'api')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Generate api/proxy.js - the exact proxy handler from official 1inch repo
  const proxyHandler = `export default async function handler(req, res) {

  // Allow only http://localhost:* or a single user-defined origin
  const origin = req.headers.origin || '';
  const isLocalhost = /^https?:\\/\\/localhost(:\\d+)?$/i.test(origin);
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '';
  const isAllowedOrigin = origin === allowedOrigin;

  if (isLocalhost || isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  // Short-circuit pre-flight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { API_AUTH_TOKEN } = process.env;

  if (!API_AUTH_TOKEN) {
    return res.status(500).json({ error: "API_AUTH_TOKEN is missing from env" });
  }

  try {
    // Remove the leading "/api/" from req.url
    // e.g. "/api/foo/bar" -> "foo/bar"
    const path = req.url.replace(/^\\/api\\//, '');

    if (!path || path === "/" || path === "") {
      return res.status(400).json({
        error:
          "This is just the root path of the proxy! It doesn't do anything on its own. You need to append the path of the 1inch API you want to talk to",
      });
    }    

    // Build the target URL, removing any leading slash from path to prevent double slashes
    const targetUrl = \`https://api.1inch.dev/\${path.replace(/^\\//, "")}\`;

    // Prepare headers
    const headers = new Headers();
    headers.set("Authorization", \`Bearer \${API_AUTH_TOKEN}\`);

    // Only forward essential headers
    const allowedHeaders = [
      "accept",
      "accept-encoding",
      "accept-language",
      "content-type",
      "authorization",
      "user-agent"
    ];
    for (let [key, value] of Object.entries(req.headers)) {
      if (
        key.toLowerCase() !== "host" &&
        allowedHeaders.includes(key.toLowerCase())
      ) {
        headers.set(key, value);
      }
    }

    // Make the proxied request
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const text = await response.text();

    // If the response code is anything other than a 200, check if there is a response body before parsing it.
    if (response.status !== 200) {
      const contentLength = response.headers.get("content-length");
      if (!contentLength || parseInt(contentLength, 10) === 0) {
        return res.status(response.status).json({ error: "No content returned" });
      }
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (jsonErr) {
      return res.status(500).json({ error: "Invalid JSON from upstream", raw: text });
    }
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
`;

  // Generate vercel.json configuration - exact copy from official repo
  const vercelConfig = {
    "version": 2,
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/api/proxy.js"
      }
    ],
    "headers": [
      {
        "source": "/api/(.*)",
        "headers": [
          { "key": "Access-Control-Allow-Origin", "value": "https://app.example" },
          { "key": "Access-Control-Allow-Methods", "value": "GET, POST, OPTIONS" },
          { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" },
          { "key": "Access-Control-Allow-Credentials", "value": "true" }
        ]
      }
    ]
  };

  // The official repo doesn't have a package.json, so we create a minimal one for our deployment
  const packageJson = {
    "name": "1balancer-proxy",
    "version": "1.0.0",
    "description": "1inch Vercel Proxy - exact copy of Tanz0rz/1inch-vercel-proxy",
    "main": "api/proxy.js",
    "scripts": {
      "dev": "vercel dev",
      "deploy": "vercel --prod"
    },
    "dependencies": {},
    "engines": {
      "node": ">=18.x"
    }
  };

  // Generate .env.example - based on official repo documentation
  const envExample = `# 1inch API Key (required)
# Get your key from: https://portal.1inch.dev/
API_AUTH_TOKEN=your_1inch_api_key_here

# Optional: Allowed origin for CORS (defaults to localhost for local development)
# ALLOWED_ORIGIN=https://yourdomain.com
`;

  // Generate .gitignore
  const gitignore = `.env
.env.local
.env.production
.vercel
node_modules/
`;

  // Generate README.md
  const readme = `# 1Balancer Proxy Server

This proxy server handles CORS issues when making 1inch API calls from the browser.

## Setup

1. Install Vercel CLI (if not already installed):
   \`\`\`bash
   npm i -g vercel
   \`\`\`

2. Set your 1inch API key:
   - Copy \`.env.example\` to \`.env\`
   - Add your API key from https://portal.1inch.dev/

3. Deploy to Vercel:
   \`\`\`bash
   vercel --prod
   \`\`\`

4. Set the environment variable in Vercel:
   - Go to your project settings in Vercel dashboard
   - Add \`ONEINCH_API_KEY\` with your API key value

## Local Development

Run locally with:
\`\`\`bash
vercel dev
\`\`\`

## API Endpoints

All 1inch API endpoints are available through this proxy:
- \`/swap/v6.0/{chain}/quote\`
- \`/price/v1.1/{chain}\`
- \`/balance/v1.2/{chain}/balances/{wallet}\`
- \`/orderbook/v4.0/{chain}\`
- And all other 1inch API endpoints

## Usage

Replace \`https://api.1inch.dev\` with your proxy URL in your frontend code.
`;

  // Write all files - exact structure as official repo
  const files = [
    { path: path.join(outputDir, 'api/proxy.js'), content: proxyHandler },
    { path: path.join(outputDir, 'vercel.json'), content: JSON.stringify(vercelConfig, null, 2) },
    { path: path.join(outputDir, 'package.json'), content: JSON.stringify(packageJson, null, 2) },
    { path: path.join(outputDir, '.env.example'), content: envExample },
    { path: path.join(outputDir, '.gitignore'), content: gitignore },
    { path: path.join(outputDir, 'README.md'), content: readme }
  ];

  files.forEach(({ path: filePath, content }) => {
    fs.writeFileSync(filePath, content);
    console.log(chalk.green(`✓ Created ${path.relative(process.cwd(), filePath)}`));
  });

  console.log(chalk.green('\n✨ Proxy project generated successfully!'));
  return outputDir;
}

// Export for use in other scripts
module.exports = { generateProxyProject };

// Run directly if called from command line
if (require.main === module) {
  const outputDir = process.argv[2] || path.join(process.cwd(), 'proxy-temp');
  generateProxyProject(outputDir);
}