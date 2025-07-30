"use server";

import { BadRequestErrorDto, TokenDto } from "../../types/token";
import { CHAIN_ID } from "../../constants";

export async function getToken(address: string): Promise<TokenDto | null> {
  // When running on the server, we need to provide the full URL to the proxy.
  // VERCEL_URL is a system environment variable provided by Vercel.
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const url = `${baseUrl}/api/1inch/token/v1.2/${CHAIN_ID}/custom/${address}`;

  const res = await fetch(url);

  if (!res.ok) {
    const error: BadRequestErrorDto = await res.json();
    console.error("Failed to fetch token:", error);
    return null;
  }

  const token: TokenDto = await res.json();
  return token;
}
