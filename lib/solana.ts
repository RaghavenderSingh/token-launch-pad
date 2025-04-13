import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  TransactionInstruction
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createTransferCheckedInstruction,
  getAccount,
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
  getMint,
  TOKEN_2022_PROGRAM_ID,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  createInitializeMint2Instruction
} from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { 
  mplTokenMetadata,
  createV1,
  TokenStandard,
  findMetadataPda,
} from '@metaplex-foundation/mpl-token-metadata';
import { 
  publicKey,
  signerIdentity,
  percentAmount
} from '@metaplex-foundation/umi';
import { Metaplex } from "@metaplex-foundation/js";
import { walletAdapterIdentity } from "@metaplex-foundation/js";

interface CreateTokenParams {
  decimals: number;
  name: string;
  symbol: string;
  uri?: string;
}

interface RetryOptions {
  maxRetries: number;
  initialBackoff: number;
  onRetry?: (attempt: number) => void;
}

export async function transferTokens(
  connection: Connection,
  wallet: WalletContextState,
  mintAddress: PublicKey,
  destinationWallet: PublicKey,
  amount: number
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  try {
    const mintInfo = await getMint(connection, mintAddress);
    const sourceTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      wallet.publicKey
    );
    const destinationTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      destinationWallet
    );
    let transaction = new Transaction();

    try {
      await getAccount(connection, destinationTokenAccount);
    } catch (error) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          destinationTokenAccount,
          destinationWallet,
          mintAddress
        )
      );
    }

    transaction.add(
      createTransferCheckedInstruction(
        sourceTokenAccount,
        mintAddress,
        destinationTokenAccount,
        wallet.publicKey,
        amount * Math.pow(10, mintInfo.decimals),
        mintInfo.decimals
      )
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    const signedTx = await wallet.signTransaction(transaction);
    const txid = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(txid);
    return txid;
  } catch (error) {
    console.error('Error in transferTokens:', error);
    throw error;
  }
}

