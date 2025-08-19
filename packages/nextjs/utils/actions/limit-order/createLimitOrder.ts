'use server';

import { LimitOrder, MakerTraits, Address, Api, randBigInt } from "@1inch/limit-order-sdk";
import axios from 'axios';
import { CHAIN_ID, API_KEY } from '../../constants';
import { WalletClient } from 'viem';

/**
 * A server action to create and submit a 1inch limit order.
 * It uses the provided wagmi WalletClient for signing and the 1inch SDK's Api for submission.
 */
export async function createAndSubmitLimitOrder(
  walletClient: WalletClient,
  makerAddress: string,
  makerAsset: string,
  takerAsset: string,
  makingAmount: string,
  takingAmount: string,
) {
  // When running on the server, we need to provide the full URL to the proxy.
  // VERCEL_URL is a system environment variable provided by Vercel.
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  // Create a custom axios instance that points to our proxy route.
  const axiosInstance = axios.create({
    baseURL: `${baseUrl}/api/1inch`,
  });


  // The authKey is required by the SDK, but we can use a dummy value.
  // The real key is added by our proxy route.
  const api = new Api({
    networkId: CHAIN_ID as number,
    authKey: API_KEY,
    httpConnector: axiosInstance,
  });

  const expiresIn = 120n; // 2 minutes
  const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn;
  const UINT_40_MAX = (1n << 48n) - 1n; // A large random number for the nonce

  const makerTraits = MakerTraits.default()
    .withExpiration(expiration)
    .withNonce(randBigInt(UINT_40_MAX));

  const order = new LimitOrder({
    makerAsset: new Address(makerAsset),
    takerAsset: new Address(takerAsset),
    makingAmount: BigInt(makingAmount),
    takingAmount: BigInt(takingAmount),
    maker: new Address(makerAddress),
  }, makerTraits);

  const typedData = order.getTypedData(CHAIN_ID as number);

  const signature = await walletClient.signTypedData({
    account: makerAddress as `0x${string}`,
    domain: typedData.domain,
    types: { Order: typedData.types.Order },
    primaryType: 'Order',
    message: typedData.message,
  });

  await api.submitOrder(order, signature);

  return {
    order,
    signature,
    orderHash: order.getOrderHash(CHAIN_ID as number),
  };
}
