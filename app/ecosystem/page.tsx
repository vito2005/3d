"use client";

import GUI from "lil-gui";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const EcosystemCoin3D = dynamic(
  () => import("@/app/components/ecosystem-coin-3d"),
  { ssr: false }
);

export default function EcosystemPage() {
  const [debugSettings, setDebugSettings] = useState<{
    ecosystem: { hoverRadius: number; trailLifetime: number; blockSize: number; easing: number; pingPongStart: number; pingPongEnd: number };
  }>({
    ecosystem: { hoverRadius: 1.6, trailLifetime: 1, blockSize: 10, easing: 1.9, pingPongStart: 2.7, pingPongEnd: 0.62 },
  });

  useEffect(() => {
    const gui = new GUI({
      width: 200,
      title: "3D objects",
      closeFolders: true,
    });

    const folder = gui.addFolder("Ecosystem");
    folder.add(debugSettings.ecosystem, "hoverRadius", 0, 5).onChange((v: number) => {
      setDebugSettings((d) => ({
        ...d,
        ecosystem: { ...d.ecosystem, hoverRadius: v },
      }));
    });
    folder.add(debugSettings.ecosystem, "trailLifetime", 0, 5).onChange((v: number) => {
      setDebugSettings((d) => ({
        ...d,
        ecosystem: { ...d.ecosystem, trailLifetime: v },
      }));
    });
    folder.add(debugSettings.ecosystem, "blockSize", 1, 18, 0.5).onChange((v: number) => {
      setDebugSettings((d) => ({
        ...d,
        ecosystem: { ...d.ecosystem, blockSize: v },
      }));
    });
    folder.add(debugSettings.ecosystem, "easing", 0, 10).onChange((v: number) => {
      setDebugSettings((d) => ({
        ...d,
        ecosystem: { ...d.ecosystem, easing: v },
      }));
    });
    folder.add(debugSettings.ecosystem, "pingPongStart", 0, 10).onChange((v: number) => {
      setDebugSettings((d) => ({
        ...d,
        ecosystem: { ...d.ecosystem, pingPongStart: v },
      }));
    });
    folder.add(debugSettings.ecosystem, "pingPongEnd", 0, 10).onChange((v: number) => {
      setDebugSettings((d) => ({
        ...d,
        ecosystem: { ...d.ecosystem, pingPongEnd: v },
      }));
    });
    return () => {
      gui.destroy();
    };
  }, []);

  return (
    <main className="w-full h-screen overflow-hidden">
      <div className="flex w-full h-full">
        <EcosystemCoin3D
          hoverRadius={debugSettings.ecosystem.hoverRadius}
          trailLength={128}
          trailLifetime={debugSettings.ecosystem.trailLifetime}
          maxHoverRotation={20}
          coinSize={3.0}
          modelUrl="./models/bitcoin.gltf"
          xIconUrl="./x.svg"
          hIconUrl="./h.svg"
          blockSize={debugSettings.ecosystem.blockSize}
          gapSize={1}
          xProb={0.005}
          hProb={0.02}
          objectOffsetX={0}
          objectOffsetY={-0.3}
          easing={debugSettings.ecosystem.easing}
          pingPongStart={debugSettings.ecosystem.pingPongStart}
          pingPongEnd={debugSettings.ecosystem.pingPongEnd}
        />
      </div>
    </main>
  );
}
