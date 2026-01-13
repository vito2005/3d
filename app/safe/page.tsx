"use client";

import GUI from 'lil-gui';
import dynamic from "next/dynamic";
import { useEffect, useState } from 'react';



const Safe3D = dynamic(() => import("@/app/components/safe-3d"), { ssr: false });

export default function Home() {
  const [debugSettings, setDebugSettings] = useState<{ coin: { hoverRadius: number, trailLifetime: number, blockSize: number }, safe: { hoverRadius: number, trailLifetime: number, blockSize: number } }>({
    coin: { hoverRadius: 1.6, trailLifetime: 1, blockSize: 10 },
    safe: { hoverRadius: 1.6, trailLifetime: 1, blockSize: 10 }
  });
  useEffect(() => {
    const params = {
      safe: { hoverRadius: 1.6, trailLifetime: 1, blockSize: 10 },
    };
    const gui = new GUI({
      width: 200,
      title: "3D objects",
      closeFolders: true,
    });

    const safeFolder = gui.addFolder('Safe')
    safeFolder.add(params.safe, 'hoverRadius', 0, 5).onChange((value: number) => {
      setDebugSettings((d) => ({ ...d, safe: { ...d.safe, hoverRadius: value } }));
    });
    safeFolder.add(params.safe, 'trailLifetime', 0, 5).onChange((value: number) => {
      setDebugSettings((d) => ({ ...d, safe: { ...d.safe, trailLifetime: value } }));
    });
    safeFolder.add(params.safe, 'blockSize', 1, 18).onChange((value: number) => {
      setDebugSettings((d) => ({ ...d, safe: { ...d.safe, blockSize: value } }));
    });

    return () => {
      gui.destroy();
    };
  }, []);


  return (
    <main className="w-full h-screen overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:gap-2 w-full h-full">
        <Safe3D
          hoverRadius={debugSettings.safe.hoverRadius}
          trailLength={128}
          trailLifetime={debugSettings.safe.trailLifetime}
          maxHoverRotation={20}
          coinSize={3.0}
          modelUrl="./models/safe.gltf"
          xIconUrl="./x.svg"
          hIconUrl="./h.svg"
          blockSize={debugSettings.safe.blockSize} gapSize={1} xProb={0.005} hProb={0.02} />
      </div>
    </main>
  );
}
