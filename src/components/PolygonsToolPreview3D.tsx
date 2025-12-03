import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import init, { Modular } from "nodi-modular";
import polygonstoolData from "../assets/polygonstool.json";
import { OrbitControls, Stage } from "@react-three/drei";

interface PolygonsToolPreview3DProps {
  pixelRatio: number;
  diameter: number;
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
    
    case "Curve": {
      const { data } = interop;
      const geometry = new THREE.BufferGeometry();

      const { vertices } = data;
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(vertices.flat(1)), 3)
      );

      geometry.applyMatrix4(new THREE.Matrix4().fromArray(transform));
      return geometry;
    }
    
    default:
      return null;
  }
};

const Model = ({ geometries }: { geometries: { id: string; geometry: THREE.BufferGeometry; type: 'mesh' | 'curve' }[] }) => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((_state, delta) => {
      if (groupRef.current) {
        groupRef.current.rotation.y += delta * 0.2;
      }
    });

    return (
        <group ref={groupRef} rotation={[0, 0, 0]}>
            {geometries.map((g, i) => {
                if (g.type === 'mesh') {
                    return (
                        <mesh key={i} geometry={g.geometry} rotation={[-Math.PI / 2, 0, 0]}>
                            <meshStandardMaterial color="#d4a574" metalness={0.2} roughness={0.4} />
                        </mesh>
                    );
                } else {
                    return (
                        <line key={i} geometry={g.geometry} rotation={[-Math.PI / 2, 0, 0]}>
                            <lineBasicMaterial color="#ff6b6b" linewidth={2} />
                        </line>
                    );
                }
            })}
        </group>
    );
};


const Scene = ({ pixelRatio }: { pixelRatio: number }) => {
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

export function PolygonsToolPreview3D({ pixelRatio, diameter }: PolygonsToolPreview3DProps) {
  const [modular, setModular] = useState<Modular | null>(null);
  const [geometries, setGeometries] = useState<{ id: string; geometry: THREE.BufferGeometry; type: 'mesh' | 'curve' }[]>([]);
  const [diameterNodeId, setDiameterNodeId] = useState<string | null>(null);
  const isEvaluatingRef = useRef(false);

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
        modular.loadGraph(JSON.stringify(polygonstoolData.graph));
        
        const nodes = modular.getNodes();
        // Find the node with domain min:80, max:250 (likely diameter/radius parameter)
        // Node ID: "0fc424a7-e71c-48b8-8c8b-696e329aff2c"
        const diameterNode = nodes.find((node: any) => {
          const properties = node.properties;
          const rangeProperty = properties?.find((p: any) => p.name === "range");
          if (rangeProperty && rangeProperty.value?.type === "Vector2d") {
            const [min, max] = rangeProperty.value.content;
            return min === 80 && max === 250;
          }
          return false;
        });
        
        if (diameterNode) {
            setDiameterNodeId(diameterNode.id);
        }

        const result = await modular.evaluate();
        
        const { geometryIdentifiers } = result;
        if (!geometryIdentifiers) return;

        const newGeometries: { id: string; geometry: THREE.BufferGeometry; type: 'mesh' | 'curve' }[] = [];

        for (const id of geometryIdentifiers) {
             const interop = modular.findGeometryInteropById(id);
             const { transform } = id;
             const geometry = convertGeometryInterop(interop, transform);
             if (geometry) {
                 const type = interop?.variant === 'Mesh' ? 'mesh' : 'curve';
                 newGeometries.push({ id: Math.random().toString(), geometry, type });
             }
        }
        setGeometries(newGeometries);
        
      } catch (error) {
        console.error("Error evaluating graph:", error);
      }
    };
    
    loadAndEvaluate();
    
  }, [modular]);

  useEffect(() => {
    if (!modular || !diameterNodeId || isEvaluatingRef.current) return;

    const timeoutId = setTimeout(async () => {
      try {
        isEvaluatingRef.current = true;
        const property = {
            name: "value",
            value: {
              type: "Number" as const,
              content: diameter,
            },
        };
        modular.changeNodeProperty(diameterNodeId, property);
        const result = await modular.evaluate();
        
        const { geometryIdentifiers } = result;
        if (!geometryIdentifiers) return;

        const newGeometries: { id: string; geometry: THREE.BufferGeometry; type: 'mesh' | 'curve' }[] = [];

        for (const id of geometryIdentifiers) {
             const interop = modular.findGeometryInteropById(id);
             const { transform } = id;
             const geometry = convertGeometryInterop(interop, transform);
             if (geometry) {
                 const type = interop?.variant === 'Mesh' ? 'mesh' : 'curve';
                 newGeometries.push({ id: Math.random().toString(), geometry, type });
             }
        }
        setGeometries(newGeometries);
      } catch (error) {
        console.error("Error updating graph:", error);
      } finally {
        isEvaluatingRef.current = false;
      }
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [diameter, modular, diameterNodeId]);

  return (
    <div className="relative w-full h-full bg-[#385130] border-2 border-[#283920] rounded-2xl inner-shadow-2xl">
      <Canvas
        gl={{ antialias: false }}
        camera={{ position: [0, 200, 200], fov: 45 }}
      >
        <OrbitControls makeDefault />
        <Stage intensity={0.5} preset="soft" adjustCamera={1.2}>
           <Model geometries={geometries} />
        </Stage>
        <Scene pixelRatio={pixelRatio} />
      </Canvas>
    </div>
  );
}

