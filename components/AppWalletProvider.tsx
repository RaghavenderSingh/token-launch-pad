"use client";

import { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import {
  PhantomWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import ClientOnly from './ClientOnly';

import "@solana/wallet-adapter-react-ui/styles.css";

export function AppWalletProvider({ children }: { children: React.ReactNode }) {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const endpoint = process.env.NEXT_PUBLIC_RPC_URL?.trim() || 'https://api.devnet.solana.com';

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking
  // and lazy loading--only the wallets you configure here will be compiled into your
  // application, and only the dependencies of wallets that your users connect to will
  // be loaded
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ClientOnly>
      <ConnectionProvider endpoint={endpoint!}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ClientOnly>
  );
}
 