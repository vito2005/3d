"use client";

import GUI from 'lil-gui';
import dynamic from "next/dynamic";
import { useEffect, useState } from 'react';



const Token3D = dynamic(() => import("@/app/components/token-3d"), { ssr: false });

export default function Home() {
  const [debugSettings, setDebugSettings] = useState<{ token: { hoverRadius: number, trailLifetime: number, blockSize: number } }>({
    token: { hoverRadius: 1.6, trailLifetime: 1, blockSize: 10 }
  });
  useEffect(() => {
    const params = {
      token: { hoverRadius: 1.6, trailLifetime: 1, blockSize: 10 },
    };
    const gui = new GUI({
      width: 200,
      title: "3D objects",
      closeFolders: true,
    });

    const tokenFolder = gui.addFolder('Token')
    tokenFolder.add(params.token, 'hoverRadius', 0, 5).onChange((value: number) => {
      setDebugSettings((d) => ({ ...d, token: { ...d.token, hoverRadius: value } }));
    });
    tokenFolder.add(params.token, 'trailLifetime', 0, 5).onChange((value: number) => {
      setDebugSettings((d) => ({ ...d, token: { ...d.token, trailLifetime: value } }));
    });
    tokenFolder.add(params.token, 'blockSize', 1, 18, 0.5).onChange((value: number) => {
      setDebugSettings((d) => ({ ...d, token: { ...d.token, blockSize: value } }));
    });

    return () => {
      gui.destroy();
    };
  }, []);


  return (
    <main className="w-full h-screen overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:gap-2 w-full h-full">
        <Token3D
          hoverRadius={debugSettings.token.hoverRadius}
          trailLength={128}
          trailLifetime={debugSettings.token.trailLifetime}
          maxHoverRotation={20}
          coinSize={3.0}
          modelUrl="./models/token.gltf"
          xIconUrl="./x.svg"
          hIconUrl="./h.svg"
          blockSize={debugSettings.token.blockSize} gapSize={1} xProb={0.005} hProb={0.02} />
      </div>
    </main>
  );
}
