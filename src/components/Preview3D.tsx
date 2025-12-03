import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";

interface Preview3DProps {
  hue: number;
  saturation: number;
  lightness: number;
  pixelRatio: number;
}

const Icosahedron = ({ color }: { color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} rotation-x={0.35}>
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial wireframe color={color} />
    </mesh>
  );
};

const Scene = ({ color, pixelRatio }: { color: string; pixelRatio: number }) => {
  const gl = useThree((state) => state.gl);

  useLayoutEffect(() => {
    const originalPixelRatio = gl.getPixelRatio();
    gl.setPixelRatio(pixelRatio);
    return () => gl.setPixelRatio(originalPixelRatio);
  }, [gl, pixelRatio]);

  return (
    <>
      <Icosahedron color={color} />
    </>
  );
};

export function Preview3D({ hue, saturation, lightness, pixelRatio }: Preview3DProps) {
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  return (
    <div className="relative w-full h-full">
      <Canvas
        gl={{ antialias: false }}
        camera={{ position: [0, 0, 3] }}
      >
        <Scene color={color} pixelRatio={pixelRatio} />
      </Canvas>
    </div>
  );
}