export async function createToken(
  connection: Connection,
  wallet: WalletContextState,
  params: CreateTokenParams
): Promise<PublicKey> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  try {
    const mintKeypair = Keypair.generate();
    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: 82,
        lamports: await connection.getMinimumBalanceForRentExemption(82),
        programId: TOKEN_PROGRAM_ID
      }),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        params.decimals,
        wallet.publicKey,
        wallet.publicKey,
        TOKEN_PROGRAM_ID
      )
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    transaction.partialSign(mintKeypair);
    const signedTx = await wallet.signTransaction(transaction);
    const txid = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(txid);

    const associatedTokenAddress = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      wallet.publicKey
    );

    const tokenTx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        associatedTokenAddress,
        wallet.publicKey,
        mintKeypair.publicKey
      ),
      createMintToInstruction(
        mintKeypair.publicKey,
        associatedTokenAddress,
        wallet.publicKey,
        1000000 * Math.pow(10, params.decimals)
      )
    );

    const { blockhash: tokenTxBlockhash } = await connection.getLatestBlockhash();
    tokenTx.recentBlockhash = tokenTxBlockhash;
    tokenTx.feePayer = wallet.publicKey;
    const signedTokenTx = await wallet.signTransaction(tokenTx);
    const tokenTxid = await connection.sendRawTransaction(signedTokenTx.serialize());
    await connection.confirmTransaction(tokenTxid);

    try {
      const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata());
      const walletAdapter = {
        publicKey: publicKey(wallet.publicKey.toBase58()),
        signTransaction: async (transaction: any) => {
          if (transaction.serialize) {
            return wallet.signTransaction!(transaction);
          }
          
          const web3JsTx = new Transaction();
          web3JsTx.feePayer = wallet.publicKey!;
          
          const { blockhash } = await connection.getLatestBlockhash('confirmed');
          web3JsTx.recentBlockhash = blockhash;
          
          if (transaction.message?.instructions) {
            for (const ix of transaction.message.instructions) {
              try {
                const instruction = new TransactionInstruction({
                  programId: new PublicKey(ix.programId.toString()),
                  keys: ix.keys.map((key: { pubkey: any; isSigner: boolean; isWritable: boolean }) => ({
                    pubkey: new PublicKey(key.pubkey.toString()),
                    isSigner: key.isSigner,
                    isWritable: key.isWritable
                  })),
                  data: Buffer.from(ix.data)
                });
                web3JsTx.add(instruction);
              } catch (e) {
                console.error('Error adding instruction:', e);
                throw e;
              }
            }
          }
          return await wallet.signTransaction!(web3JsTx);
        },
        signAllTransactions: async (transactions: any[]) => {
          if (!wallet.signAllTransactions) {
            throw new Error('Wallet does not support signing multiple transactions');
          }
          
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
          
          return await wallet.signAllTransactions!(
            transactions.map(tx => {
              if (tx.serialize) return tx;
              
              const web3JsTx = new Transaction();
              web3JsTx.feePayer = wallet.publicKey!;
              web3JsTx.recentBlockhash = blockhash;
              web3JsTx.lastValidBlockHeight = lastValidBlockHeight;
              
              if (tx.instructions) {
                for (const ix of tx.instructions) {
                  try {
                    web3JsTx.add({
                      programId: new PublicKey(ix.programId.toString()),
                      keys: ix.keys.map((key: any) => ({
                        pubkey: new PublicKey(key.pubkey.toString()),
                        isSigner: key.isSigner,
                        isWritable: key.isWritable
                      })),
                      data: Buffer.from(ix.data)
                    });
                  } catch (e) {
                    console.error('Error adding instruction in signAllTransactions:', e);
                    throw e;
                  }
                }
              }
              return web3JsTx;
            })
          );
        },
      };
      
      umi.use(signerIdentity(walletAdapter as any));
      const mintUmiPublicKey = publicKey(mintKeypair.publicKey.toString());
      
      try {
        const tx = await createV1(umi, {
          mint: mintUmiPublicKey,
          authority: umi.identity,
          name: params.name,
          symbol: params.symbol,
          uri: params.uri || '',
          sellerFeeBasisPoints: percentAmount(0),
          tokenStandard: TokenStandard.Fungible,
          decimals: params.decimals,
        }).sendAndConfirm(umi);
      } catch (innerError) {
        console.error('Error in createV1:', innerError);
        throw innerError;
      }
    } catch (metadataError) {
      console.error('Error creating metadata (token was still created):', metadataError);
    }
    
    return mintKeypair.publicKey;
  } catch (error) {
    console.error('Error in createToken:', error);
    throw error;
  }
}

export async function mintTokens(
  connection: Connection,
  wallet: WalletContextState,
  mintAddress: PublicKey,
  amount: number
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  try {
    const mintInfo = await getMint(connection, mintAddress);
    const tokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      wallet.publicKey
    );
    
    const transaction = new Transaction().add(
      createMintToInstruction(
        mintAddress,
        tokenAccount,
        wallet.publicKey,
        amount * Math.pow(10, mintInfo.decimals)
      )
    );
    
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;
    const signedTx = await wallet.signTransaction(transaction);
    const txid = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(txid);
    return txid;
  } catch (error) {
    console.error('Error in mintTokens:', error);
    throw error;
  }
}

