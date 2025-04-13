'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useToast } from '@/components/ui/use-toast';
import { getMint, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, getAccount } from '@solana/spl-token';
import { mintTokens, transferTokens, getTokenAccounts } from '@/lib/solana';

// Import Metaplex for proper metadata handling
import { Metaplex } from '@metaplex-foundation/js';
import TokenMetadataUpload from "@/components/TokenMetadataUpload";

interface TokenInfo {
  mintAddress: string;
  supply: string;
  decimals: number;
  name: string;
  symbol: string;
  uri: string;
  createdAt: string;
  balance: string; // Added balance field
}

export default function DashboardPage() {
  const wallet = useWallet();
  const { publicKey } = wallet;
  const { connection } = useConnection();
  const { toast } = useToast();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [mintAmount, setMintAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [customMintAddress, setCustomMintAddress] = useState('');
console.log(tokens)

  const fetchTokens = async () => {
    if (!publicKey) {
      console.log('No public key available');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Starting token fetch for wallet:', publicKey.toBase58());
      console.log('Connection endpoint:', connection.rpcEndpoint);
      
      // Create Metaplex instance for fetching token metadata
      const metaplex = new Metaplex(connection);
      
      // Get all token accounts owned by the wallet for both standard and Token-2022
      console.log('Fetching standard tokens...');
      const standardTokens = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );
      
      console.log('Fetching Token-2022 tokens...');
      const token2022Tokens = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_2022_PROGRAM_ID }
      );

      // Combine both token lists
      const allTokenAccounts = [...standardTokens.value, ...token2022Tokens.value];
      console.log('Total token accounts found:', allTokenAccounts.length);
      
      // Since getProgramAccounts is not supported by this RPC endpoint,
      // we need an alternative approach to find created tokens
      
      // Get recent transactions to identify potential token creations
      console.log('Fetching recent transactions to identify created tokens...');
      const signatures = await connection.getSignaturesForAddress(
        publicKey,
        { limit: 50 } // Fetch last 50 transactions
      );
      
      const ownedMints: { pubkey: PublicKey, account: any }[] = [];
      
      // Process transactions to find token creation transactions
      if (signatures.length > 0) {
        console.log(`Found ${signatures.length} recent transactions, checking for token creations...`);
        
        // Get transaction details for all signatures (in batches to prevent rate limiting)
        const txBatches = [];
        for (let i = 0; i < signatures.length; i += 10) {
          const batch = signatures.slice(i, i + 10);
          txBatches.push(batch);
        }
        
        for (const batch of txBatches) {
          const txPromises = batch.map(sig => 
            connection.getParsedTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
              commitment: 'confirmed'
            })
          );
          
          const txDetails = await Promise.all(txPromises);
          
          // Look for create token transactions
          for (const tx of txDetails) {
            if (!tx || !tx.meta || !tx.transaction) continue;
            
            // Look for created token accounts in postTokenBalances
            if (tx.meta.postTokenBalances && tx.meta.postTokenBalances.length > 0) {
              for (const tokenBalance of tx.meta.postTokenBalances) {
                // Store mint addresses for further processing
                if (tokenBalance.mint) {
                  try {
                    const mintAddress = new PublicKey(tokenBalance.mint);
                    const mintInfo = await getMint(connection, mintAddress);
                    
                    // Check if this wallet is the mint authority
                    if (mintInfo.mintAuthority && 
                        mintInfo.mintAuthority.equals(publicKey)) {
                      ownedMints.push({
                        pubkey: mintAddress,
                        account: { owner: TOKEN_PROGRAM_ID }
                      });
                    }
                  } catch (err) {
                    console.log('Error checking mint:', err);
                  }
                }
              }
            }
          }
        }
      }

      // Create a Set of mint addresses we've already processed
      const processedMints = new Set();
      
      // Process token accounts
      const tokenInfoPromises = allTokenAccounts.map(async (account) => {
        try {
          const parsedAccountInfo = account.account.data.parsed.info;
          const mintAddress = parsedAccountInfo.mint;
          const balance = parsedAccountInfo.tokenAmount.uiAmount;
          const programId = account.account.owner;
          
          // Skip if already processed
          if (processedMints.has(mintAddress)) return null;
          processedMints.add(mintAddress);
          
          console.log('Processing token:', mintAddress);
          
          // Get mint info
          const mintInfo = await getMint(
            connection,
            new PublicKey(mintAddress),
            undefined,
            programId
          );

          // Get metadata using Metaplex
          let name = 'Unknown';
          let symbol = 'UNK';
          let uri = '';
          
          try {
            const nft = await metaplex.nfts().findByMint({ mintAddress: new PublicKey(mintAddress) });
            name = nft.name || 'Unknown';
            symbol = nft.symbol || 'UNK';
            uri = nft.uri || '';
          } catch (metaplexError) {
            console.warn('No metadata found for token:', mintAddress);
          }

          return {
            mintAddress,
            supply: mintInfo.supply.toString(),
            decimals: mintInfo.decimals,
            name,
            symbol,
            uri,
            balance: balance.toString(),
            createdAt: new Date().toISOString()
          };
        } catch (error) {
          console.error('Error processing token account:', error);
          return null;
        }
      });

      // Process owned mints that might not have token accounts yet
      const ownedMintInfoPromises = ownedMints.map(async (mintAccount) => {
        try {
          const mintAddress = mintAccount.pubkey.toBase58();
          
          // Skip if already processed
          if (processedMints.has(mintAddress)) return null;
          processedMints.add(mintAddress);
          
          console.log('Processing owned mint:', mintAddress);
          
          // Get mint info
          const mintInfo = await getMint(
            connection,
            mintAccount.pubkey,
            undefined,
            mintAccount.account.owner
          );

          // Get metadata using Metaplex
          let name = 'Unknown';
          let symbol = 'UNK';
          let uri = '';
          
          try {
            const nft = await metaplex.nfts().findByMint({ mintAddress: mintAccount.pubkey });
            name = nft.name || 'Unknown';
            symbol = nft.symbol || 'UNK';
            uri = nft.uri || '';
          } catch (metaplexError) {
            console.warn('No metadata found for owned mint:', mintAddress);
          }

          return {
            mintAddress,
            supply: mintInfo.supply.toString(),
            decimals: mintInfo.decimals,
            name,
            symbol,
            uri,
            balance: '0', // Default to 0 as we don't have a token account
            createdAt: new Date().toISOString()
          };
        } catch (error) {
          console.error('Error processing owned mint:', error);
          return null;
        }
      });

      // Combine and process all token infos
      const allTokenInfos = await Promise.all([...tokenInfoPromises, ...ownedMintInfoPromises]);
      
      // Filter out any null values from failed fetches
      const validTokens = allTokenInfos.filter((token): token is TokenInfo => token !== null);
      console.log('Final valid tokens:', validTokens.length);
      
      setTokens(validTokens);
    } catch (error) {
      console.error('Error in fetchTokens:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tokens from wallet',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a function to directly check a token mint address
  const checkTokenByAddress = async (mintAddressStr: string) => {
    try {
      setIsLoading(true);
      toast({
        title: 'Checking Token',
        description: 'Fetching information for the provided token mint...',
      });
      
      const mintAddress = new PublicKey(mintAddressStr);
      const mintInfo = await getMint(connection, mintAddress);
      
      // Create Metaplex instance for fetching token metadata
      const metaplex = new Metaplex(connection);
      
      // Get metadata using Metaplex
      let name = 'Unknown';
      let symbol = 'UNK';
      let uri = '';
      
      try {
        const nft = await metaplex.nfts().findByMint({ mintAddress });
        name = nft.name || 'Unknown';
        symbol = nft.symbol || 'UNK';
        uri = nft.uri || '';
      } catch (metaplexError) {
        console.warn('No metadata found for token:', mintAddressStr);
      }
      
      // Check if you own any of this token
      let balance = '0';
      try {
        if (!publicKey) throw new Error('No public key available');
        const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, {
          mint: mintAddress
        });
        
        if (tokenAccounts.value.length > 0) {
          const accountInfo = await getAccount(
            connection, 
            tokenAccounts.value[0].pubkey
          );
          balance = accountInfo.amount.toString();
        }
      } catch (error) {
        console.log('No token accounts found for this mint');
      }
      
      // Check if the user is the mint authority
      if (!publicKey) throw new Error('No public key available');
      const isCreator = mintInfo.mintAuthority && mintInfo.mintAuthority.equals(publicKey);
      
      // Add to token list if not already there
      setTokens(prev => {
        const exists = prev.some(t => t.mintAddress === mintAddressStr);
        if (!exists) {
          return [...prev, {
            mintAddress: mintAddressStr,
            supply: mintInfo.supply.toString(),
            decimals: mintInfo.decimals,
            name,
            symbol,
            uri,
            balance,
            createdAt: new Date().toISOString()
          }];
        }
        return prev;
      });
      
      if (isCreator) {
        toast({
          title: 'Token Found',
          description: `"${name}" was created by your wallet.`,
        });
      } else {
        toast({
          title: 'Token Found',
          description: `Found token "${name}" in your wallet.`,
        });
      }
    } catch (error) {
      console.error('Error checking token:', error);
      toast({
        title: 'Error',
        description: 'Could not find or process the specified token mint',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey) {
      console.log('Wallet connected:', publicKey.toBase58());
      console.log('Connection endpoint:', connection.rpcEndpoint);
      fetchTokens();
    } else {
      console.log('No wallet connected');
    }
  }, [publicKey, connection]);

  const handleMintTokens = async () => {
    if (!selectedToken || !mintAmount) return;
    setIsMinting(true);
    try {
      await mintTokens(
        connection,
        wallet,
        new PublicKey(selectedToken),
        Number(mintAmount)
      );
      toast({
        title: 'Success',
        description: `Successfully minted ${mintAmount} tokens`,
      });
      setMintAmount('');
      fetchTokens(); // Refresh token list
    } catch (error) {
      console.error('Error minting tokens:', error);
      toast({
        title: 'Error',
        description: 'Failed to mint tokens',
        variant: 'destructive',
      });
    } finally {
      setIsMinting(false);
    }
  };

  const handleTransferTokens = async () => {
    if (!selectedToken || !transferAmount || !transferAddress) return;
    setIsTransferring(true);
    try {
      await transferTokens(
        connection,
        wallet,
        new PublicKey(selectedToken),
        new PublicKey(transferAddress),
        Number(transferAmount)
      );
      toast({
        title: 'Success',
        description: `Successfully transferred ${transferAmount} tokens`,
      });
      setTransferAmount('');
      setTransferAddress('');
      fetchTokens(); // Refresh token list
    } catch (error) {
      console.error('Error transferring tokens:', error);
      toast({
        title: 'Error',
        description: 'Failed to transfer tokens',
        variant: 'destructive',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          Connect your wallet to view your tokens
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Token Dashboard</h1>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Total Tokens</h3>
            <p className="text-3xl font-bold mt-2">{tokens.length}</p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Connected Wallet</h3>
            <p className="text-sm mt-2 truncate">{publicKey.toBase58()}</p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold">Network</h3>
            <p className="text-3xl font-bold mt-2">Devnet</p>
          </div>
        </div>
        
        {/* Add a manual token lookup section */}
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Look Up Token By Address</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              value={customMintAddress}
              onChange={(e) => setCustomMintAddress(e.target.value)}
              placeholder="Enter token mint address"
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <button
              onClick={() => checkTokenByAddress(customMintAddress)}
              disabled={!customMintAddress || isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Check Token
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            If you created a token but don't see it, paste its mint address here to add it to your dashboard.
          </p>
        </div>

        <div className="rounded-lg border">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Tokens</h2>
            <button 
              onClick={fetchTokens}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 mb-4"
            >
              Refresh Token List
            </button>
            
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : tokens.length > 0 ? (
              <>
                <div className="mb-6 space-y-4">
                  <div className="flex items-center space-x-4">
                    <select
                      value={selectedToken || ''}
                      onChange={(e) => setSelectedToken(e.target.value)}
                      className="px-3 py-2 border rounded-md"
                    >
                      <option value="">Select a token</option>
                      {tokens.map((token) => (
                        <option key={token.mintAddress} value={token.mintAddress}>
                          {token.name} ({token.symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedToken && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">Mint Tokens</h3>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            value={mintAmount}
                            onChange={(e) => setMintAmount(e.target.value)}
                            placeholder="Amount to mint"
                            className="flex-1 px-3 py-2 border rounded-md"
                          />
                          <button
                            onClick={handleMintTokens}
                            disabled={isMinting || !mintAmount}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                          >
                            {isMinting ? 'Minting...' : 'Mint'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium">Transfer Tokens</h3>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={transferAddress}
                            onChange={(e) => setTransferAddress(e.target.value)}
                            placeholder="Recipient address"
                            className="w-full px-3 py-2 border rounded-md"
                          />
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              value={transferAmount}
                              onChange={(e) => setTransferAmount(e.target.value)}
                              placeholder="Amount to transfer"
                              className="flex-1 px-3 py-2 border rounded-md"
                            />
                            <button
                              onClick={handleTransferTokens}
                              disabled={isTransferring || !transferAmount || !transferAddress}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                            >
                              {isTransferring ? 'Transferring...' : 'Transfer'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>)}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Image</th>
                        <th className="text-left py-3 px-4">Name</th>
                        <th className="text-left py-3 px-4">Symbol</th>
                        <th className="text-left py-3 px-4">Mint Address</th>
                        <th className="text-left py-3 px-4">Balance</th>
                        <th className="text-left py-3 px-4">Supply</th>
                        <th className="text-left py-3 px-4">Decimals</th>
                        <th className="text-left py-3 px-4">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokens.map((token) => (
                        <tr key={token.mintAddress} className="border-b">
                          <td className="py-3 px-4">
                            {token.uri ? (
                              <img 
                                src={token.uri} 
                                alt={`${token.name} token`}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'https://via.placeholder.com/40?text=No+Image';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-500">No Image</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">{token.name}</td>
                          <td className="py-3 px-4">{token.symbol}</td>
                          <td className="py-3 px-4 font-mono text-sm">
                            {token.mintAddress}
                          </td>
                          <td className="py-3 px-4">{token.balance}</td>
                          <td className="py-3 px-4">{token.supply}</td>
                          <td className="py-3 px-4">{token.decimals}</td>
                          <td className="py-3 px-4">{new Date(token.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                No tokens found. Create a token to get started.
              </div>
            )}
          </div>
        </div>
      </div>

      <TokenMetadataUpload />
    </div>
  );
}