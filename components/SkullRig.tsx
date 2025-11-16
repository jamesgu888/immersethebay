"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export default function SkullRig({ faceLandmarks }: { faceLandmarks: any }) {
  const skullRef = useRef<THREE.Group>(null);

  // Load skull model
  const gltf = useGLTF("/models/skull.glb");
    const scene = gltf.scene || gltf.scenes?.[0];

    console.log("Loaded GLTF:", gltf, "Scene:", scene);


  // Single transparent material for entire skull
  const skullMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "white",
        transparent: true,
        opacity: 0.35,         // ← adjust transparency here
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
    // Use midpoint between ears → actual head center
    // -------------------------------
    const leftEar = map2D(lm[7].x, lm[7].y);
    const rightEar = map2D(lm[8].x, lm[8].y);

    const headCenter = new THREE.Vector3().addVectors(leftEar, rightEar).multiplyScalar(0.5);

    // -------------------------------
    // 3. Compute head rotation from MediaPipe
    // -------------------------------
    const leftEye = map2D(lm[2].x, lm[2].y);
    const rightEye = map2D(lm[5].x, lm[5].y);

    const eyeDir = new THREE.Vector3().subVectors(rightEye, leftEye).normalize(); // yaw
    const noseTip = map2D(lm[0].x, lm[0].y);

    const forward = new THREE.Vector3().subVectors(headCenter, noseTip).normalize(); // pitch

    const up = new THREE.Vector3().crossVectors(eyeDir, forward).normalize();

    const skullRotation = new THREE.Matrix4();
    skullRotation.makeBasis(eyeDir, up, forward);

    // -------------------------------
    // 4. Apply transform to skull
    // -------------------------------
    skullRef.current.position.copy(headCenter);

    // Rotate skull correctly
    skullRef.current.setRotationFromMatrix(skullRotation);

    // -------------------------------
    // 5. Scale skull based on face width
    // -------------------------------
    const faceWidth = leftEar.distanceTo(rightEar);

    const scale = faceWidth * 1.6;  // ← adjust multiplier here if still too big/small
    skullRef.current.scale.setScalar(scale);

    // -------------------------------
    // 6. Vertical offset so skull sits ABOVE eyes
    // -------------------------------
    skullRef.current.position.y += scale * 0.55;
  });

  return <primitive ref={skullRef} object={scene} />;
}

useGLTF.preload("/models/skull.glb");
