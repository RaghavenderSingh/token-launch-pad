'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { createToken } from '@/lib/solana';
import { useToast } from '@/components/ui/use-toast';

export default function CreateTokenPage() {
  const {connection} = useConnection()
  const wallet = useWallet()
  const { toast } = useToast();
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [decimals, setDecimals] = useState('9');
  const [tokenUri, setTokenUri] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [lastCreatedToken, setLastCreatedToken] = useState('');
  
  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.publicKey || !connection) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const mint = await createToken(connection, wallet, {
        decimals: Number(decimals),
        name: tokenName,
        symbol: tokenSymbol,
        uri: tokenUri
      });
      
      const mintAddress = mint.toBase58();
      setLastCreatedToken(mintAddress);
      
      toast({
        title: 'Success',
        description: `Token created successfully! Mint address: ${mintAddress}`,
      });

      // Reset form
      setTokenName('');
      setTokenSymbol('');
      setDecimals('9');
      setTokenUri('');
    } catch (error) {
      console.error('Error creating token:', error);
      toast({
        title: 'Error',
        description: 'Failed to create token. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create Your Token</h1>
      
      <form onSubmit={handleCreateToken} className="space-y-6">
        <div>
          <label htmlFor="tokenName" className="block text-sm font-medium mb-2">
            Token Name
          </label>
          <input
            type="text"
            id="tokenName"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="tokenSymbol" className="block text-sm font-medium mb-2">
            Token Symbol
          </label>
          <input
            type="text"
            id="tokenSymbol"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="decimals" className="block text-sm font-medium mb-2">
            Decimals
          </label>
          <input
            type="number"
            id="decimals"
            value={decimals}
            onChange={(e) => setDecimals(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            min="0"
            max="9"
            required
          />
        </div>

        <div>
          <label htmlFor="tokenUri" className="block text-sm font-medium mb-2">
            Token URI (Optional)
          </label>
          <input
            type="text"
            id="tokenUri"
            value={tokenUri}
            onChange={(e) => setTokenUri(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="https://your-metadata-url.com"
          />
        </div>

        <button
          type="submit"
          disabled={!wallet.publicKey || isCreating}
          className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create Token'}
        </button>
      </form>
      
      {lastCreatedToken && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-medium text-green-800">Token Created Successfully!</h3>
          <p className="mt-2 text-sm text-green-600">
            Your token has been created with the following mint address:
          </p>
          <div className="mt-2 p-2 bg-white border border-gray-200 rounded font-mono text-sm break-all">
            {lastCreatedToken}
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Copy this address and use it in the dashboard's "Look Up Token By Address" section to add it to your dashboard.
          </p>
        </div>
      )}
    </div>
  );
}