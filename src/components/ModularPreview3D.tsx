import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import init, { Modular } from "nodi-modular";
import braidData from "../assets/braid.json";
import { OrbitControls, Stage } from "@react-three/drei";

interface ModularPreview3DProps {
  pixelRatio: number;
  innerDiameter: number;
}

// Helper to convert nodi-modular geometry to THREE.BufferGeometry
const convertGeometryInterop = (interop: any, transform: number[]): THREE.BufferGeometry | null => {
  switch (interop?.variant) {
    case "Mesh": {
      const { data } = interop;
      const geometry = new THREE.BufferGeometry();

      const { vertices, normals, faces } = data;
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(vertices.flat(1)), 3)
      );
      if (normals) {
          geometry.setAttribute(
            "normal",
            new THREE.BufferAttribute(new Float32Array(normals.flat(1)), 3)
          );
      }
      if (faces !== undefined) {
        geometry.setIndex(
          new THREE.BufferAttribute(new Uint32Array(faces.flat(1)), 1)
        );
      }
      geometry.applyMatrix4(new THREE.Matrix4().fromArray(transform));

      return geometry;
    }
    
    default:
      return null;
  }
};

const Model = ({ geometries }: { geometries: { id: string; geometry: THREE.BufferGeometry }[] }) => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((_state, delta) => {
      if (groupRef.current) {
        groupRef.current.rotation.y += delta * 0.2;
      }
    });

    return (
        <group ref={groupRef} rotation={[0, 0, 0]}>
            {geometries.map((g, i) => (
                <mesh key={i} geometry={g.geometry} rotation={[-Math.PI / 2, 0, 0]}>
                    <meshStandardMaterial color="#e5ba4d" metalness={0.9} roughness={0.2} />
                    {/* <meshBasicMaterial wireframe color={"#e5ba4d"} /> */}
                </mesh>
            ))}
        </group>
    );
};


const Scene = ({ pixelRatio }: { pixelRatio: number; geometries: any[] }) => {
  const gl = useThree((state) => state.gl);

  useLayoutEffect(() => {
    const originalPixelRatio = gl.getPixelRatio();
    gl.setPixelRatio(pixelRatio);
    return () => gl.setPixelRatio(originalPixelRatio);
  }, [gl, pixelRatio]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
    </>
  );
};

export function ModularPreview3D({ pixelRatio, innerDiameter }: ModularPreview3DProps) {
  const [modular, setModular] = useState<Modular | null>(null);
  const [geometries, setGeometries] = useState<{ id: string; geometry: THREE.BufferGeometry }[]>([]);
  const [innerDiameterNodeId, setInnerDiameterNodeId] = useState<string | null>(null);

  useEffect(() => {
    const initModular = async () => {
      await init({ module_or_path: "/nodi_modular_bg.wasm" });
      const mod = Modular.new();
      setModular(mod);
    };
    initModular();
  }, []);

  useEffect(() => {
    if (!modular) return;

    const loadAndEvaluate = async () => {
      try {
        modular.loadGraph(JSON.stringify(braidData.graph));
        
        const nodes = modular.getNodes();
        const innerDiameterNode = nodes.find((node: any) => node.label === "innerDiameter");
        if (innerDiameterNode) {
            setInnerDiameterNodeId(innerDiameterNode.id);
        }

        const result = await modular.evaluate();
        
        // This part is tricky without the exact `convertGeometryInterop` function
        // We will try to get meshes directly.
        // In the reference: 
        // const { geometryIdentifiers } = result;
        // const interop = modular.findGeometryInteropById(id);
        // const geometry = convertGeometryInterop(interop, transform);

        const { geometryIdentifiers } = result;
        if (!geometryIdentifiers) return;

        const newGeometries: { id: string; geometry: THREE.BufferGeometry }[] = [];

        for (const id of geometryIdentifiers) {
             const interop = modular.findGeometryInteropById(id);
             const { transform } = id;
             const geometry = convertGeometryInterop(interop, transform);
             if (geometry) {
                 // Assuming id object has an id property, otherwise fallback or adjust based on actual type
                 // The error says 'id' does not exist on GeometryIdentifier, let's inspect what properties it has
                 // or just use a string representation if needed.
                 // Based on type definition usually it might be nested or just the object itself is the identifier with properties.
                 // Let's cast for now to bypass strict check if we are sure, or better: use a generated ID.
                 newGeometries.push({ id: Math.random().toString(), geometry });
             }
        }
        setGeometries(newGeometries);
        
      } catch (error) {
        console.error("Error evaluating graph:", error);
      }
    };
    
    // Trigger load
    loadAndEvaluate();
    
  }, [modular]);

  useEffect(() => {
    if (!modular || !innerDiameterNodeId) return;

    const updateGraph = async () => {
      try {
        const property = {
            name: "value",
            value: {
              type: "Number" as const,
              content: innerDiameter,
            },
        };
        modular.changeNodeProperty(innerDiameterNodeId, property);
        const result = await modular.evaluate();
        
        const { geometryIdentifiers } = result;
        if (!geometryIdentifiers) return;

        const newGeometries: { id: string; geometry: THREE.BufferGeometry }[] = [];

        for (const id of geometryIdentifiers) {
             const interop = modular.findGeometryInteropById(id);
             const { transform } = id;
             const geometry = convertGeometryInterop(interop, transform);
             if (geometry) {
                 newGeometries.push({ id: Math.random().toString(), geometry });
             }
        }
        setGeometries(newGeometries);
      } catch (error) {
        console.error("Error updating graph:", error);
      }
    };

    updateGraph();
  }, [innerDiameter, modular, innerDiameterNodeId]);

  return (
    <div className="relative w-full h-full">
      <Canvas
        gl={{ antialias: false }}
        camera={{ position: [0, 50, 50], fov: 45 }}
      >
        <OrbitControls makeDefault />
        <Stage intensity={0.5} preset="rembrandt" adjustCamera={1.2}>
           {/* Geometries will be rendered here */}
           <Model geometries={geometries} />
        </Stage>
        <Scene pixelRatio={pixelRatio} geometries={geometries} />
      </Canvas>
    </div>
  );
}

