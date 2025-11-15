"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Hand bone identifiers mapping
// These correspond to common anatomical bone names in a hand model
const HAND_BONE_MAPPING: Record<string, string> = {
  // Thumb bones
  thumb_metacarpal: "thumb_metacarpal",
  thumb_proximal: "thumb_proximal_phalange",
  thumb_intermediate: "thumb_intermediate_phalange",
  thumb_distal: "thumb_distal_phalange",
  
  // Index finger bones
  index_metacarpal: "index_metacarpal",
  index_proximal: "index_proximal_phalange",
  index_intermediate: "index_intermediate_phalange",
  index_distal: "index_distal_phalange",
  
  // Middle finger bones
  middle_metacarpal: "middle_metacarpal",
  middle_proximal: "middle_proximal_phalange",
  middle_intermediate: "middle_intermediate_phalange",
  middle_distal: "middle_distal_phalange",
  
  // Ring finger bones
  ring_metacarpal: "ring_metacarpal",
  ring_proximal: "ring_proximal_phalange",
  ring_intermediate: "ring_intermediate_phalange",
  ring_distal: "ring_distal_phalange",
  
  // Pinky finger bones
  pinky_metacarpal: "pinky_metacarpal",
  pinky_proximal: "pinky_proximal_phalange",
  pinky_intermediate: "pinky_intermediate_phalange",
  pinky_distal: "pinky_distal_phalange",
  
  // Wrist/Carpal bones
  wrist: "carpal_bones",
  palm: "metacarpals",
};

interface HandModel3DProps {
  modelPath?: string; // Path to GLTF/GLB model file
  apiEndpoint?: string; // API endpoint base URL
  onBoneClick?: (boneName: string, boneData: any) => void; // Optional callback
}

