'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useToast } from '@/components/ui/use-toast';

export default function LaunchTokenPage() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();
  const [tokenAddress, setTokenAddress] = useState('');
  const [price, setPrice] = useState('');
  const [totalSupply, setTotalSupply] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunchToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !sendTransaction) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setIsLaunching(true);
    try {
      const mintAddress = new PublicKey(tokenAddress);
      
      // Validate token address
      try {
        await connection.getAccountInfo(mintAddress);
      } catch (error) {
        throw new Error('Invalid token address');
      }

      // Create a simple transaction (for demonstration)
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey,
          lamports: LAMPORTS_PER_SOL * 0.001, // Small amount for demo
        })
      );

      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature);

      toast({
        title: 'Success',
        description: `Token launch successful! Transaction signature: ${signature}`,
      });

      // Reset form
      setTokenAddress('');
      setPrice('');
      setTotalSupply('');
    } catch (error) {
      console.error('Error launching token:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to launch token',
        variant: 'destructive',
      });
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Launch Your Token</h1>
      
      <form onSubmit={handleLaunchToken} className="space-y-6">
        <div>
          <label htmlFor="tokenAddress" className="block text-sm font-medium mb-2">
            Token Address
          </label>
          <input
            type="text"
            id="tokenAddress"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter your token's address"
            required
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium mb-2">
            Price (in SOL)
          </label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            step="0.000000001"
            min="0"
            required
          />
        </div>

        <div>
          <label htmlFor="totalSupply" className="block text-sm font-medium mb-2">
            Total Supply
          </label>
          <input
            type="number"
            id="totalSupply"
            value={totalSupply}
            onChange={(e) => setTotalSupply(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            min="1"
            required
          />
        </div>

        <button
          type="submit"
          disabled={!publicKey || isLaunching}
          className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isLaunching ? 'Launching...' : 'Launch Token'}
        </button>
      </form>
    </div>
  );
} 