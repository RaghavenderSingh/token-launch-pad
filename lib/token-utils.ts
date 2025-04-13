import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, getAccount, getMint } from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { Metaplex } from '@metaplex-foundation/js';

export async function createTokenTransfer(
  connection: Connection,
  wallet: WalletContextState,
  mintAddress: PublicKey,
  amount: number
) {
  if (!wallet.publicKey || !wallet.signTransaction) throw new Error('Wallet not connected');

  const transaction = new Transaction();
  const userTokenAccount = await getAssociatedTokenAddress(
    mintAddress,
    wallet.publicKey
  );
  const transferInstruction = createTransferInstruction(
    userTokenAccount,
    userTokenAccount,
    wallet.publicKey,
    amount * Math.pow(10, 9) 
  );

  transaction.add(transferInstruction);
  return await wallet.signTransaction(transaction);
}

export interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
  balance?: string;
  uri?: string;
}

export async function fetchTokenInfo(
  connection: Connection,
  mintAddress: PublicKey,
  walletAddress?: PublicKey
): Promise<TokenInfo> {
  try {
    // Get mint info
    const mintInfo = await getMint(connection, mintAddress);
    
    // Initialize with basic info
    const tokenInfo: TokenInfo = {
      mint: mintAddress.toBase58(),
      name: 'Unknown',
      symbol: 'UNK',
      decimals: mintInfo.decimals,
      supply: mintInfo.supply.toString(),
    };
    
    // Try to get metadata using Metaplex
    try {
      const metaplex = new Metaplex(connection);
      const nft = await metaplex.nfts().findByMint({ mintAddress });
      
      tokenInfo.name = nft.name || 'Unknown';
      tokenInfo.symbol = nft.symbol || 'UNK';
      tokenInfo.uri = nft.uri || undefined;
    } catch (metaplexError) {
      console.warn('No metadata found for token:', mintAddress.toBase58());
    }
    
    // If wallet address is provided, get the token balance
    if (walletAddress) {
      try {
        const tokenAccount = await getAssociatedTokenAddress(
          mintAddress,
          walletAddress
        );
        
        try {
          const accountInfo = await getAccount(connection, tokenAccount);
          tokenInfo.balance = accountInfo.amount.toString();
        } catch (error) {
          tokenInfo.balance = '0';
        }
      } catch (error) {
        tokenInfo.balance = '0';
      }
    }
    
    return tokenInfo;
  } catch (error) {
    console.error('Error fetching token info:', error);
    throw error;
  }
}