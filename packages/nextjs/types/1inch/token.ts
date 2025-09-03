export interface TagDto {
  provider: string;
  value: string;
  providers: string[];
}

export interface TokenDto {
  chainId: number;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
  rating: number;
  eip2612?: boolean;
  isFoT?: boolean;
  tags: TagDto[];
}

export interface BadRequestErrorDto {
  statusCode: number;
  message: string;
  error: string;
}

export interface CustomTokensRequest {
  tokens: string[];
}

export interface CustomTokensAndWalletsRequest {
  tokens: string[];
  wallets: string[];
}

export type TokenBalancesResponse = Record<string, string>;

export type MultiWalletBalancesResponse = Record<string, Record<string, string>>;
