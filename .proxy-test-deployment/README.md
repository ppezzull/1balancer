# 1Balancer Proxy Server

This proxy server handles CORS issues when making 1inch API calls from the browser.

## Setup

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Set your 1inch API key:
   - Copy `.env.example` to `.env`
   - Add your API key from https://portal.1inch.dev/

3. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

4. Set the environment variable in Vercel:
   - Go to your project settings in Vercel dashboard
   - Add `ONE_INCH_API_KEY` with your API key value

## Local Development

Run locally with:
```bash
vercel dev
```

## API Endpoints

All 1inch API endpoints are available through this proxy:
- `/swap/v6.0/{chain}/quote`
- `/price/v1.1/{chain}`
- `/balance/v1.2/{chain}/balances/{wallet}`
- `/orderbook/v4.0/{chain}`
- And all other 1inch API endpoints

## Usage

Replace `https://api.1inch.dev` with your proxy URL in your frontend code.
