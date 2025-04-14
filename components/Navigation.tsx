'use client';

import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();
  
  // Check if path is active
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className="font-bold text-xl">
            Token Launch Pad
          </Link>
          <div className="flex space-x-4">
            <Link 
              href="/create" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive('/create') ? "text-primary" : ""
              )}
            >
              Create Token
            </Link>
            <Link 
              href="/launch" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive('/launch') ? "text-primary" : ""
              )}
            >
              Launch Token
            </Link>
            <Link 
              href="/liquidity" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive('/liquidity') ? "text-primary" : ""
              )}
            >
              Create Pool
            </Link>
            <Link 
              href="/manage-pools" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive('/manage-pools') ? "text-primary" : ""
              )}
            >
              Manage Pools
            </Link>
            <Link 
              href="/swap" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive('/swap') ? "text-primary" : ""
              )}
            >
              Swap
            </Link>
            <Link 
              href="/dashboard" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive('/dashboard') ? "text-primary" : ""
              )}
            >
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