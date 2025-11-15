"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useHandClickDetection } from "@/lib/useHandClickDetection";

// List of all GLB files for the skeleton arm
const GLB_FILES = [
  // Arm bones
  "humerus.glb",
  "radius.glb",
  "ulna.glb",
  
  // Carpals
  "scaphoid.glb",
  "lunate.glb",
  "pisiform + triquetrum.glb",
  "hamate.glb",
  "capitate.glb",
  "trapezoid.glb",
  "trapezium.glb",
  "carpal1.glb",
  "carpal2.glb",
  "carpal3.glb",
  "carpal4.glb",
  
  // Fingers (proximal segments)
  "Thumb_phong.glb",
  "Pointer_phong.glb",
  "Middle_phong.glb",
  "Ring_phong.glb",
  "Pinky_phong.glb",
  
  // Finger segments - Finger 2 (Pointer)
  "FingerSeg2_1.glb",
  "FingerSeg2_2.glb",
  "FingerSeg2_3.glb",
  "FingerSeg2_4.glb",
  "FingerSeg2_5.glb",
  
  // Finger segments - Finger 3 (Middle)
  "FingerSeg3_1.glb",
  "FingerSeg3_2.glb",
  "FingerSeg3_3.glb",
  "FingerSeg3_4.glb",
  "FingerSeg3_5.glb",
];

interface SkeletonArm3DProps {
  apiEndpoint?: string;
  onPartClick?: (partId: string, partData: any) => void;
}

