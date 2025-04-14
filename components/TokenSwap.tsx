'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, ComputeBudgetProgram } from '@solana/web3.js';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDown, RefreshCw } from 'lucide-react';
import { fetchTokenInfo, TokenInfo } from '@/lib/token-utils';
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction, 
  createTransferInstruction,
  NATIVE_MINT,
  createSyncNativeInstruction,
  getMint 
} from '@solana/spl-token';

interface TokenSwapProps {
  defaultTokenAddress?: string;
}

export default function TokenSwap({ defaultTokenAddress }: TokenSwapProps) {
  const { publicKey } = useWallet();
  const wallet = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();
  
  // Token states
  const [tokenAddress, setTokenAddress] = useState(defaultTokenAddress || '');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  
  // Swap states
  const [swapDirection, setSwapDirection] = useState<'tokenToSol' | 'solToToken'>('tokenToSol');
  const [tokenAmount, setTokenAmount] = useState('');
  const [solAmount, setSolAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  
  // Price states
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [slippage, setSlippage] = useState('1.0');
  
  useEffect(() => {
    if (tokenAddress && publicKey) {
      validateToken();
    }
  }, [tokenAddress, publicKey, connection]);
  
  useEffect(() => {
    if (swapDirection === 'tokenToSol' && tokenAmount && estimatedPrice) {
      // Calculate SOL amount based on token amount and price
      const calculatedSolAmount = parseFloat(tokenAmount) * estimatedPrice;
      setSolAmount(calculatedSolAmount.toFixed(6));
    } else if (swapDirection === 'solToToken' && solAmount && estimatedPrice) {
      // Calculate token amount based on SOL amount and price
      const calculatedTokenAmount = parseFloat(solAmount) / estimatedPrice;
      setTokenAmount(calculatedTokenAmount.toFixed(6));
    }
  }, [swapDirection, tokenAmount, solAmount, estimatedPrice]);
  
  const validateToken = async () => {
    if (!tokenAddress || !publicKey) return;
    
    try {
      setIsValidatingToken(true);
      
      // Check if the address is a valid public key
      let mintAddress: PublicKey;
      try {
        mintAddress = new PublicKey(tokenAddress);
      } catch (error) {
        toast({
          title: 'Invalid token address',
          description: 'Please provide a valid Solana token address',
          variant: 'destructive',
        });
        setTokenInfo(null);
        return;
      }
      
      // Fetch token information
      const info = await fetchTokenInfo(connection, mintAddress, publicKey);
      setTokenInfo(info);
      
      // Set a simulated price for demonstration
      setEstimatedPrice(Math.random() * 0.5 + 0.1); // Between 0.1 and 0.6 SOL per token
    } catch (error) {
      console.error('Error validating token:', error);
      toast({
        title: 'Error',
        description: 'Failed to validate token. Please check the address and try again.',
        variant: 'destructive',
      });
      setTokenInfo(null);
    } finally {
      setIsValidatingToken(false);
    }
  };
  
  const handleSwapDirection = () => {
    setSwapDirection(prev => prev === 'tokenToSol' ? 'solToToken' : 'tokenToSol');
    
    // Clear input values to avoid confusion
    setTokenAmount('');
    setSolAmount('');
  };
  
  const handleTokenAmountChange = (value: string) => {
    setTokenAmount(value);
    if (estimatedPrice && value) {
      const calculatedSol = parseFloat(value) * estimatedPrice;
      setSolAmount(calculatedSol.toFixed(6));
    } else {
      setSolAmount('');
    }
  };
  
  const handleSolAmountChange = (value: string) => {
    setSolAmount(value);
    if (estimatedPrice && value) {
      const calculatedToken = parseFloat(value) / estimatedPrice;
      setTokenAmount(calculatedToken.toFixed(6));
    } else {
      setTokenAmount('');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey || !wallet.signTransaction || !tokenInfo) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet and select a valid token',
        variant: 'destructive',
      });
      return;
    }
    
    if (!tokenAmount || !solAmount) {
      toast({
        title: 'Error',
        description: 'Please enter valid swap amounts',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSwapping(true);
      
      // Parse amounts
      const parsedTokenAmount = parseFloat(tokenAmount);
      const parsedSolAmount = parseFloat(solAmount);
      
      if (isNaN(parsedTokenAmount) || isNaN(parsedSolAmount)) {
        throw new Error('Invalid amount values');
      }
      
      // Get token decimals
      const mintInfo = await getMint(connection, new PublicKey(tokenInfo.mint));
      const decimals = mintInfo.decimals;
      
      // Calculate token amount with decimals
      const tokenAmountWithDecimals = Math.floor(parsedTokenAmount * Math.pow(10, decimals));
      
      // Calculate SOL amount in lamports
      const solAmountInLamports = Math.floor(parsedSolAmount * LAMPORTS_PER_SOL);
      
      // Create transaction
      const transaction = new Transaction();
      
      // Add compute budget instruction to ensure enough compute units
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 300000,
        })
      );
      
      if (swapDirection === 'tokenToSol') {
        // Simulate a token to SOL swap (in a real implementation, this would use Raydium's swap function)
        // For demonstration, we'll just do a token transfer
        const sourceTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(tokenInfo.mint),
          publicKey
        );
        
        // For demo purposes, we'll transfer the tokens back to the user's own wallet
        // In a real swap, this would go to the pool/AMM address
        transaction.add(
          createTransferInstruction(
            sourceTokenAccount,
            sourceTokenAccount,
            publicKey,
            tokenAmountWithDecimals
          )
        );
        
        // Also add a small SOL transfer to simulate receiving SOL
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: publicKey,
            lamports: 100000, // Small amount for demo
          })
        );
      } else {
        // SOL to token swap
        // In a real implementation, this would use Raydium's swap function
        // For demonstration, we'll just do a SOL transfer
        
        // For demo purposes, we'll transfer a small amount of SOL to simulate the swap
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: publicKey,
            lamports: 100000, // Small amount for demo
          })
        );
      }
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      // Sign and send transaction
      const signedTx = await wallet.signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signedTx.serialize());
      
      // Wait for confirmation
      await connection.confirmTransaction(txid);
      
      toast({
        title: 'Swap Successful',
        description: `Transaction confirmed with ID: ${txid.slice(0, 8)}...`,
      });
      
      // Reset form
      setTokenAmount('');
      setSolAmount('');
    } catch (error) {
      console.error('Error during swap:', error);
      toast({
        title: 'Swap Failed',
        description: error instanceof Error ? error.message : 'An error occurred during the swap',
        variant: 'destructive',
      });
    } finally {
      setIsSwapping(false);
    }
  };
  
  const getMaxAmount = async () => {
    if (!publicKey || !tokenInfo) return;
    
    if (swapDirection === 'tokenToSol') {
      // Get max token amount
      if (tokenInfo.balance) {
        const maxAmount = parseFloat(tokenInfo.balance) / Math.pow(10, tokenInfo.decimals);
        handleTokenAmountChange(maxAmount.toString());
      }
    } else {
      // Get max SOL amount
      try {
        const solBalance = await connection.getBalance(publicKey);
        // Leave some SOL for transaction fees (0.01 SOL)
        const maxAmount = Math.max(0, (solBalance - 0.01 * LAMPORTS_PER_SOL) / LAMPORTS_PER_SOL);
        handleSolAmountChange(maxAmount.toString());
      } catch (error) {
        console.error('Error getting SOL balance:', error);
      }
    }
  };
  
  if (!publicKey) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">
          Connect your wallet to use the swap feature
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-6 border rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Swap</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Slippage:</span>
          <select
            value={slippage}
            onChange={(e) => setSlippage(e.target.value)}
            className="py-1 px-2 rounded-md text-sm bg-secondary"
          >
            <option value="0.5">0.5%</option>
            <option value="1.0">1.0%</option>
            <option value="2.0">2.0%</option>
          </select>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Token Input Section */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">
              {swapDirection === 'tokenToSol' ? 'You Pay' : 'You Receive'}
            </label>
            {swapDirection === 'tokenToSol' && (
              <button
                type="button"
                onClick={getMaxAmount}
                className="text-xs text-primary"
              >
                MAX
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="number"
                value={tokenAmount}
                onChange={(e) => handleTokenAmountChange(e.target.value)}
                placeholder="0.00"
                step="0.000001"
                min="0"
              />
            </div>
            <div className="flex items-center gap-1 min-w-32 p-2 border rounded-md bg-secondary">
              {tokenInfo ? (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs">{tokenInfo.symbol.charAt(0)}</span>
                  </div>
                  <span className="font-medium">{tokenInfo.symbol}</span>
                </div>
              ) : (
                <div className="flex-1">
                  <Input
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    placeholder="Token address"
                    className="border-0 bg-transparent p-0"
                  />
                </div>
              )}
            </div>
          </div>
          
          {tokenInfo && (
            <div className="text-xs text-muted-foreground">
              Balance: {tokenInfo.balance ? (parseFloat(tokenInfo.balance) / Math.pow(10, tokenInfo.decimals)).toFixed(6) : '0'} {tokenInfo.symbol}
            </div>
          )}
        </div>
        
        {/* Swap Direction Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSwapDirection}
            className="p-2 rounded-full bg-secondary hover:bg-secondary/80"
          >
            <ArrowDown size={16} />
          </button>
        </div>
        
        {/* SOL Input Section */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">
              {swapDirection === 'tokenToSol' ? 'You Receive' : 'You Pay'}
            </label>
            {swapDirection === 'solToToken' && (
              <button
                type="button"
                onClick={getMaxAmount}
                className="text-xs text-primary"
              >
                MAX
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="number"
                value={solAmount}
                onChange={(e) => handleSolAmountChange(e.target.value)}
                placeholder="0.00"
                step="0.000001"
                min="0"
              />
            </div>
            <div className="flex items-center gap-1 min-w-32 p-2 border rounded-md bg-secondary">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs">S</span>
                </div>
                <span className="font-medium">SOL</span>
              </div>
            </div>
          </div>
        </div>
        
        {estimatedPrice && (
          <div className="py-2 px-3 bg-secondary/50 rounded-md text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span>{estimatedPrice.toFixed(6)} SOL per {tokenInfo?.symbol || 'token'}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Fee</span>
              <span>0.3%</span>
            </div>
          </div>
        )}
        
        <Button
          type="submit"
          disabled={!tokenInfo || isSwapping || !tokenAmount || !solAmount}
          className="w-full"
        >
          {isSwapping ? 'Swapping...' : 'Swap'}
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          Note: This is a simulated swap for demonstration purposes.
          In a production environment, this would connect to Raydium's swap protocol.
        </p>
      </form>
    </div>
  );
}