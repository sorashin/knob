import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import init, { Modular } from "nodi-modular";
import polygonstoolData from "../assets/polygonstool.json";
import { OrbitControls, Stage } from "@react-three/drei";

interface PolygonsToolPreview3DProps {
  pixelRatio: number;
  diameter: number;
  polygon: number;
  onGcodeUpdate?: (gcode: string | null) => void;
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
                            <lineBasicMaterial color="#4d7c5a" linewidth={2} />
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

export function PolygonsToolPreview3D({ pixelRatio, diameter, polygon, onGcodeUpdate }: PolygonsToolPreview3DProps) {
  const [modular, setModular] = useState<Modular | null>(null);
  const [geometries, setGeometries] = useState<{ id: string; geometry: THREE.BufferGeometry; type: 'mesh' | 'curve' }[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const diameterNodeIdRef = useRef<string | null>(null);
  const polygonNodeIdRef = useRef<string | null>(null);
  const isEvaluatingRef = useRef(false);
  const onGcodeUpdateRef = useRef(onGcodeUpdate);
  
  // Keep callback ref up to date
  useEffect(() => {
    onGcodeUpdateRef.current = onGcodeUpdate;
  }, [onGcodeUpdate]);

  // Helper to extract gcode
  const extractGcode = (mod: Modular) => {
    try {
      const gcodeNode = mod.getNodes().find((node: any) => node.label === 'gcode');
      if (gcodeNode && onGcodeUpdateRef.current) {
        const gcodeOutput = mod.getNodeOutput(gcodeNode.id);
        const textGcode = gcodeOutput?.[0]?.get("0")?.[0]?.data;
        
        if (textGcode && typeof textGcode === 'string') {
          onGcodeUpdateRef.current(textGcode);
        }
      }
    } catch (error) {
      console.error("Error processing gcode node:", error);
    }
  };

  // Helper to process geometries
  const processGeometries = (mod: Modular, geometryIdentifiers: any[]) => {
    const newGeometries: { id: string; geometry: THREE.BufferGeometry; type: 'mesh' | 'curve' }[] = [];

    for (const id of geometryIdentifiers) {
      const interop = mod.findGeometryInteropById(id);
      const { transform } = id;
      const geometry = convertGeometryInterop(interop, transform);
      if (geometry) {
        const type = interop?.variant === 'Mesh' ? 'mesh' : 'curve';
        newGeometries.push({ id: Math.random().toString(), geometry, type });
      }
    }
    return newGeometries;
  };

  // Initialize modular
  useEffect(() => {
    const initModular = async () => {
      await init({ module_or_path: "/nodi_modular_bg.wasm" });
      const mod = Modular.new();
      setModular(mod);
    };
    initModular();
  }, []);

  // Load graph and initial evaluation
  useEffect(() => {
    if (!modular || isInitialized) return;

    const loadAndEvaluate = async () => {
      try {
        isEvaluatingRef.current = true;
        modular.loadGraph(JSON.stringify(polygonstoolData.graph));
        
        const nodes = modular.getNodes();
        
        // Find diameter node (domain min:80, max:250)
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
          diameterNodeIdRef.current = diameterNode.id;
        }

        // Find polygon node (domain min:3, max:16)
        const polygonNode = nodes.find((node: any) => {
          const properties = node.properties;
          const rangeProperty = properties?.find((p: any) => p.name === "range");
          if (rangeProperty && rangeProperty.value?.type === "Vector2d") {
            const [min, max] = rangeProperty.value.content;
            return min === 3 && max === 16;
          }
          return false;
        });
        
        if (polygonNode) {
          polygonNodeIdRef.current = polygonNode.id;
        }

        const result = await modular.evaluate();
        
        const { geometryIdentifiers } = result;
        if (geometryIdentifiers) {
          setGeometries(processGeometries(modular, geometryIdentifiers));
          extractGcode(modular);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error evaluating graph:", error);
      } finally {
        isEvaluatingRef.current = false;
      }
    };
    
    loadAndEvaluate();
  }, [modular, isInitialized]);

  // Update parameters
  useEffect(() => {
    if (!modular || !isInitialized || isEvaluatingRef.current) return;
    if (!diameterNodeIdRef.current && !polygonNodeIdRef.current) return;

    const timeoutId = setTimeout(async () => {
      if (isEvaluatingRef.current) return;
      
      try {
        isEvaluatingRef.current = true;
        
        // Update diameter
        if (diameterNodeIdRef.current) {
          modular.changeNodeProperty(diameterNodeIdRef.current, {
            name: "value",
            value: { type: "Number" as const, content: diameter },
          });
        }

        // Update polygon
        if (polygonNodeIdRef.current) {
          modular.changeNodeProperty(polygonNodeIdRef.current, {
            name: "value",
            value: { type: "Number" as const, content: polygon },
          });
        }

        const result = await modular.evaluate();
        
        const { geometryIdentifiers } = result;
        if (geometryIdentifiers) {
          setGeometries(processGeometries(modular, geometryIdentifiers));
          extractGcode(modular);
        }
      } catch (error) {
        console.error("Error updating graph:", error);
      } finally {
        isEvaluatingRef.current = false;
      }
    }, 150); // 150ms debounce

    return () => clearTimeout(timeoutId);
  }, [diameter, polygon, modular, isInitialized]);

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