export default function SkeletonArm3D({
  apiEndpoint = "/api/hand/bone", // Update with your friend's API endpoint
  onPartClick,
}: SkeletonArm3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const loadedModelsRef = useRef<THREE.Group[]>([]);
  const rightHandGroupRef = useRef<THREE.Group | null>(null);
  const leftHandGroupRef = useRef<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [partData, setPartData] = useState<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Map GLB file names and object names to part identifiers
  // Also determines if it's left or right hand based on parent group position
  const mapObjectToPartId = (objectName: string, fileName?: string, isLeftHand?: boolean): string | null => {
    if (!objectName && !fileName) return null;
    
    const lowerName = (objectName || fileName || "").toLowerCase();
    const lowerFile = (fileName || "").toLowerCase();
    
    // Use filename if object name is not available or generic
    const searchName = objectName && objectName.toLowerCase() !== "mesh" && objectName.toLowerCase() !== "root" 
      ? lowerName 
      : lowerFile;

    // Determine hand side prefix
    const handPrefix = isLeftHand ? "left_" : "right_";

    // Arm bones
    if (searchName.includes("humerus")) return `${handPrefix}humerus`;
    if (searchName.includes("radius")) return `${handPrefix}radius`;
    if (searchName.includes("ulna")) return `${handPrefix}ulna`;

    // Carpals
    if (searchName.includes("scaphoid")) return `${handPrefix}scaphoid`;
    if (searchName.includes("lunate")) return `${handPrefix}lunate`;
    if (searchName.includes("pisiform") || searchName.includes("triquetrum")) return `${handPrefix}pisiform_triquetrum`;
    if (searchName.includes("hamate")) return `${handPrefix}hamate`;
    if (searchName.includes("capitate")) return `${handPrefix}capitate`;
    if (searchName.includes("trapezoid")) return `${handPrefix}trapezoid`;
    if (searchName.includes("trapezium")) return `${handPrefix}trapezium`;
    
    // Carpals numbered
    if (searchName.includes("carpal1")) return `${handPrefix}carpal1`;
    if (searchName.includes("carpal2")) return `${handPrefix}carpal2`;
    if (searchName.includes("carpal3")) return `${handPrefix}carpal3`;
    if (searchName.includes("carpal4")) return `${handPrefix}carpal4`;

    // Fingers - proximal segments
    if (searchName.includes("thumb_phong") || (searchName.includes("thumb") && searchName.includes("phong"))) return `${handPrefix}thumb_proximal`;
    if (searchName.includes("pointer_phong") || (searchName.includes("pointer") && searchName.includes("phong"))) return `${handPrefix}pointer_proximal`;
    if (searchName.includes("middle_phong") || (searchName.includes("middle") && searchName.includes("phong"))) return `${handPrefix}middle_proximal`;
    if (searchName.includes("ring_phong") || (searchName.includes("ring") && searchName.includes("phong"))) return `${handPrefix}ring_proximal`;
    if (searchName.includes("pinky_phong") || (searchName.includes("pinky") && searchName.includes("phong"))) return `${handPrefix}pinky_proximal`;

    // Finger segments - Finger 2 (Pointer)
    if (searchName.includes("fingerseg2_1")) return `${handPrefix}pointer_segment_1`;
    if (searchName.includes("fingerseg2_2")) return `${handPrefix}pointer_segment_2`;
    if (searchName.includes("fingerseg2_3")) return `${handPrefix}pointer_segment_3`;
    if (searchName.includes("fingerseg2_4")) return `${handPrefix}pointer_segment_4`;
    if (searchName.includes("fingerseg2_5")) return `${handPrefix}pointer_segment_5`;

    // Finger segments - Finger 3 (Middle)
    if (searchName.includes("fingerseg3_1")) return `${handPrefix}middle_segment_1`;
    if (searchName.includes("fingerseg3_2")) return `${handPrefix}middle_segment_2`;
    if (searchName.includes("fingerseg3_3")) return `${handPrefix}middle_segment_3`;
    if (searchName.includes("fingerseg3_4")) return `${handPrefix}middle_segment_4`;
    if (searchName.includes("fingerseg3_5")) return `${handPrefix}middle_segment_5`;

    return null;
  };

  // Setup click detection with custom handler that has access to clicked object
  const { setupClickDetection } = useHandClickDetection({
    apiEndpoint,
    mapObjectToPartId: (objectName) => {
      // Check if objectName has hand prefix (from the hook's enhancement)
      let isLeftHand = false;
      let cleanObjectName = objectName;
      
      if (objectName.startsWith("left_")) {
        isLeftHand = true;
        cleanObjectName = objectName.substring(5); // Remove "left_" prefix
      } else if (objectName.startsWith("right_")) {
        cleanObjectName = objectName.substring(6); // Remove "right_" prefix
      }
      
      // Search both groups to find the object and get its filename
      let fileName: string | undefined;
      
      if (isLeftHand && leftHandGroupRef.current) {
        leftHandGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const childName = child.name || "";
            if (childName === cleanObjectName || childName.includes(cleanObjectName)) {
              fileName = child.userData.sourceFile;
            }
          }
        });
      } else if (!isLeftHand && rightHandGroupRef.current) {
        rightHandGroupRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const childName = child.name || "";
            if (childName === cleanObjectName || childName.includes(cleanObjectName)) {
              fileName = child.userData.sourceFile;
            }
          }
        });
      }
      
      // Fallback: search both if not determined
      if (!fileName) {
        if (leftHandGroupRef.current) {
          leftHandGroupRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh && (child.name === cleanObjectName || child.name.includes(cleanObjectName))) {
              if (!fileName) {
                isLeftHand = true;
                fileName = child.userData.sourceFile;
              }
            }
          });
        }
        
        if (!fileName && rightHandGroupRef.current) {
          rightHandGroupRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh && (child.name === cleanObjectName || child.name.includes(cleanObjectName))) {
              if (!fileName) {
                fileName = child.userData.sourceFile;
              }
            }
          });
        }
      }
      
      // Use filename if object name is generic
      const searchName = fileName || cleanObjectName;
      return mapObjectToPartId(cleanObjectName, searchName, isLeftHand);
    },
    onPartClick: (partId, data) => {
      setSelectedPart(partId);
      setPartData(data);
      if (onPartClick) {
        onPartClick(partId, data);
      }
    },
    onError: (err) => {
      setError(err.message);
      console.error("Click detection error:", err);
    },
  });

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-5, 0, 5);
    scene.add(pointLight);

    // Create parent groups for left and right hands
    const rightHandGroup = new THREE.Group();
    rightHandGroup.name = "right_hand";
    rightHandGroup.position.set(3, 0, 0); // Position right hand on the right side
    scene.add(rightHandGroup);
    rightHandGroupRef.current = rightHandGroup;

    const leftHandGroup = new THREE.Group();
    leftHandGroup.name = "left_hand";
    leftHandGroup.position.set(-3, 0, 0); // Position left hand on the left side
    leftHandGroup.scale.x = -1; // Mirror the left hand
    scene.add(leftHandGroup);
    leftHandGroupRef.current = leftHandGroup;

    // Load all GLB files and create duplicates for both hands
    const loader = new GLTFLoader();
    const loadPromises = GLB_FILES.map((filename) => {
      return loader
        .loadAsync(`/models/skeleton_arm/${filename}`)
        .then((gltf) => {
          // Right hand model
          const rightModel = gltf.scene.clone();
          rightModel.name = filename;
          
          // Enable shadows and store metadata for right hand
          rightModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              child.userData.sourceFile = filename;
              child.userData.handSide = "right";
            }
          });

          rightHandGroup.add(rightModel);
          loadedModelsRef.current.push(rightModel);

          // Left hand model (clone and mirror)
          const leftModel = gltf.scene.clone();
          leftModel.name = filename;
          
          // Enable shadows and store metadata for left hand
          leftModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              child.userData.sourceFile = filename;
              child.userData.handSide = "left";
            }
          });

          leftHandGroup.add(leftModel);
          loadedModelsRef.current.push(leftModel);

          return { right: rightModel, left: leftModel };
        })
        .catch((err) => {
          console.warn(`Failed to load ${filename}:`, err);
          return null;
        });
    });

    Promise.all(loadPromises).then((models) => {
      const loadedCount = models.filter((m) => m !== null).length;
      console.log(`Loaded ${loadedCount}/${GLB_FILES.length} models (${loadedCount * 2} total - left and right hands)`);
      
      if (loadedCount === 0) {
        setError("Failed to load any models. Check that GLB files are in /public/models/skeleton_arm/");
        setLoading(false);
        return;
      }

      // Center camera on both hand groups
      const box = new THREE.Box3();
      if (rightHandGroup) box.expandByObject(rightHandGroup);
      if (leftHandGroup) box.expandByObject(leftHandGroup);
      
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.5; // Add padding
      camera.position.set(center.x, center.y, center.z + cameraZ);
      camera.lookAt(center);

      // Setup click detection after models are loaded
      const cleanup = setupClickDetection(renderer, camera, scene);
      
      setLoading(false);

      // Animation loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      // Handle resize
      const handleResize = () => {
        if (!container || !camera || !renderer) return;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };
      window.addEventListener("resize", handleResize);

      // Cleanup
      return () => {
        window.removeEventListener("resize", handleResize);
        cleanup();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    });
  }, [setupClickDetection]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full min-h-[600px]" />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-lg">Loading skeleton arm models...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white p-4 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {selectedPart && (
        <div className="absolute top-4 left-4 bg-blue-500/90 text-white p-4 rounded-lg max-w-md">
          <h3 className="font-bold mb-2">Selected: {selectedPart.replace(/_/g, " ")}</h3>
          {partData && (
            <pre className="text-xs bg-black/50 p-2 rounded mt-2 overflow-auto max-h-60">
              {JSON.stringify(partData, null, 2)}
            </pre>
          )}
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg text-sm">
        <p>Click on any bone or finger part to view details</p>
      </div>
    </div>
  );
}

