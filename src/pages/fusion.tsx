import type { NextPage } from "next";
import Head from "next/head";
import { FusionView } from "../views";

const Fusion: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Solana Scaffold</title>
        <meta
          name="description"
          content="Solana Scaffold"
        />
      </Head>
      <FusionView />
    </div>
  );
};

export default Fusion;
