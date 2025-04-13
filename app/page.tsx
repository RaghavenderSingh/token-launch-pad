"use client"
import TokenLaunchPad from "@/components/TokenLaunchPad";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Image from "next/image";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="text-center space-y-8">
    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
      Launch Your Token on Solana
    </h1>
    <p className="text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
      Create, launch, and manage your token with our easy-to-use platform. 
      Everything you need to launch your token on Solana in one place.
      Now with Raydium liquidity pools!
    </p>
    <div className="flex items-center justify-center gap-4">
      <Link
        href="/create"
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
      >
        Create Token
      </Link>
      <Link
        href="/launch"
        className="rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold shadow-sm hover:bg-accent hover:text-accent-foreground"
      >
        Launch Token
      </Link>
      <Link
        href="/liquidity"
        className="rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/90"
      >
        Create Liquidity Pool
      </Link>
      <Link
        href="/manage-pools"
        className="rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold shadow-sm hover:bg-accent hover:text-accent-foreground"
      >
        Manage Pools
      </Link>
    </div>
  </div>
  );
}
