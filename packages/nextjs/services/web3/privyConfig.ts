// privyConfig.ts
import type { PrivyClientConfig } from "@privy-io/react-auth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

// Return a Privy config object for the provided theme. Call this from a
// component that knows the current app theme so Privy can match your UI.
export const getPrivyConfig = (theme: "light" | "dark" | "system" = "light"): PrivyClientConfig => ({
  // Configure embedded wallets for Account Abstraction
  embeddedWallets: {
    createOnLogin: "users-without-wallets",
    showWalletUIs: true,
  },
  // Multiple login methods for better UX
  loginMethods: ["wallet", "email", "sms", "google"],
  appearance: {
    showWalletLoginFirst: true, // Show social login first for embedded wallets
    // Privy accepts "light" | "dark" | `#${string}` | undefined —
    // map the special "system" value to undefined so Privy will
    // fallback to its default/system behavior.
    theme: theme === "system" ? undefined : theme,
  },
  // Use the first enabled chain as default (usually the target network)
  defaultChain: wagmiConfig.chains[0],
  // Support all chains from wagmi config
  supportedChains: [...wagmiConfig.chains],
});
