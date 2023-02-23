/* eslint-disable @next/next/no-img-element */
// Next, React
import { FC, useEffect, useState } from 'react';
import Link from 'next/link';

// Wallet
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

// Components
import Stack from '@mui/material/Stack';

// Store
import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';
import useUserNFTsStore from '../../stores/useUserNFTsStore';
import { findTriflePda, createTrifleAccount } from '../../utils/trifle';
import { Collection } from 'components/Collection';
import { Nft, PublicKey, Sft } from '@metaplex-foundation/js';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

function filterByParentCollection(nft: Nft | Sft) {
  return (nft.collection?.address && (nft.collection?.address.toString() === process.env.NEXT_PUBLIC_PARENT_COLLECTION_MINT));
}

function filterByTraitCollections(nft: Nft | Sft) {
  const traitCollections = process.env.NEXT_PUBLIC_TRAIT_COLLECTION_MINTS.split(',');
  for (const traitCollection of traitCollections) {
    if (nft.collection?.address && (nft.collection?.address.toString() === traitCollection)) {
      return true;
    }
  }
  return false;
}

export const FusionView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();

  const balance = useUserSOLBalanceStore((s) => s.balance)
  const { getUserSOLBalance } = useUserSOLBalanceStore()

  const nftList = useUserNFTsStore((s) => s.nftList).sort((nft0, nft1) => {
    if (nft0.name < nft1.name) return -1;
    if (nft0.name > nft1.name) return 1;
    return 0;
  })
  const { getUserNFTs } = useUserNFTsStore();
  const [selectedParent, setSelectedParent] = useState<Nft | Sft>(null);
  const [selectedTraits, setSelectedTraits] = useState<(Nft | Sft)[]>([]);
  const [needsTrifle, setNeedsTrifle] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  // console.log(selectedParent);

  function setSelectionParent(nfts: (Nft | Sft)[]) {
    if (nfts.length > 0) {
      setSelectedParent(nfts[0]);
    }
  }

  function setSelectionTraits(nfts: (Nft | Sft)[]) {
    if (nfts.length > 0) {
      setSelectedTraits(nfts);
    }
  }

  const handleClose = () => {
    console.log("handleClose");
    createTrifleAccount(connection, selectedParent as Nft, wallet);
    setOpen(false);
  };

  const handleCancel = () => {
    console.log("handleCancel");
    setSelectedParent(null);
    setOpen(false);
  };

  useEffect(() => {
    if (wallet.publicKey) {
      // console.log(wallet.publicKey.toBase58())
      getUserNFTs(wallet.publicKey, connection)
    }
  }, [wallet.publicKey, connection, getUserNFTs])

  useEffect(() => {
    async function check_trifle() {
      if (connection && selectedParent) {
        const auth_pubkey = new PublicKey(process.env.NEXT_PUBLIC_FUSION_AUTHORITY);
        const [triflePda] = findTriflePda(selectedParent.mint.address, auth_pubkey);
        const trifleAccount = await connection.getAccountInfo(triflePda);
        if (trifleAccount == null) {
          setNeedsTrifle(true);
          setOpen(true);
        }
        else {
          setNeedsTrifle(false);
          setOpen(false);
        }
      }
    }
    check_trifle();
  }, [connection, selectedParent, open])

  if (selectedParent == null) {
    return (
      <Collection setSelection={setSelectionParent} filter={filterByParentCollection} />
    );
  }
  else {
    return (
      <>
        <Stack
          direction="row"
          justifyContent="space-evenly"
          alignItems="stretch"
          spacing={1}
        >
          <img
            src={`${selectedParent.json?.image}?w=248&fit=crop&auto=format`}
            srcSet={`${selectedParent.json?.image}?w=248&fit=crop&auto=format&dpr=2 2x`}
            alt={selectedParent.name}
            loading="lazy"
            style={{ width: "75%", objectFit: "contain" }}
          />
          <Collection setSelection={setSelectionTraits} filter={filterByTraitCollections} />
        </Stack >
        <Dialog open={open} onClose={handleCancel}>
          <DialogTitle>Enable Fusion</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This NFT does not have Fusion enabled. Enable now?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleClose}>Enable</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
};
