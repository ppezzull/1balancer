# 1inch API CORS Proxy

This proxy server handles CORS issues when accessing 1inch APIs from the frontend. It's required because 1inch APIs don't support browser-based CORS requests.

## Features

- ✅ Handles all 1inch API endpoints (Swap, Orderbook, Fusion, Fusion+)
- ✅ Automatic API key injection
- ✅ Rate limiting protection
- ✅ Security headers with Helmet
- ✅ Request/response logging
- ✅ Support for multiple price feed sources
- ✅ Vercel deployment ready

## Local Development

### Setup

1. Install dependencies:
```bash
yarn proxy:install
```

2. Create `.env` file:
```bash
cp packages/proxy/.env.example packages/proxy/.env
```

3. Configure your 1inch API key in `.env`:
```
ONEINCH_API_KEY=your_hackathon_api_key_here
```

### Running the Proxy

Start in development mode:
```bash
yarn proxy:dev
```

Or production mode:
```bash
yarn proxy
```

The proxy will run on http://localhost:3001

### Using with Frontend

Update your frontend API calls to use the proxy:

```typescript
// Instead of:
const response = await fetch('https://api.1inch.dev/swap/v6.0/8453/quote?...')

// Use:
const response = await fetch('http://localhost:3001/api/1inch/swap/v6.0/8453/quote?...')
```

## API Endpoints

### 1inch Swap API
- `GET /api/1inch/swap/v6.0/:chain/tokens`
- `GET /api/1inch/swap/v6.0/:chain/quote`
- `GET /api/1inch/swap/v6.0/:chain/swap`
- `GET /api/1inch/swap/v6.0/:chain/approve/transaction`
- `GET /api/1inch/swap/v6.0/:chain/approve/allowance`
- `GET /api/1inch/swap/v6.0/:chain/approve/spender`

### 1inch Orderbook API
- `GET /api/1inch/orderbook/v4.0/:chain`
- `POST /api/1inch/orderbook/v4.0/:chain/order`
- `GET /api/1inch/orderbook/v4.0/:chain/address/:address/orders`
- `GET /api/1inch/orderbook/v4.0/:chain/order/:orderHash`
- `POST /api/1inch/orderbook/v4.0/:chain/fill`

### 1inch Fusion API
- `GET /api/1inch/fusion/relayers/v2.0/:chain/relayers/addresses/active`
- `POST /api/1inch/fusion/quoter/v2.0/:chain/quote/receive`
- `POST /api/1inch/fusion/relayers/v2.0/:chain/order/submit`
- `GET /api/1inch/fusion/relayers/v2.0/:chain/order/:orderHash/status`
- `POST /api/1inch/fusion/relayers/v2.0/:chain/order/:orderHash/cancel`

### Price Feeds
- `GET /api/prices/*` - Proxies to CoinGecko API

### Health Check
- `GET /health` - Returns server status

## Supported Chains

- `1` - Ethereum Mainnet
- `8453` - Base
- `137` - Polygon
- `42161` - Arbitrum
- `10` - Optimism
- `56` - BSC

## Configuration

### Environment Variables

```bash
# Server
PROXY_PORT=3001
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002

# 1inch API
ONEINCH_API_URL=https://api.1inch.dev
ONEINCH_API_KEY=your_api_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Development vs Production

The proxy automatically loads different configurations based on `NODE_ENV`:

- **Development**: More verbose logging, relaxed CORS, higher rate limits
- **Production**: Strict security headers, limited logging, standard rate limits

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Configure environment variables in Vercel:
```bash
vercel env add ONEINCH_API_KEY
vercel env add ALLOWED_ORIGINS
```

3. Deploy:
```bash
cd packages/proxy
vercel
```

### Manual Deployment

The proxy can be deployed to any Node.js hosting service:

1. Set `NODE_ENV=production`
2. Configure environment variables
3. Run `node index.js`

## Security

- Rate limiting prevents API abuse
- Helmet.js provides security headers
- CORS is properly configured
- API keys are never exposed to frontend
- All errors are sanitized in production

## Troubleshooting

### CORS Errors
- Ensure the proxy is running
- Check `ALLOWED_ORIGINS` includes your frontend URL
- Verify you're using the proxy URL, not direct 1inch API

### 401 Unauthorized
- Check your `ONEINCH_API_KEY` is set correctly
- Verify the API key is valid for the hackathon

### Rate Limiting
- Default: 100 requests per 15 minutes per IP
- Increase `RATE_LIMIT_MAX_REQUESTS` for development

### Connection Refused
- Ensure proxy is running on the correct port
- Check firewall settings
- Verify no other service is using port 3001

## Integration Example

```typescript
// services/oneInchService.ts
const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || 'http://localhost:3001';

export async function getQuote(params: QuoteParams) {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(
    `${PROXY_URL}/api/1inch/swap/v6.0/8453/quote?${queryString}`
  );
  
  if (!response.ok) {
    throw new Error(`Quote failed: ${response.statusText}`);
  }
  
  return response.json();
}
```

## Development Tips

1. Use `yarn proxy:dev` for auto-reload on changes
2. Check console logs for request/response details
3. Test with curl: `curl http://localhost:3001/health`
4. Monitor rate limits in development
5. Use Chrome DevTools Network tab to debug

## Contributing

When adding new 1inch endpoints:

1. Update `middleware/1inch-routes.js`
2. Add route documentation in this README
3. Test with actual 1inch API calls
4. Ensure proper error handling