export default function HandModel3D({
  modelPath = "/models/hand.glb", // Default path - update with your model
  apiEndpoint = "/api/hand/bone", // Default endpoint - update with your friend's API
  onBoneClick,
}: HandModel3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const handModelRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const [selectedBone, setSelectedBone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Map bone names from the model to our identifiers
  const getBoneIdentifier = (boneName: string): string | null => {
    const lowerName = boneName.toLowerCase();
    
    // Try exact match first
    if (HAND_BONE_MAPPING[lowerName]) {
      return HAND_BONE_MAPPING[lowerName];
    }
    
    // Try partial matches (handles variations like "LeftThumb_01", "thumb_proximal_phalange", etc.)
    for (const [key, value] of Object.entries(HAND_BONE_MAPPING)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }
    
    // Try common naming patterns
    if (lowerName.includes("thumb")) {
      if (lowerName.includes("metacarpal")) return "thumb_metacarpal";
      if (lowerName.includes("proximal")) return "thumb_proximal_phalange";
      if (lowerName.includes("intermediate") || lowerName.includes("middle")) return "thumb_intermediate_phalange";
      if (lowerName.includes("distal")) return "thumb_distal_phalange";
    }
    
    if (lowerName.includes("index")) {
      if (lowerName.includes("metacarpal")) return "index_metacarpal";
      if (lowerName.includes("proximal")) return "index_proximal_phalange";
      if (lowerName.includes("intermediate") || lowerName.includes("middle")) return "index_intermediate_phalange";
      if (lowerName.includes("distal")) return "index_distal_phalange";
    }
    
    if (lowerName.includes("middle")) {
      if (lowerName.includes("metacarpal")) return "middle_metacarpal";
      if (lowerName.includes("proximal")) return "middle_proximal_phalange";
      if (lowerName.includes("intermediate")) return "middle_intermediate_phalange";
      if (lowerName.includes("distal")) return "middle_distal_phalange";
    }
    
    if (lowerName.includes("ring")) {
      if (lowerName.includes("metacarpal")) return "ring_metacarpal";
      if (lowerName.includes("proximal")) return "ring_proximal_phalange";
      if (lowerName.includes("intermediate")) return "ring_intermediate_phalange";
      if (lowerName.includes("distal")) return "ring_distal_phalange";
    }
    
    if (lowerName.includes("pinky") || lowerName.includes("little")) {
      if (lowerName.includes("metacarpal")) return "pinky_metacarpal";
      if (lowerName.includes("proximal")) return "pinky_proximal_phalange";
      if (lowerName.includes("intermediate")) return "pinky_intermediate_phalange";
      if (lowerName.includes("distal")) return "pinky_distal_phalange";
    }
    
    if (lowerName.includes("carpal") || lowerName.includes("wrist")) return "carpal_bones";
    if (lowerName.includes("palm") || lowerName.includes("metacarpal")) return "metacarpals";
    
    return null;
  };

  // Call API endpoint when a bone is clicked
  const fetchBoneData = async (boneIdentifier: string) => {
    try {
      const endpoint = `${apiEndpoint}/${boneIdentifier}`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Bone data received:", data);
      return data;
    } catch (err) {
      console.error("Error fetching bone data:", err);
      setError(`Failed to fetch bone data: ${err instanceof Error ? err.message : "Unknown error"}`);
      throw err;
    }
  };

  // Handle click detection
  const handleClick = async (event: MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    // Get all meshes in the scene that could be clicked
    const objects: THREE.Object3D[] = [];
    if (handModelRef.current) {
      handModelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          objects.push(child);
        }
      });
    }

    const intersects = raycasterRef.current.intersectObjects(objects, true);

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object;
      
      // Find the bone name - check the object's name or traverse up to find parent bone
      let boneName: string | null = null;
      let currentObject: THREE.Object3D | null = clickedObject;
      
      while (currentObject && !boneName) {
        if (currentObject.name) {
          boneName = getBoneIdentifier(currentObject.name);
          if (boneName) break;
        }
        currentObject = currentObject.parent;
      }

      if (boneName) {
        setSelectedBone(boneName);
        
        try {
          const boneData = await fetchBoneData(boneName);
          
          // Call optional callback
          if (onBoneClick) {
            onBoneClick(boneName, boneData);
          }
          
          // Visual feedback: highlight the clicked bone
          highlightBone(clickedObject);
        } catch (err) {
          // Error already logged in fetchBoneData
        }
      } else {
        console.warn("Clicked object found but bone identifier not recognized:", clickedObject.name);
      }
    }
  };

  // Visual feedback when a bone is clicked
  const highlightBone = (object: THREE.Object3D) => {
    if (!handModelRef.current) return;

    // Reset all highlights first
    handModelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.userData.originalMaterial) {
          child.material = child.userData.originalMaterial;
        }
      }
    });

    // Highlight clicked bone
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!child.userData.originalMaterial) {
          child.userData.originalMaterial = child.material;
        }
        child.material = new THREE.MeshStandardMaterial({
          color: 0x00ff00, // Green highlight
          emissive: 0x004400,
          metalness: 0.8,
          roughness: 0.2,
        });

        // Reset highlight after 1 second
        setTimeout(() => {
          if (child.userData.originalMaterial) {
            child.material = child.userData.originalMaterial;
          }
        }, 1000);
      }
    });
  };

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
    camera.position.set(0, 0, 5);
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

    // Load hand model
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        const handModel = gltf.scene;
        handModel.scale.set(1, 1, 1);
        handModel.position.set(0, 0, 0);
        
        // Enable shadows on all meshes
        handModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(handModel);
        handModelRef.current = handModel;
        
        // Center camera on model
        const box = new THREE.Box3().setFromObject(handModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5; // Add some padding
        camera.position.set(center.x, center.y, center.z + cameraZ);
        camera.lookAt(center);
        
        setLoading(false);
      },
      undefined,
      (error) => {
        console.error("Error loading hand model:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError(`Failed to load 3D model: ${errorMessage}`);
        setLoading(false);
      }
    );

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      if (handModelRef.current) {
        // Optional: Add subtle rotation
        // handModelRef.current.rotation.y += 0.005;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Add click event listener
    container.addEventListener("click", handleClick);

    // Handle window resize
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
      container.removeEventListener("click", handleClick);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Dispose of resources
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
      container.removeChild(renderer.domElement);
    };
  }, [modelPath]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full min-h-[600px]" />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white">Loading 3D model...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white p-4 rounded-lg">
          <strong>Error:</strong> {error}
          <p className="text-sm mt-2">
            Make sure the model file exists at: {modelPath}
          </p>
        </div>
      )}
      
      {selectedBone && !error && (
        <div className="absolute top-4 left-4 bg-blue-500/90 text-white p-4 rounded-lg">
          Selected: {selectedBone.replace(/_/g, " ")}
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg text-sm">
        <p>Click on any part of the hand to view bone details</p>
      </div>
    </div>
  );
}

