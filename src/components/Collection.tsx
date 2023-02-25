/* eslint-disable @next/next/no-img-element */
// Next, React
import { FC, useEffect, useState } from 'react';

// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Components
import pkg from '../../package.json';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
// import ListSubheader from '@mui/material/ListSubheader';

// Store
import useUserSOLBalanceStore from '../stores/useUserSOLBalanceStore';
import useUserNFTsStore from '../stores/useUserNFTsStore';
import { Nft, Sft } from '@metaplex-foundation/js';

export class CollectionProps {
    setSelection: (nfts: (Nft | Sft)[]) => void;
    filter: (nft: Nft | Sft, props: any) => boolean;
    filterProps: any;
}

export const Collection: FC<CollectionProps> = ({ setSelection, filter, filterProps }) => {
    const [ selectedNft, setSelectedNft ] = useState<Nft | Sft>(null);

    const wallet = useWallet();
    const { connection } = useConnection();

    const balance = useUserSOLBalanceStore((s) => s.balance)
    const { getUserSOLBalance } = useUserSOLBalanceStore()

    const nftList = useUserNFTsStore((s) => s.nftList).sort((nft0, nft1) => {
        if (nft0.name < nft1.name) return -1;
        if (nft0.name > nft1.name) return 1;
        return 0;
    })
    
    let filteredList = [];
    for (const nft of nftList) {
        if (filter(nft, filterProps)) {
            filteredList.push(nft);
        }
    }
    // console.log(filteredList);

    const { getUserNFTs } = useUserNFTsStore()

    useEffect(() => {
        if (wallet.publicKey) {
            // console.log(wallet.publicKey.toBase58())
            getUserNFTs(wallet.publicKey, connection)
        }
    }, [wallet.publicKey, connection, getUserNFTs])

    useEffect(() => {
        setSelection([selectedNft]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNft])

    return (
        <ImageList sx={{ width: "100%", height: "100%", justifySelf: "center"}} cols={4}>
            {filteredList.map((nft) => (
                <ImageListItem key={nft.mint.address.toString()}>
                    <img
                        src={`${nft.json?.image}?w=248&fit=crop&auto=format`}
                        srcSet={`${nft.json?.image}?w=248&fit=crop&auto=format&dpr=2 2x`}
                        alt={nft.name}
                        loading="lazy"
                        onClick={() => {setSelectedNft(nft)}}
                        style={{cursor: "pointer", border: selectedNft === nft ? "10px solid #0F0" : "none"}}
                    />
                    <ImageListItemBar
                        title={nft.name}
                        subtitle={nft.symbol}
                    // actionIcon={
                    //   <IconButton
                    //     sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                    //     aria-label={`info about ${nft.name}`}
                    //   >
                    //     <JoinFull />
                    //   </IconButton>
                    // }
                    />
                </ImageListItem>
            ))}
        </ImageList>
    );
};
