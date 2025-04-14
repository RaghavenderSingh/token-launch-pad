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
        Now with Raydium liquidity pools and token swapping!
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
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
        <Link
          href="/swap"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Swap Tokens
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-12">
        <div className="border rounded-lg p-6 text-left">
          <h2 className="text-xl font-semibold mb-4">Create & Launch</h2>
          <p className="text-muted-foreground mb-4">
            Create your custom token on Solana with just a few clicks. Set name, symbol,
            supply, and metadata. Then launch it to the community.
          </p>
          <Link href="/create" className="text-primary hover:underline">
            Get started →
          </Link>
        </div>
        
        <div className="border rounded-lg p-6 text-left">
          <h2 className="text-xl font-semibold mb-4">Provide Liquidity</h2>
          <p className="text-muted-foreground mb-4">
            Create Raydium liquidity pools for your token to enable trading.
            Earn fees when others trade your token.
          </p>
          <Link href="/liquidity" className="text-primary hover:underline">
            Add liquidity →
          </Link>
        </div>
        
        <div className="border rounded-lg p-6 text-left">
          <h2 className="text-xl font-semibold mb-4">Swap & Trade</h2>
          <p className="text-muted-foreground mb-4">
            Swap between your tokens and SOL using Raydium's AMM protocol.
            Get the best prices with minimal slippage.
          </p>
          <Link href="/swap" className="text-primary hover:underline">
            Start swapping →
          </Link>
        </div>
      </div>
      
      <div className="text-center mt-12 border-t pt-8">
        <p className="text-sm text-muted-foreground">
          Powered by Solana, Next.js, and Raydium AMM protocol.
        </p>
      </div>
    </div>
  );
}