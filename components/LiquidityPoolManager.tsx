'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getUserLiquidityPools, addLiquidity, removeLiquidity, LiquidityPool } from '@/lib/raydium';

export default function LiquidityPoolManager() {
  const { publicKey } = useWallet();
  const wallet = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();
  
  const [userPools, setUserPools] = useState<LiquidityPool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [addTokenAmount, setAddTokenAmount] = useState('');
  const [addSolAmount, setAddSolAmount] = useState('');
  const [removeAmount, setRemoveAmount] = useState('');
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const [isRemovingLiquidity, setIsRemovingLiquidity] = useState(false);
  
  useEffect(() => {
    if (publicKey) {
      fetchUserPools();
    }
  }, [publicKey, connection]);
  
  const fetchUserPools = async () => {
    if (!publicKey) return;
    
    try {
      setIsLoading(true);
      const pools = await getUserLiquidityPools(connection, publicKey);
      setUserPools(pools);
    } catch (error) {
      console.error('Error fetching user pools:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your liquidity pools',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddLiquidity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey || !selectedPool) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet and select a pool',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsAddingLiquidity(true);
      
      const tokenAmount = parseFloat(addTokenAmount);
      const solAmount = parseFloat(addSolAmount);
      
      if (isNaN(tokenAmount) || isNaN(solAmount)) {
        throw new Error('Invalid amount values');
      }
      
      const txid = await addLiquidity(
        connection,
        wallet,
        selectedPool,
        tokenAmount,
        solAmount
      );
      
      toast({
        title: 'Success',
        description: `Liquidity added successfully! Transaction: ${txid.slice(0, 8)}...`,
      });
      
      // Reset form
      setAddTokenAmount('');
      setAddSolAmount('');
      
      // Refresh user pools
      fetchUserPools();
    } catch (error) {
      console.error('Error adding liquidity:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add liquidity',
        variant: 'destructive',
      });
    } finally {
      setIsAddingLiquidity(false);
    }
  };
  
  const handleRemoveLiquidity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey || !selectedPool) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet and select a pool',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsRemovingLiquidity(true);
      
      const lpAmount = parseFloat(removeAmount);
      
      if (isNaN(lpAmount)) {
        throw new Error('Invalid amount value');
      }
      
      const txid = await removeLiquidity(
        connection,
        wallet,
        selectedPool,
        lpAmount
      );
      
      toast({
        title: 'Success',
        description: `Liquidity removed successfully! Transaction: ${txid.slice(0, 8)}...`,
      });
      
      // Reset form
      setRemoveAmount('');
      
      // Refresh user pools
      fetchUserPools();
    } catch (error) {
      console.error('Error removing liquidity:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove liquidity',
        variant: 'destructive',
      });
    } finally {
      setIsRemovingLiquidity(false);
    }
  };
  
  if (!publicKey) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-muted-foreground">
          Connect your wallet to manage your liquidity pools
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Liquidity Pools</h2>
        <Button
          onClick={fetchUserPools}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>
      
      {userPools.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Token</th>
                  <th className="text-left py-3 px-4">Pool ID</th>
                  <th className="text-left py-3 px-4">Liquidity</th>
                  <th className="text-left py-3 px-4">Created At</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userPools.map((pool) => (
                  <tr 
                    key={pool.id} 
                    className={`border-b ${selectedPool === pool.id ? 'bg-secondary/20' : ''}`}
                    onClick={() => setSelectedPool(pool.id)}
                  >
                    <td className="py-3 px-4">{pool.tokenSymbol}</td>
                    <td className="py-3 px-4 font-mono text-sm">{pool.id.substring(0, 12)}...</td>
                    <td className="py-3 px-4">{pool.liquidity} SOL</td>
                    <td className="py-3 px-4">{new Date(pool.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Button
                        onClick={() => setSelectedPool(pool.id)}
                        variant="outline"
                        size="sm"
                      >
                        Select
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {selectedPool && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 border rounded-lg">
                <h3 className="text-lg font-medium mb-4">Add Liquidity</h3>
                <form onSubmit={handleAddLiquidity} className="space-y-4">
                  <div>
                    <label htmlFor="addTokenAmount" className="block text-sm font-medium mb-2">
                      Token Amount
                    </label>
                    <Input
                      id="addTokenAmount"
                      type="number"
                      value={addTokenAmount}
                      onChange={(e) => setAddTokenAmount(e.target.value)}
                      placeholder="Amount of tokens to add"
                      step="0.000000001"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="addSolAmount" className="block text-sm font-medium mb-2">
                      SOL Amount
                    </label>
                    <Input
                      id="addSolAmount"
                      type="number"
                      value={addSolAmount}
                      onChange={(e) => setAddSolAmount(e.target.value)}
                      placeholder="Amount of SOL to add"
                      step="0.000000001"
                      min="0"
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isAddingLiquidity}
                    className="w-full"
                  >
                    {isAddingLiquidity ? 'Adding Liquidity...' : 'Add Liquidity'}
                  </Button>
                </form>
              </div>
              
              <div className="p-6 border rounded-lg">
                <h3 className="text-lg font-medium mb-4">Remove Liquidity</h3>
                <form onSubmit={handleRemoveLiquidity} className="space-y-4">
                  <div>
                    <label htmlFor="removeAmount" className="block text-sm font-medium mb-2">
                      LP Token Amount (%)
                    </label>
                    <Input
                      id="removeAmount"
                      type="number"
                      value={removeAmount}
                      onChange={(e) => setRemoveAmount(e.target.value)}
                      placeholder="Percentage to remove (0-100)"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isRemovingLiquidity}
                    className="w-full"
                  >
                    {isRemovingLiquidity ? 'Removing Liquidity...' : 'Remove Liquidity'}
                  </Button>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-muted-foreground">
            You don't have any liquidity pools yet.
          </p>
          <Button
            className="mt-4"
            onClick={() => window.location.href = '/liquidity'}
          >
            Create a Liquidity Pool
          </Button>
        </div>
      )}
    </div>
  );
}