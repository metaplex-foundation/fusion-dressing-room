import { Connection, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { PROGRAM_ADDRESS as TRIFLE_PROGRAM_ADDRESS, createCreateTrifleAccountInstruction, EscrowConstraintModel } from '@metaplex-foundation/mpl-trifle';
import { PROGRAM_ADDRESS as TOKEN_METADATA_PROGRAM_ADDRESS } from '@metaplex-foundation/mpl-token-metadata';
import { Nft } from "@metaplex-foundation/js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export const findTriflePda = (
    mint: PublicKey,
    authority: PublicKey,
) => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("trifle"),
            mint.toBuffer(),
            authority.toBuffer(),
        ],
        new PublicKey(TRIFLE_PROGRAM_ADDRESS),
    );
};

export const findEscrowPda = (
    mint: PublicKey,
    authority: 0 | 1,
    creator?: PublicKey,
) => {
    let seeds = [
        Buffer.from("metadata"),
        new PublicKey(TOKEN_METADATA_PROGRAM_ADDRESS).toBuffer(),
        mint.toBuffer(),
        Uint8Array.from([authority]),
    ];

    if (authority == 1) {
        if (creator) {
            seeds.push(creator.toBuffer());
        } else {
            throw new Error("Creator is required");
        }
    }

    seeds.push(Buffer.from("escrow"));
    return PublicKey.findProgramAddressSync(
        seeds,
        new PublicKey(TOKEN_METADATA_PROGRAM_ADDRESS),
    );
};

export const createTrifleAccount = async (connection: Connection, selectedNFT: Nft, wallet: WalletContextState) => {
    const escrowConstraintModelAddress = process.env.NEXT_PUBLIC_CONSTRAINT_MODEL_ADDRESS;
    if (!wallet.publicKey) {
        console.log("Wallet not connected");
        return;
    }

    if (!escrowConstraintModelAddress) {
        console.log("Please select an escrow constraint model");
        return;
    }

    let selectedNFTTokenAccountAddress = await getAssociatedTokenAddress(selectedNFT.address, wallet.publicKey);
    let selectedEscrowConstraintModelAddress = new PublicKey(escrowConstraintModelAddress);
    let trifleAuthority = new PublicKey(process.env.NEXT_PUBLIC_FUSION_AUTHORITY);
    console.log("trifleAuthority: ", trifleAuthority.toString());
    let [trifleAddress] = findTriflePda(selectedNFT.address, trifleAuthority);
    let [escrowAddress] = findEscrowPda(selectedNFT.address, 1, trifleAddress);

    const instructions: TransactionInstruction[] = [];

    instructions.push(createCreateTrifleAccountInstruction({
        escrow: escrowAddress,
        metadata: selectedNFT.metadataAddress,
        mint: selectedNFT.address,
        tokenAccount: selectedNFTTokenAccountAddress,
        edition: selectedNFT.edition.address,
        trifleAccount: trifleAddress,
        trifleAuthority: trifleAuthority,
        constraintModel: selectedEscrowConstraintModelAddress,
        payer: wallet.publicKey,
        tokenMetadataProgram: new PublicKey(TOKEN_METADATA_PROGRAM_ADDRESS),
        sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
    }));

    let blockhash = await connection
        .getLatestBlockhash()
        .then((res) => res.blockhash);

    // create v0 compatible message
    const messageV0 = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash,
        instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    // sign your transaction with the required `Signers`
    const userSignedTx = await wallet.signTransaction(transaction);

    const response = await fetch("/api/createTrifleAccountTx", {
        method: "POST",
        body: Buffer.from(userSignedTx.serialize()).toString("base64"),
    });
    const fullySignedTx = VersionedTransaction.deserialize(Uint8Array.from(Buffer.from((await response.json()).tx, "base64")));

    try {
        const txid = await connection.sendRawTransaction(fullySignedTx.serialize(), { skipPreflight: true });
        console.log("Trifle account created");
        console.log(txid);
    } catch (e) {
        console.log(e);
        console.log("Failed to create trifle account");
    }

}

export const getConstraintModel = async (connection: Connection, modelAddress: PublicKey) => {
    const accountInfo = await connection.getAccountInfo(modelAddress);
    if (accountInfo) {
        const account: EscrowConstraintModel =
            EscrowConstraintModel.fromAccountInfo(accountInfo)[0];
        return account;
    } else {
        console.log("Unable to fetch account");
        return null;
    }
}