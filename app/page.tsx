"use client";

import GUI from 'lil-gui';
import dynamic from "next/dynamic";
import { useEffect, useState } from 'react';



const ThreeCoin = dynamic(() => import("./components/coin-3d"), { ssr: false });

export default function Home() {
  const [debugSettings, setDebugSettings] = useState<{ coin: { hoverRadius: number, trailLifetime: number, blockSize: number } }>({
    coin: { hoverRadius: 1.6, trailLifetime: 1, blockSize: 10 },
  });
  useEffect(() => {
    const params = {
      coin: { hoverRadius: 1.6, trailLifetime: 1, blockSize: 10 },
    };
    const gui = new GUI({
      width: 200,
      title: "3D objects",
      closeFolders: true,
    });

    const coinFolder = gui.addFolder('Coin');
    coinFolder.add(params.coin, 'hoverRadius', 0, 5).onChange((value: number) => {
      setDebugSettings((d) => ({ ...d, coin: { ...d.coin, hoverRadius: value } }));
    });
    coinFolder.add(params.coin, 'trailLifetime', 0, 5).onChange((value: number) => {
      setDebugSettings((d) => ({ ...d, coin: { ...d.coin, trailLifetime: value } }));
    });
    coinFolder.add(params.coin, 'blockSize', 1, 18, 0.5).onChange((value: number) => {
      setDebugSettings((d) => ({ ...d, coin: { ...d.coin, blockSize: value } }));
    });

    return () => {
      gui.destroy();
    };
  }, []);


  return (
    <main className="w-full h-screen overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:gap-2 w-full h-full">
        <ThreeCoin
          hoverRadius={debugSettings.coin.hoverRadius}
          trailLength={128}
          trailLifetime={debugSettings.coin.trailLifetime}
          maxHoverRotation={20}
          coinSize={3.0}
          modelUrl="./models/bitcoin.gltf"
          xIconUrl="./x.svg"
          hIconUrl="./h.svg"
          blockSize={debugSettings.coin.blockSize} gapSize={1} xProb={0.005} hProb={0.02} />
      </div>
    </main>
  );
}
