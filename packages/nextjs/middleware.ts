import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Check if it's a wallet protected route
  const isWalletRoute = pathname.startsWith('/wallet');
  
  if (isWalletRoute) {
    // Check for Privy authentication tokens in cookies
    // Privy typically stores tokens with these names
    const privyTokens = [
      'privy-token',
      'privy-refresh-token', 
      'privy-id-token',
      'privy-access-token',
      'privy-session',
      '_privy_token',
      '_privy_refresh_token'
    ];
    
    const hasAuthToken = privyTokens.some(tokenName => 
      request.cookies.get(tokenName)?.value
    );
    
    // If no authentication token found, redirect to home
    if (!hasAuthToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('redirect', pathname); // Preserve intended destination
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/wallet/:path*'
  ]
};