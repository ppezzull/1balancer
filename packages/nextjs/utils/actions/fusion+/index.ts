"use server";

import {
  Order,
  OrderParams,
  PaginationParams,
  PublishedSecretsResponse,
  Quote,
  QuoteParams,
  ReadyToAcceptSecretFills,
  ReadyToExecutePublicActions,
} from "../../types/fusion+";

const getBaseUrl = () => {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
};

export async function getActiveOrders(params: PaginationParams): Promise<Order[] | null> {
  const url = `${getBaseUrl()}/api/1inch/fusion-plus/orders/active?page=${params.page}&limit=${params.limit}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
}

export async function getOrdersByMaker(params: PaginationParams & { address: string }): Promise<Order[] | null> {
  const url = `${getBaseUrl()}/api/1inch/fusion-plus/orders/maker/${params.address}?page=${params.page}&limit=${params.limit}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
}

export async function getQuote(params: QuoteParams): Promise<Quote | null> {
  const url = `${getBaseUrl()}/api/1inch/fusion-plus/quote`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function createOrder(quote: Quote, params: OrderParams): Promise<Order | null> {
  const url = `${getBaseUrl()}/api/1inch/fusion-plus/order`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quote, params }),
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function getReadyToAcceptSecretFills(orderHash: string): Promise<ReadyToAcceptSecretFills | null> {
  const url = `${getBaseUrl()}/api/1inch/fusion-plus/order/ready-to-accept-secret-fills/${orderHash}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
}

export async function getReadyToExecutePublicActions(): Promise<ReadyToExecutePublicActions | null> {
  const url = `${getBaseUrl()}/api/1inch/fusion-plus/order/ready-to-execute-public-actions`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
}

export async function getPublishedSecrets(orderHash: string): Promise<PublishedSecretsResponse | null> {
  const url = `${getBaseUrl()}/api/1inch/fusion-plus/order/published-secrets/${orderHash}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
}

export async function submitSecret(orderHash: string, secret: string): Promise<void | null> {
  const url = `${getBaseUrl()}/api/1inch/fusion-plus/order/submit-secret`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderHash, secret }),
  });
  if (!res.ok) return null;
  return await res.json();
}
