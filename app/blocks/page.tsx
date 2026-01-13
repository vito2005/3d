"use client";

import GUI from "lil-gui";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Blocks3D = dynamic(() => import("@/app/components/blocks-3d"), {
  ssr: false,
});

export default function BlocksPage() {
  const [debugSettings, setDebugSettings] = useState<{
    blocks: { hoverRadius: number; trailLifetime: number; blockSize: number };
  }>({
    blocks: { hoverRadius: 1.6, trailLifetime: 1, blockSize: 10 },
  });

  useEffect(() => {
    const params = {
      blocks: { hoverRadius: 1.6, trailLifetime: 1, blockSize: 10 },
    };

    const gui = new GUI({
      width: 200,
      title: "3D objects",
      closeFolders: true,
    });

    const blocksFolder = gui.addFolder("Blocks");
    blocksFolder
      .add(params.blocks, "hoverRadius", 0, 5)
      .onChange((value: number) => {
        setDebugSettings((d) => ({
          ...d,
          blocks: { ...d.blocks, hoverRadius: value },
        }));
      });
    blocksFolder
      .add(params.blocks, "trailLifetime", 0, 5)
      .onChange((value: number) => {
        setDebugSettings((d) => ({
          ...d,
          blocks: { ...d.blocks, trailLifetime: value },
        }));
      });
    blocksFolder
      .add(params.blocks, "blockSize", 1, 18, 0.5)
      .onChange((value: number) => {
        setDebugSettings((d) => ({
          ...d,
          blocks: { ...d.blocks, blockSize: value },
        }));
      });

    return () => {
      gui.destroy();
    };
  }, []);

  return (
    <main className="w-full h-screen overflow-hidden">
      <div className="flex w-full h-full">
        <Blocks3D
          hoverRadius={debugSettings.blocks.hoverRadius}
          trailLength={128}
          trailLifetime={debugSettings.blocks.trailLifetime}
          maxHoverRotation={20}
          coinSize={6.0}
          modelUrl="./models/blocks.gltf"
          xIconUrl="./x.svg"
          hIconUrl="./h.svg"
          blockSize={debugSettings.blocks.blockSize}
          gapSize={1}
          xProb={0.005}
          hProb={0.02}
          objectOffsetX={0.5}
          objectOffsetY={2.2}
        />
      </div>
    </main>
  );
}
