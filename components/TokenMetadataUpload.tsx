import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";
import { useToast } from "./ui/use-toast";
import { addMetadataToToken } from "@/lib/solana";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

export default function TokenMetadataUpload() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        mintAddress: "",
        name: "",
        symbol: "",
        imageUrl: ""
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    async function handleUploadMetadata() {
        if (!wallet.publicKey) {
            toast({
                title: "Error",
                description: "Please connect your wallet first",
                variant: "destructive"
            });
            return;
        }

        if (!formData.mintAddress || !formData.name || !formData.symbol) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsLoading(true);
            
           
            const { blockhash } = await connection.getLatestBlockhash();
            
            const signature = await addMetadataToToken(
                connection,
                {
                    ...wallet,
                    signTransaction: async (transaction) => {
                        if (transaction instanceof Transaction) {
                            transaction.recentBlockhash = blockhash;
                        }
                        return wallet.signTransaction!(transaction);
                    },
                    signAllTransactions: async (transactions) => {
                        return await wallet.signAllTransactions!(
                            transactions.map(tx => {
                                if (tx instanceof Transaction) {
                                    tx.recentBlockhash = blockhash;
                                }
                                return tx;
                            })
                        );
                    }
                },
                new PublicKey(formData.mintAddress),
                {
                    name: formData.name,
                    symbol: formData.symbol,
                    uri: formData.imageUrl
                }
            );
            
            toast({
                title: "Success",
                description: `Metadata uploaded successfully! Transaction: ${signature}`,
            });
        } catch (error) {
            console.error("Error uploading metadata:", error);
            toast({
                title: "Error",
                description: "Failed to upload metadata. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <h2 className="text-2xl font-bold">Upload Token Metadata</h2>
            <div>
                <Input 
                    name="mintAddress"
                    placeholder="Token Mint Address"
                    value={formData.mintAddress}
                    onChange={handleInputChange}
                />
            </div>
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
                <Button 
                    onClick={handleUploadMetadata}
                    disabled={isLoading}
                >
                    {isLoading ? "Uploading..." : "Upload Metadata"}
                </Button>
            </div>
        </div>
    );
} 