import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';

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