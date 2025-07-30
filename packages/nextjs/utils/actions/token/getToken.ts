"use server";

import { BadRequestErrorDto, TokenDto } from "../../types/token";
import { CHAIN_ID, API_KEY, ONEINCH_API_BASE } from "../../constants";

export async function getToken(address: string): Promise<TokenDto | null> {
  const res = await fetch(`${ONEINCH_API_BASE}/token/v1.2/${CHAIN_ID}/custom/${address}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  if (!res.ok) {
    const error: BadRequestErrorDto = await res.json();
    console.error("Failed to fetch token:", error);
    return null;
  }

  const token: TokenDto = await res.json();
  return token;
}
