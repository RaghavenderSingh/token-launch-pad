'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TokenSwap from '@/components/TokenSwap';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SwapPage() {
  const searchParams = useSearchParams();
  const tokenAddress = searchParams.get('token') || '';
  
  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Swap Tokens</h1>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <TokenSwap defaultTokenAddress={tokenAddress} />
      
      <div className="mt-8 p-4 border rounded-md">
        <h3 className="text-lg font-semibold mb-2">About Swapping</h3>
        <p className="text-sm text-muted-foreground">
          Swapping allows you to exchange your tokens for SOL and vice versa using Raydium's liquidity pools.
          The price is determined by the pool's reserves and includes a 0.3% fee that goes to liquidity providers.
        </p>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Provider:</span>
            <span className="font-medium">Raydium AMM</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Network:</span>
            <span className="font-medium">Solana Devnet</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Slippage Tolerance:</span>
            <span className="font-medium">1.0%</span>
          </div>
        </div>
      </div>
    </div>
  );
}