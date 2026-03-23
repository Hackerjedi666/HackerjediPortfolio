"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense } from "react";

function HackerRoomModel() {
  const { scene } = useGLTF("/models/hacker-room.glb");

  return (
    <primitive
      object={scene}
      scale={1.5}
      position={[0, -0.5, 0]}
      rotation={[0, Math.PI * 0.3, 0]}
    />
  );
}

export default function ThreeHero() {
  return (
    <div className="h-screen w-full">
      <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
        <Suspense fallback={null}>
          <HackerRoomModel />
          <ambientLight intensity={0.6} />
          <directionalLight position={[1, 1, 1]} intensity={0.8} />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/hacker-room.glb");
