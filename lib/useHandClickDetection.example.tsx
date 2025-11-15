/**
 * Example usage of useHandClickDetection hook
 * 
 * Integrate this into your existing Three.js overlay component
 */

"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useHandClickDetection } from "./useHandClickDetection";

export function HandOverlayExample() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const handModelRef = useRef<THREE.Group | null>(null);

  // Custom mapping function if your Blender part names don't match the default
  const mapObjectToPartId = (objectName: string): string | null => {
    // Example: Your Blender file might have names like:
    // - "Thumb_Metacarpal_Bone" -> "thumb_metacarpal"
    // - "Index_Finger_Proximal_Phalange" -> "index_proximal"
    
    const lowerName = objectName.toLowerCase();
    
    // Your custom logic here
    // Return the part identifier that matches your API endpoint
    
    if (lowerName.includes("thumb")) {
      if (lowerName.includes("metacarpal")) return "thumb_metacarpal";
      if (lowerName.includes("proximal")) return "thumb_proximal";
      if (lowerName.includes("distal")) return "thumb_distal";
    }
    
    // Add more patterns as needed...
    
    return null; // Return null if not recognized
  };

  // Setup click detection
  const { setupClickDetection } = useHandClickDetection({
    apiEndpoint: "https://your-friend-api.com/api/hand/bone", // Your friend's API endpoint
    mapObjectToPartId, // Optional: use default if not provided
    onPartClick: (partId, partData) => {
      console.log("Part clicked:", partId);
      console.log("Part data:", partData);
      // Handle the part data (e.g., show in UI, highlight, etc.)
    },
    onError: (error) => {
      console.error("Click detection error:", error);
    },
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create scene (your existing code)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Create camera (your existing code)
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Create renderer (your existing code)
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Load your GLB files (your existing code)
    const loader = new GLTFLoader();
    
    // Load multiple GLB files for each part
    // Adjust paths to match your actual GLB file locations
    const glbFiles = [
      "/models/hand/thumb_metacarpal.glb",
      "/models/hand/thumb_proximal.glb",
      "/models/hand/index_proximal.glb",
      // ... add all your part files
    ];

    Promise.all(
      glbFiles.map((path) =>
        loader.loadAsync(path).catch((err) => {
          console.warn(`Failed to load ${path}:`, err);
          return null;
        })
      )
    ).then((gltfs) => {
      gltfs.forEach((gltf) => {
        if (gltf) {
          scene.add(gltf.scene);
          // Store reference to hand model for click detection
          if (!handModelRef.current) {
            handModelRef.current = gltf.scene;
          }
        }
      });

      // Setup click detection after models are loaded
      if (renderer && camera && scene) {
        const cleanup = setupClickDetection(renderer, camera, scene);
        
        // Animation loop (your existing code)
        const animate = () => {
          requestAnimationFrame(animate);
          renderer.render(scene, camera);
        };
        animate();

        // Cleanup on unmount
        return () => {
          cleanup();
          renderer.dispose();
          container.removeChild(renderer.domElement);
        };
      }
    });

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

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setupClickDetection]);

  return <div ref={containerRef} className="w-full h-full" />;
}

