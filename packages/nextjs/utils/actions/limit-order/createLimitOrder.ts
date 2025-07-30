'use server';

import { LimitOrder, MakerTraits, Address, Api, randBigInt } from "@1inch/limit-order-sdk";
import { AxiosProviderConnector } from "@1inch/limit-order-sdk/axios";
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
  const httpConnector = new AxiosProviderConnector();
  const api = new Api({
    networkId: CHAIN_ID as number,
    authKey: API_KEY,
    httpConnector,
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
