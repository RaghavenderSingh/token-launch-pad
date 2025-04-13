'use client';

import { AppWalletProvider } from './AppWalletProvider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AppWalletProvider>{children}</AppWalletProvider>;
} 