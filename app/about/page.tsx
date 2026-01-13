"use client";

import GUI from "lil-gui";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AboutCoin3D = dynamic(() => import("@/app/components/about-coin-3d"), {
  ssr: false,
});

export default function AboutPage() {
  const [debugSettings, setDebugSettings] = useState<{
    about: { hoverRadius: number; trailLifetime: number; blockSize: number; easing: number; pingPongStart: number; pingPongEnd: number };
  }>({
    about: { hoverRadius: 2.0, trailLifetime: 1, blockSize: 10, easing: 1.9, pingPongStart: 5.7, pingPongEnd: 0.35 },
  });

  useEffect(() => {
    const gui = new GUI({
      width: 200,
      title: "3D objects",
      closeFolders: true,
    });

    const folder = gui.addFolder("About");
    folder.add(debugSettings.about, "hoverRadius", 0, 5).onChange((v: number) => {
      setDebugSettings((d) => ({ ...d, about: { ...d.about, hoverRadius: v } }));
    });
    folder.add(debugSettings.about, "trailLifetime", 0, 5).onChange((v: number) => {
      setDebugSettings((d) => ({
        ...d,
        about: { ...d.about, trailLifetime: v },
      }));
    });
    folder.add(debugSettings.about, "blockSize", 1, 18, 0.5).onChange((v: number) => {
      setDebugSettings((d) => ({ ...d, about: { ...d.about, blockSize: v } }));
    });
    folder.add(debugSettings.about, "easing", 0, 10).onChange((v: number) => {
      setDebugSettings((d) => ({ ...d, about: { ...d.about, easing: v } }));
    });
    folder.add(debugSettings.about, "pingPongStart", 0, 10).onChange((v: number) => {
      setDebugSettings((d) => ({ ...d, about: { ...d.about, pingPongStart: v } }));
    });
    folder.add(debugSettings.about, "pingPongEnd", 0, 10).onChange((v: number) => {
      setDebugSettings((d) => ({ ...d, about: { ...d.about, pingPongEnd: v } }));
    });

    return () => {
      gui.destroy();
    };
  }, []);

  return (
    <main className="w-full h-screen overflow-hidden">
      <div className="flex w-full h-full">
        <AboutCoin3D
          hoverRadius={debugSettings.about.hoverRadius}
          trailLength={128}
          trailLifetime={debugSettings.about.trailLifetime}
          maxHoverRotation={20}
          coinSize={3.0}
          modelUrl="./models/bitcoin.gltf"
          xIconUrl="./x.svg"
          hIconUrl="./h.svg"
          blockSize={debugSettings.about.blockSize}
          gapSize={1}
          xProb={0.005}
          hProb={0.02}
          objectOffsetX={0}
          objectOffsetY={-0.3}
          easing={debugSettings.about.easing}
          pingPongStart={debugSettings.about.pingPongStart}
          pingPongEnd={debugSettings.about.pingPongEnd}
          enableHover={true}
        />
      </div>
    </main>
  );
}
