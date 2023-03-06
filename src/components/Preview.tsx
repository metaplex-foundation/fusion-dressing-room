import { Nft, NftWithToken, Sft, SftWithToken } from '@metaplex-foundation/js';
import { Button, Stack } from '@mui/material';
import { FC, useEffect, useRef, useState } from 'react';

export class PreviewProps {
    parent: Nft;
    traits: (Nft | Sft)[];
    fusedTraits: (Nft | Sft)[];
}

export const Preview: FC<PreviewProps> = ({ parent, traits, fusedTraits }) => {
    console.log("Traits:", traits);
    console.log("Fused Traits:", fusedTraits);
    let combinedTraits: (NftWithToken | SftWithToken)[] = [];
    for (const trait of traits) {
        if (trait && !nftContains(fusedTraits, trait)){
            combinedTraits.push(trait as NftWithToken | SftWithToken);
        }
    }
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgLoadArray = new Array(1 + combinedTraits.length).fill(false);
    const imgArray = new Array(1 + combinedTraits.length).fill(null);

    // const handleDownload = async () => {
    //     let image = canvasRef.current.toDataURL("image/png").replace("image/png", "image/octet-stream");
    //     let link = document.createElement('a');
    //     link.download = "BabyBread.png";
    //     link.href = image;
    //     link.click();
    // };

    useEffect(() => {
        const render = () => {
            const canvas = canvasRef.current
            const context = canvas.getContext('2d')

            const draw = (ctx: CanvasRenderingContext2D) => {
                context.clearRect(0, 0, canvas.width, canvas.height);
                canvasRef.current.width = imgArray[0].width;
                canvasRef.current.height = imgArray[0].height;
                for (let img of imgArray) {
                    console.log(img);
                    if (img) {
                        ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.width * (img.height / img.width));
                    }
                }
            }

            draw(context);
        }

        if (!imgArray[0]) {
            imgArray[0] = new Image();
            imgArray[0].src = parent.json.image;
            imgArray[0].onload = () => {
                console.log("Loaded Parent");
                imgLoadArray[0] = true;
                render();
            }
        }

        for (let i = 0; i < combinedTraits.length; i++) {
            if (!imgArray[i + 1] && combinedTraits[i] && combinedTraits[i].json) {
                imgArray[i + 1] = new Image();
                imgArray[i + 1].src = combinedTraits[i].json.raw_image;
                imgArray[i + 1].onload = () => {
                    console.log("Loaded Trait " + i);
                    imgLoadArray[i + 1] = true;
                    render();
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parent, combinedTraits])

    useEffect(() => {
        combinedTraits = [];
        for (const trait of traits) {
            if (trait && !nftContains(fusedTraits, trait)){
                combinedTraits.push(trait as NftWithToken | SftWithToken);
            }
        }
    }, [traits])

    // useEffect(() => {
    //     console.log(imgArray);
    //     console.log(imgLoadArray);
    //     const draw = (ctx: CanvasRenderingContext2D) => {
    //         for (let img of imgArray) {
    //             canvasRef.current.width = img.width;
    //             canvasRef.current.height = img.height;
    //             ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.width * (img.height / img.width));
    //         }
    //     }

    //     const canvas = canvasRef.current
    //     const context = canvas.getContext('2d')
    //     //Our draw came here
    //     const render = () => {
    //         if (imgLoadArray.every((e) => e)) {
    //             draw(context);
    //         }
    //     }
    //     render();
    // }, [imgArray, imgLoadArray])

    return (
        <canvas
            ref={canvasRef}
            style={{ width: "100%" }}
        />
    )
}

function nftContains(nfts: (Nft | Sft)[], nft: Nft | Sft) {
    for (const selectedNft of nfts) {
        console.log(nft);
        if (selectedNft.mint.address === nft.mint.address) {
            return true;
        }
    }
    return false;
}