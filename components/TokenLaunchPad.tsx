import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Keypair, SystemProgram, Transaction, PublicKey } from "@solana/web3.js";
import { createInitializeMint2Instruction, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { useState } from "react";
import { useToast } from "./ui/use-toast";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createMetadataAccountV3 } from "@metaplex-foundation/mpl-token-metadata";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { createSignerFromKeypair } from "@metaplex-foundation/umi";

export default function TokenLaunchPad() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        symbol: "",
        imageUrl: "",
        initialSupply: ""
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    async function createClick() {
        if (!wallet.publicKey) {
            toast({
                title: "Error",
                description: "Please connect your wallet first",
                variant: "destructive"
            });
            return;
        }

        if (!formData.name || !formData.symbol) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsLoading(true);
            const mint = Keypair.generate();
            const lamports = await getMinimumBalanceForRentExemptMint(connection);
            
            const createMintAccountIx = SystemProgram.createAccount({
                fromPubkey: wallet.publicKey,
                newAccountPubkey: mint.publicKey,
                space: MINT_SIZE,
                lamports,
                programId: TOKEN_2022_PROGRAM_ID
            });

       
            const initializeMintIx = createInitializeMint2Instruction(
                mint.publicKey,
                9,
                wallet.publicKey,
                TOKEN_2022_PROGRAM_ID
            );

            const transaction = new Transaction()
                .add(createMintAccountIx)
                .add(initializeMintIx);

            transaction.feePayer = wallet.publicKey;
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            transaction.partialSign(mint);

            const signature = await wallet.sendTransaction(transaction, connection);
            await connection.confirmTransaction({
                signature,
                blockhash: transaction.recentBlockhash!,
                lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight
            });

        
            const umi = createUmi(connection.rpcEndpoint);
            const keypair = fromWeb3JsKeypair(mint);
            const signer = createSignerFromKeypair(umi, keypair);
            umi.identity = signer;
            umi.payer = signer;

            const metadataArgs = {
                mint: fromWeb3JsPublicKey(mint.publicKey),
                mintAuthority: signer,
                payer: signer,
                updateAuthority: fromWeb3JsKeypair(mint).publicKey,
                data: {
                    name: formData.name,
                    symbol: formData.symbol,
                    uri: formData.imageUrl || "",
                    sellerFeeBasisPoints: 0,
                    creators: null,
                    collection: null,
                    uses: null
                },
                isMutable: true,
                collectionDetails: null,
            };

            const instruction = createMetadataAccountV3(umi, metadataArgs);
            const metadataTransaction = await instruction.buildAndSign(umi);
            await umi.rpc.sendTransaction(metadataTransaction);
            
            toast({
                title: "Success",
                description: `Token mint created at ${mint.publicKey.toBase58()}`,
            });
            console.log(`Token mint created at ${mint.publicKey.toBase58()}`);
        } catch (error) {
            console.error("Error creating token:", error);
            toast({
                title: "Error",
                description: "Failed to create token. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="h-screen flex justify-center items-center flex-col gap-3">
            <div>
                <Input 
                    name="name"
                    placeholder="Token Name"
                    value={formData.name}
                    onChange={handleInputChange}
                />
            </div>
            <div>
                <Input 
                    name="symbol"
                    placeholder="Token Symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                />
            </div>
            <div>
                <Input 
                    name="imageUrl"
                    placeholder="Token Image URL"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                />
            </div>
            <div>
                <Input 
                    name="initialSupply"
                    placeholder="Token Initial Supply"
                    value={formData.initialSupply}
                    onChange={handleInputChange}
                    type="number"
                />
            </div>
            <div>
                <Button 
                    onClick={createClick}
                    disabled={isLoading}
                >
                    {isLoading ? "Creating..." : "Create Token"}
                </Button>
            </div>
        </div>
    );
}