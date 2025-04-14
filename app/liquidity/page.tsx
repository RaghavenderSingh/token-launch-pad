'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createLiquidityPool } from '@/lib/raydium';

export default function LiquidityPoolPage() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();
  
  const [tokenMint, setTokenMint] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [solAmount, setSolAmount] = useState('');
  const [initialPrice, setInitialPrice] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdPoolId, setCreatedPoolId] = useState('');
  const [userPools, setUserPools] = useState<any[]>([]);

  useEffect(() => {
    if (publicKey) {
      fetchUserPools();
    }
  }, [publicKey, connection]);

  const fetchUserPools = async () => {
    // We'll implement this function to fetch user's liquidity pools
    // using the Raydium SDK
    if (!publicKey) return;
    
    try {
      // This is a placeholder - actual implementation will use Raydium SDK
      setUserPools([]);
    } catch (error) {
      console.error('Error fetching user pools:', error);
    }
  };

  const wallet = useWallet();

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey || !connection) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);
      
      const mintAddress = new PublicKey(tokenMint);
      const parsedTokenAmount = parseFloat(tokenAmount);
      const parsedSolAmount = parseFloat(solAmount);
      
      if (isNaN(parsedTokenAmount) || isNaN(parsedSolAmount)) {
        throw new Error('Invalid amount values');
      }
      
      // Call our Raydium integration function
      const poolId = await createLiquidityPool(
        connection,
        {
          wallet: wallet,
          tokenMint: mintAddress,
          tokenAmount: parsedTokenAmount,
          solAmount: parsedSolAmount,
          initialPrice: parseFloat(initialPrice)
        }
      );
      
      setCreatedPoolId(poolId);
      
      toast({
        title: 'Success',
        description: `Liquidity pool created successfully! Pool ID: ${poolId}`,
      });
      
      // Reset form
      setTokenMint('');
      setTokenAmount('');
      setSolAmount('');
      setInitialPrice('');
      
      // Refresh user pools
      fetchUserPools();
    } catch (error) {
      console.error('Error creating liquidity pool:', error);
      
      // Check for the specific mainnet-only error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to create liquidity pool';
      const isMainnetOnlyError = errorMessage.includes('only supported on mainnet');
      
      toast({
        title: isMainnetOnlyError ? 'Mainnet Only Feature' : 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          Connect your wallet to create a liquidity pool
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create Liquidity Pool</h1>
      
      <form onSubmit={handleCreatePool} className="space-y-6">
        <div>
          <label htmlFor="tokenMint" className="block text-sm font-medium mb-2">
            Token Mint Address
          </label>
          <Input
            id="tokenMint"
            value={tokenMint}
            onChange={(e) => setTokenMint(e.target.value)}
            placeholder="Enter your token's mint address"
            required
          />
        </div>

        <div>
          <label htmlFor="tokenAmount" className="block text-sm font-medium mb-2">
            Token Amount
          </label>
          <Input
            id="tokenAmount"
            type="number"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            placeholder="Amount of tokens to add to pool"
            step="0.000000001"
            min="0"
            required
          />
        </div>

        <div>
          <label htmlFor="solAmount" className="block text-sm font-medium mb-2">
            SOL Amount
          </label>
          <Input
            id="solAmount"
            type="number"
            value={solAmount}
            onChange={(e) => setSolAmount(e.target.value)}
            placeholder="Amount of SOL to add to pool"
            step="0.000000001"
            min="0"
            required
          />
        </div>

        <div>
          <label htmlFor="initialPrice" className="block text-sm font-medium mb-2">
            Initial Price (SOL per token)
          </label>
          <Input
            id="initialPrice"
            type="number"
            value={initialPrice}
            onChange={(e) => setInitialPrice(e.target.value)}
            placeholder="Set initial token price in SOL"
            step="0.000000001"
            min="0"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={!publicKey || isCreating}
          className="w-full"
        >
          {isCreating ? 'Creating Pool...' : 'Create Liquidity Pool'}
        </Button>
      </form>
      
      {createdPoolId && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-medium text-green-800">Liquidity Pool Created!</h3>
          <p className="mt-2 text-sm text-green-600">
            Your liquidity pool has been created with the following ID:
          </p>
          <div className="mt-2 p-2 bg-white border border-gray-200 rounded font-mono text-sm break-all">
            {createdPoolId}
          </div>
        </div>
      )}
      
      {userPools.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Your Liquidity Pools</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Pool ID</th>
                  <th className="text-left py-3 px-4">Token</th>
                  <th className="text-left py-3 px-4">Liquidity</th>
                  <th className="text-left py-3 px-4">Created At</th>
                </tr>
              </thead>
              <tbody>
                {userPools.map((pool) => (
                  <tr key={pool.id} className="border-b">
                    <td className="py-3 px-4 font-mono text-sm">{pool.id}</td>
                    <td className="py-3 px-4">{pool.tokenSymbol}</td>
                    <td className="py-3 px-4">{pool.liquidity} SOL</td>
                    <td className="py-3 px-4">{new Date(pool.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}