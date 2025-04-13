'use client';

import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { cn } from '@/lib/utils';

export function Navigation() {
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className="font-bold text-xl">
            Token Launch Pad
          </Link>
          <div className="flex space-x-4">
            <Link href="/create" className="text-sm font-medium transition-colors hover:text-primary">
              Create Token
            </Link>
            <Link href="/launch" className="text-sm font-medium transition-colors hover:text-primary">
              Launch Token
            </Link>
            <Link href="/liquidity" className="text-sm font-medium transition-colors hover:text-primary">
              Create Pool
            </Link>
            <Link href="/manage-pools" className="text-sm font-medium transition-colors hover:text-primary">
              Manage Pools
            </Link>
            <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
              Dashboard
            </Link>
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <WalletMultiButton className="bg-primary text-primary-foreground hover:bg-primary/90" />
        </div>
      </div>
    </nav>
  );
} 