export async function addMetadataToToken(
  connection: Connection,
  wallet: WalletContextState,
  mintAddress: PublicKey,
  params: {
    name: string;
    symbol: string;
    uri: string;
    decimals?: number;
  },
  options: RetryOptions = { maxRetries: 3, initialBackoff: 1000 }
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  let attempt = 0;
  let lastError: any = null;
  
  while (attempt <= options.maxRetries) {
    try {
      let currentConnection = connection;
      if (attempt > 0) {
        currentConnection = new Connection(
          connection.rpcEndpoint,
          { commitment: 'confirmed' }
        );
      }
      
      let decimals = params.decimals;
      if (decimals === undefined) {
        const mintInfo = await getMint(currentConnection, mintAddress);
        decimals = mintInfo.decimals;
      }
      
      const metaplex = Metaplex.make(currentConnection);
      metaplex.use(walletAdapterIdentity(wallet));
      
      const { response } = await metaplex.nfts().createSft({
        useExistingMint: mintAddress,
        name: params.name,
        symbol: params.symbol,
        uri: params.uri,
        sellerFeeBasisPoints: 0,
        decimals: decimals,
      });
      
      return response.signature;
    } catch (error: any) {
      attempt++;
      if (attempt > options.maxRetries) {
        throw error;
      }
      
      const jitter = Math.random() * 0.3 + 0.85;
      const backoffTime = options.initialBackoff * Math.pow(2, attempt - 1) * jitter;
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
  
  throw lastError || new Error('Failed to add metadata after max retries');
}

export async function addMetadataToTokenAlternative(
  connection: Connection,
  wallet: WalletContextState,
  mintAddress: PublicKey,
  params: {
    name: string;
    symbol: string;
    uri: string;
    decimals?: number;
  },
  options: RetryOptions = { maxRetries: 3, initialBackoff: 1000 }
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  let attempt = 0;
  let lastError: any = null;
  
  while (attempt <= options.maxRetries) {
    try {
      let currentConnection = connection;
      if (attempt > 0) {
        currentConnection = new Connection(
          connection.rpcEndpoint,
          { commitment: 'confirmed' }
        );
      }
      
      const metaplex = new Metaplex(currentConnection);
      metaplex.use(walletAdapterIdentity(wallet));
      
      const { response } = await metaplex.nfts().create({
        useExistingMint: mintAddress,
        name: params.name,
        symbol: params.symbol,
        uri: params.uri,
        sellerFeeBasisPoints: 0,
        tokenStandard: 0,
        tokenOwner: wallet.publicKey,
      });
      
      return response.signature;
    } catch (error: any) {
      attempt++;
      if (attempt > options.maxRetries) {
        throw error;
      }
      
      const backoffTime = options.initialBackoff * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
  
  throw lastError || new Error('Failed to add metadata after max retries');
}

export async function addMetadataToTokenDirect(
  connection: Connection,
  wallet: WalletContextState,
  mintAddress: PublicKey,
  params: {
    name: string;
    symbol: string;
    uri: string;
    decimals?: number;
  },
  options: RetryOptions = { maxRetries: 3, initialBackoff: 1000 }
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  let attempt = 0;
  let lastError: any = null;
  
  while (attempt <= options.maxRetries) {
    try {
      let decimals = params.decimals;
      if (decimals === undefined) {
        const mintInfo = await getMint(connection, mintAddress);
        decimals = mintInfo.decimals;
      }
      
      const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
      const [metadataAddress] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintAddress.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      
      const transaction = new Transaction();
      
      const metadataData = {
        name: params.name,
        symbol: params.symbol,
        uri: params.uri,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null
      };
      
      const metadataArgs = Buffer.from(JSON.stringify(metadataData));
      
      const createMetadataInstruction = new TransactionInstruction({
        keys: [
          { pubkey: metadataAddress, isWritable: true, isSigner: false },
          { pubkey: mintAddress, isWritable: false, isSigner: false },
          { pubkey: wallet.publicKey, isWritable: false, isSigner: true },
          { pubkey: wallet.publicKey, isWritable: true, isSigner: true },
          { pubkey: SystemProgram.programId, isWritable: false, isSigner: false },
        ],
        programId: TOKEN_METADATA_PROGRAM_ID,
        data: Buffer.concat([
          Buffer.from([0]),
          metadataArgs
        ])
      });
      
      transaction.add(createMetadataInstruction);
      
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;
      
      const signedTx = await wallet.signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txid, 'confirmed');
      
      return txid;
    } catch (error: any) {
      attempt++;
      if (attempt > options.maxRetries) {
        throw error;
      }
      
      const backoffTime = options.initialBackoff * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
  
  throw lastError || new Error('Failed to add metadata after max retries');
}

export async function getTokenAccounts(connection: Connection, walletAddress: PublicKey) {
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletAddress, {
    programId: TOKEN_PROGRAM_ID,
  });

  return tokenAccounts.value.map((account) => {
    const parsedInfo = account.account.data.parsed.info;
    return {
      mint: parsedInfo.mint,
      amount: parsedInfo.tokenAmount.uiAmount,
      name: parsedInfo.tokenAmount.uiAmount > 0 ? "Token" : "Empty Account",
    };
  });
}