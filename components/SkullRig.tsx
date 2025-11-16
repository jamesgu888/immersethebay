"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export default function SkullRig({ faceLandmarks }: { faceLandmarks: any }) {
  const skullRef = useRef<THREE.Group>(null);

  // Load skull model
  const gltf = useGLTF("/skull.glb");
    const scene = gltf.scene || gltf.scenes?.[0];

    console.log("Loaded GLTF:", gltf, "Scene:", scene);


  // Single material for entire skull
  const skullMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "white",
        transparent: false,
        opacity: 1.0,         // Fully opaque
        roughness: 0.9,
        metalness: 0.0,
      }),
    []
  );

  // Apply material to entire skull
  scene.traverse((child: any) => {
    if (child.isMesh) {
      child.material = skullMaterial;
    }
  });

  useFrame(() => {
    if (!faceLandmarks || !skullRef.current) return;

    const lm = faceLandmarks;

    // -------------------------------
    // 1. Convert MediaPipe 2D → 3D space used by your bones
    // -------------------------------
    const map2D = (x: number, y: number) => {
      const aspect = window.innerWidth / window.innerHeight;
      const camDistance = 2;
      const vFOV = (75 * Math.PI) / 180;
      const height = 2 * Math.tan(vFOV / 2) * camDistance;
      const width = height * aspect;

      return new THREE.Vector3(
        -(x - 0.5) * width,
        -(y - 0.5) * height,
        0
      );
    };

    // -------------------------------
    // 2. Find anchor point for the whole skull
    // Use midpoint between nose and jaw → actual head center
    // -------------------------------
    const noseTip = map2D(lm[1].x, lm[1].y);        // Nose tip
    const chinBottom = map2D(lm[152].x, lm[152].y); // Bottom of chin/jaw
    const leftJaw = map2D(lm[234].x, lm[234].y);    // Left jaw point
    const rightJaw = map2D(lm[454].x, lm[454].y);   // Right jaw point

    // Head center is midpoint between nose and chin
    const headCenter = new THREE.Vector3().addVectors(noseTip, chinBottom).multiplyScalar(0.5);

    // -------------------------------
    // 3. Compute head rotation from MediaPipe
    // -------------------------------
    // Calculate face orientation vectors using jaw points
    const jawDir = new THREE.Vector3().subVectors(rightJaw, leftJaw).normalize(); // X-axis (left-right)
    const up = new THREE.Vector3().subVectors(noseTip, chinBottom).normalize(); // Y-axis (up - from jaw to nose)
    const forward = new THREE.Vector3().crossVectors(jawDir, up).normalize(); // Z-axis (forward toward camera)

    // Create rotation matrix with proper basis
    const skullRotation = new THREE.Matrix4();
    skullRotation.makeBasis(jawDir, up, forward);

    // -------------------------------
    // 4. Apply transform to skull
    // -------------------------------
    skullRef.current.position.copy(headCenter);

    // Apply rotation
    skullRef.current.setRotationFromMatrix(skullRotation);
    skullRef.current.rotateY(Math.PI);  // Flip 180 degrees to face camera

    // -------------------------------
    // 5. Scale skull based on jaw width
    // -------------------------------
    const jawWidth = leftJaw.distanceTo(rightJaw);

    const scale = jawWidth * 0.09 ;  // Much smaller scale (5% of previous)
    skullRef.current.scale.setScalar(scale);

    // -------------------------------
    // 6. Vertical offset for proper positioning
    // -------------------------------
    skullRef.current.position.y += scale * 1.5;  // Increased vertical offset to position skull higher
  });

  return <primitive ref={skullRef} object={scene} />;
}

useGLTF.preload("/skull.glb");
