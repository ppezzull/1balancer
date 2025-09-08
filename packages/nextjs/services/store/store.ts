"use client";

import { create } from "zustand";
import scaffoldConfig from "~~/scaffold.config";
import { CryptoData } from "~~/types";
import { ChainWithAttributes, NETWORKS_EXTRA_DATA } from "~~/utils/scaffold-eth";

/**
 * Zustand Store
 *
 * You can add global state to the app using this useGlobalState, to get & set
 * values from anywhere in the app.
 *
 * Think about it as a global useState.
 */

type GlobalState = {
  nativeCurrency: {
    price: number;
    isFetching: boolean;
  };
  setNativeCurrencyPrice: (newNativeCurrencyPriceState: number) => void;
  setIsNativeCurrencyFetching: (newIsNativeCurrencyFetching: boolean) => void;
  targetNetwork: ChainWithAttributes;
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => void;
  // Cached ticker data to avoid spamming external APIs
  tickerData: CryptoData[];
  setTickerData: (data: CryptoData[]) => void;
};

export const useGlobalState = create<GlobalState>(set => ({
  nativeCurrency: {
    price: 0,
    isFetching: true,
  },
  setNativeCurrencyPrice: (newValue: number): void =>
    set(state => ({ nativeCurrency: { ...state.nativeCurrency, price: newValue } })),
  setIsNativeCurrencyFetching: (newValue: boolean): void =>
    set(state => ({ nativeCurrency: { ...state.nativeCurrency, isFetching: newValue } })),
  targetNetwork: {
    ...scaffoldConfig.targetNetworks[0],
    ...NETWORKS_EXTRA_DATA[scaffoldConfig.targetNetworks[0].id],
  },
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => set(() => ({ targetNetwork: newTargetNetwork })),
  tickerData: [],
  setTickerData: (data: CryptoData[]) => set(() => ({ tickerData: data })),
}));
