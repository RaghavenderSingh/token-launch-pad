"use client"
import TokenLaunchPad from "@/components/TokenLaunchPad";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Image from "next/image";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Launch Your Token on Solana
        </h1>
        <p className="text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
          Create, launch, and manage your token with our easy-to-use platform. 
          Everything you need to launch your token on Solana in one place.
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
        </div>
      </div>

      <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">Token Creation</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your token with custom parameters and metadata.
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">Token Launch</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Launch your token with customizable sale parameters.
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">Dashboard</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitor your token's performance and manage distributions.
          </p>
        </div>
      </div>
    </div>
  );
}
