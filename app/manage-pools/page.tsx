'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getUserLiquidityPools, addLiquidity, removeLiquidity, LiquidityPool } from '@/lib/raydium';
import Link from 'next/link';
import { fetchTokenInfo } from '@/lib/token-utils';

export default function ManagePoolsPage() {
  const { publicKey } = useWallet();
  const wallet = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();
  
  const [userPools, setUserPools] = useState<LiquidityPool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPool, setSelectedPool] = useState<LiquidityPool | null>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  
  // Form states
  const [addTokenAmount, setAddTokenAmount] = useState('');
  const [addSolAmount, setAddSolAmount] = useState('');
  const [removePercentage, setRemovePercentage] = useState('');
  
  // Action states
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const [isRemovingLiquidity, setIsRemovingLiquidity] = useState(false);
  
  useEffect(() => {
    if (publicKey) {
      fetchUserPools();
    }
  }, [publicKey, connection]);
  
  useEffect(() => {
    if (selectedPool && publicKey) {
      fetchTokenDetails();
    }
  }, [selectedPool, connection, publicKey]);
  
  const fetchUserPools = async () => {
    if (!publicKey) return;
    
    try {
      setIsLoading(true);
      const pools = await getUserLiquidityPools(connection, publicKey);
      setUserPools(pools);
      
      // Auto-select first pool if one exists and none is selected
      if (pools.length > 0 && !selectedPool) {
        setSelectedPool(pools[0]);
      }
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
  
  const fetchTokenDetails = async () => {
    if (!selectedPool || !publicKey) return;
    
    try {
      const info = await fetchTokenInfo(
        connection, 
        new PublicKey(selectedPool.tokenMint),
        publicKey
      );
      setTokenInfo(info);
    } catch (error) {
      console.error('Error fetching token details:', error);
      setTokenInfo(null);
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
        selectedPool.id,
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
      
      const percentage = parseFloat(removePercentage);
      
      if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
        throw new Error('Invalid percentage value (must be between 1-100)');
      }
      
      const txid = await removeLiquidity(
        connection,
        wallet,
        selectedPool.id,
        percentage
      );
      
      toast({
        title: 'Success',
        description: `${percentage}% liquidity removed successfully! Transaction: ${txid.slice(0, 8)}...`,
      });
      
      // Reset form
      setRemovePercentage('');
      
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
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          Connect your wallet to manage your liquidity pools
        </p>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Liquidity Pools</h1>
        <Link href="/liquidity">
          <Button variant="outline">
            Create New Pool
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Pools List Sidebar */}
        <div className="md:col-span-1 border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Your Pools</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchUserPools}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : '↻'}
            </Button>
          </div>
          
          {userPools.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No pools found
            </div>
          ) : (
            <div className="space-y-2">
              {userPools.map((pool) => (
                <div 
                  key={pool.id}
                  onClick={() => setSelectedPool(pool)}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    selectedPool?.id === pool.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-secondary'
                  }`}
                >
                  <div className="font-medium">{pool.tokenSymbol}</div>
                  <div className="text-sm truncate">
                    {pool.id.substring(0, 12)}...
                  </div>
                  <div className="text-sm mt-1">
                    Liquidity: {pool.liquidity} SOL
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {userPools.length === 0 && (
            <div className="mt-4">
              <Link href="/liquidity">
                <Button className="w-full">
                  Create Your First Pool
                </Button>
              </Link>
            </div>
          )}
        </div>
        
        {/* Pool Details & Management */}
        <div className="md:col-span-3">
          {!selectedPool ? (
            <div className="text-center border rounded-lg p-12">
              <h3 className="text-lg font-medium mb-2">No Pool Selected</h3>
              <p className="text-muted-foreground mb-6">
                Select a pool from the sidebar or create a new one
              </p>
              <Link href="/liquidity">
                <Button>Create New Pool</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pool Overview */}
              <div className="border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Pool Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Token</h3>
                    <p className="font-medium">{tokenInfo?.name || selectedPool.tokenName} ({tokenInfo?.symbol || selectedPool.tokenSymbol})</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Total Liquidity</h3>
                    <p className="font-medium">{selectedPool.liquidity} SOL</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Pool ID</h3>
                    <p className="font-mono text-sm break-all">{selectedPool.id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                    <p>{new Date(selectedPool.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              {/* Management Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Add Liquidity */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Add Liquidity</h3>
                  <form onSubmit={handleAddLiquidity} className="space-y-4">
                    <div>
                      <label htmlFor="addTokenAmount" className="block text-sm font-medium mb-2">
                        {tokenInfo?.symbol || selectedPool.tokenSymbol} Amount
                      </label>
                      <Input
                        id="addTokenAmount"
                        type="number"
                        value={addTokenAmount}
                        onChange={(e) => setAddTokenAmount(e.target.value)}
                        placeholder={`Amount of ${tokenInfo?.symbol || selectedPool.tokenSymbol}`}
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
                        placeholder="Amount of SOL"
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
                
                {/* Remove Liquidity */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Remove Liquidity</h3>
                  <form onSubmit={handleRemoveLiquidity} className="space-y-4">
                    <div>
                      <label htmlFor="removePercentage" className="block text-sm font-medium mb-2">
                        Percentage to Remove
                      </label>
                      <div className="flex items-center">
                        <Input
                          id="removePercentage"
                          type="number"
                          value={removePercentage}
                          onChange={(e) => setRemovePercentage(e.target.value)}
                          placeholder="Enter percentage (1-100)"
                          min="1"
                          max="100"
                          required
                          className="flex-1"
                        />
                        <span className="ml-2">%</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 my-4">
                      {[25, 50, 75, 100].map((percent) => (
                        <Button
                          key={percent}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setRemovePercentage(percent.toString())}
                        >
                          {percent}%
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={isRemovingLiquidity}
                      className="w-full"
                      variant="destructive"
                    >
                      {isRemovingLiquidity ? 'Removing Liquidity...' : 'Remove Liquidity'}
                    </Button>
                  </form>
                </div>
              </div>
              
              {/* Advanced Pool Info */}
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Technical Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Token Mint:</span>
                      <div className="font-mono break-all">{selectedPool.tokenMint}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">LP Mint:</span>
                      <div className="font-mono break-all">{selectedPool.lpMint}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Base Vault:</span>
                      <div className="font-mono break-all">{selectedPool.baseVault}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quote Vault:</span>
                      <div className="font-mono break-all">{selectedPool.quoteVault}</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pool Type:</span>
                    <div>Raydium AMM Pool (SOL/{tokenInfo?.symbol || selectedPool.tokenSymbol})</div>
                  </div>
                </div>
              </div>
              
              {/* Pool Stats */}
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Pool Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border rounded-md p-3">
                    <h4 className="text-sm text-muted-foreground">24h Volume</h4>
                    <p className="text-lg font-medium">0.00 SOL</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h4 className="text-sm text-muted-foreground">24h Fees</h4>
                    <p className="text-lg font-medium">0.00 SOL</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h4 className="text-sm text-muted-foreground">APR</h4>
                    <p className="text-lg font-medium">0.00%</p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h4 className="text-sm text-muted-foreground">Your Share</h4>
                    <p className="text-lg font-medium">100%</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Note: This is a simulated pool for demonstration purposes. In a production environment, these statistics would reflect real on-chain data.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}