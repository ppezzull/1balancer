export enum PresetEnum {
  fast = "fast",
  medium = "medium",
  slow = "slow",
}

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type QuoteParams = {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  permit?: string;
  takingFeeBps?: number;
};

export type TakingFeeInfo = {
  takingFeeBps: number;
  takingFeeReceiver: string;
};

// Assuming OrderNonce is a type that can be a string or number, but the docs are not clear.
// For now, we'll use a simple type alias.
export type OrderNonce = string | number;

export type OrderParams = {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  walletAddress: string;
  permit?: string;
  receiver?: string;
  preset?: PresetEnum;
  nonce?: OrderNonce;
  fee?: TakingFeeInfo;
};

// The SDK documentation does not specify the structure of the Order, Quote, ReadyToAcceptSecretFills,
// ReadyToExecutePublicActions, and PublishedSecretsResponse types. I will define them with a generic
// object structure for now. You may need to update these with the correct fields later.

export type Order = Record<string, any>;

export type Quote = Record<string, any>;

export type ReadyToAcceptSecretFills = Record<string, any>;

export type ReadyToExecutePublicActions = Record<string, any>;

export type PublishedSecretsResponse = Record<string, any>;
