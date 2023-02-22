import create, { State } from 'zustand'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Nft, Sft, Metadata, Metaplex } from '@metaplex-foundation/js'

interface UserNFTsStore extends State {
  nftList: (Nft | Sft)[];
  getUserNFTs: (publicKey: PublicKey, connection: Connection) => void
}

function isMetadata(arg: any): arg is Metadata {
  return true;
}

const useUserNFTsStore = create<UserNFTsStore>((set, _get) => ({
  nftList: [],
  getUserNFTs: async (publicKey, connection) => {
    const metaplex = new Metaplex(connection);
    const metadatas = await metaplex.nfts().findAllByOwner({
      owner: publicKey,
    });

    const nfts = await Promise.all(metadatas.map(async (metadata) => {
      if (isMetadata(metadata)) {
        return await metaplex.nfts().load({ metadata });
      } else {
        return metadata;
      }
    }));

    set((s) => {
      s.nftList = nfts;
      console.log(`nftList updated, `, nfts);
    });
  },
}));

export default useUserNFTsStore;