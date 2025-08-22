import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { createClient } from "~~/utils/supabase/client";

export function useWalletConnection(propIsWalletConnected?: boolean) {
  const [isWalletConnected, setIsWalletConnected] = useState(propIsWalletConnected || false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { address, isConnected } = useAccount();

  // Sync wallet connection state with prop
  useEffect(() => {
    if (propIsWalletConnected !== undefined) {
      setIsWalletConnected(propIsWalletConnected);
    }
  }, [propIsWalletConnected]);

  // Emit wallet connection event
  const emitWalletConnectionEvent = useCallback((connected: boolean) => {
    const event = new CustomEvent('wallet-connection-changed', {
      detail: { connected }
    });
    window.dispatchEvent(event);
  }, []);

  // Function to connect using Supabase UI
  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      router.push("/auth/login");
      emitWalletConnectionEvent(true);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Error connecting wallet", {
        description: "Please try again later",
        duration: 3000,
      });
    } finally {
      setIsConnecting(false);
    }
  }, [emitWalletConnectionEvent, router]);

  // Function to disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      emitWalletConnectionEvent(false);
      toast.info("Signed out", { duration: 2000 });
    } catch (e) {
      console.error(e);
    }
  }, [emitWalletConnectionEvent, supabase.auth]);

  // Function to shorten address
  const shortenAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Sync local state: consider connected if there is a wagmi address or a Supabase session
  useEffect(() => {
    // We can't read Supabase session here without async; rely on header components to show auth UI when not connected
    setIsWalletConnected(Boolean(isConnected && address));
    setWalletAddress((address || "").toString());
  }, [isConnected, address]);

  return {
    isWalletConnected,
    walletAddress,
  isConnecting,
    connectWallet,
    disconnectWallet,
    shortenAddress,
  };
}