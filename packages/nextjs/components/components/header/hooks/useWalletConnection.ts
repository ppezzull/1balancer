import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner@2.0.3";

export function useWalletConnection(propIsWalletConnected?: boolean) {
  const [isWalletConnected, setIsWalletConnected] = useState(propIsWalletConnected || false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);

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

  // Function to simulate wallet connection
  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate wallet connection (in a real app you would use Web3 or wallet provider)
      const mockAddress = "0x" + Math.random().toString(16).substring(2, 42);
      setWalletAddress(mockAddress);
      setIsWalletConnected(true);
      
      // Emit connection event
      emitWalletConnectionEvent(true);
      
      toast.success("Wallet connected successfully!", {
        description: `Address: ${mockAddress.slice(0, 6)}...${mockAddress.slice(-4)}`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Error connecting wallet", {
        description: "Please try again later",
        duration: 3000,
      });
    } finally {
      setIsConnecting(false);
    }
  }, [emitWalletConnectionEvent]);

  // Function to disconnect wallet
  const disconnectWallet = useCallback(() => {
    console.log('Disconnecting wallet');
    setIsWalletConnected(false);
    setWalletAddress("");
    
    // Emit disconnection event
    emitWalletConnectionEvent(false);
    
    toast.info("Wallet disconnected", {
      description: "Your wallet has been disconnected successfully",
      duration: 2000,
    });
  }, [emitWalletConnectionEvent]);

  // Function to shorten address
  const shortenAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  return {
    isWalletConnected,
    walletAddress,
    isConnecting,
    connectWallet,
    disconnectWallet,
    shortenAddress
  };
}