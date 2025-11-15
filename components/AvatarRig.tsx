"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Props interface
interface AvatarRigProps {
  landmarks: any; // MediaPipe Holistic results
}

// MediaPipe Hand landmark indices (21 points per hand)
const HAND_LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
};

// GLB bone that positions and rotates to match MediaPipe landmarks
function GLBBone({
  boneMesh,
  handLandmarks,
  startIndex,
  endIndex,
}: {
  boneMesh: THREE.Object3D;
  handLandmarks: any;
  startIndex: number;
  endIndex: number;
}) {
  const cloneRef = useRef<THREE.Object3D | null>(null);
  const boneLength = useRef<number>(0);

  // Create a unique clone for this instance and measure its length once
  useEffect(() => {
    if (!boneMesh) return;

    // Create a fresh clone for this specific bone instance
    const freshClone = boneMesh.clone();
    cloneRef.current = freshClone;

    // Calculate bounding box to find bone length
    const bbox = new THREE.Box3().setFromObject(freshClone);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // Assume bone is oriented along Y axis, so height is the length
    boneLength.current = size.y;
    console.log(`Bone ${boneMesh.name} length: ${boneLength.current}`);
  }, [boneMesh]);

  useFrame(() => {
    if (!cloneRef.current || boneLength.current === 0 || !handLandmarks) return;

    // Calculate positions fresh every frame from landmarks
    const aspect = window.innerWidth / window.innerHeight;
    const vFOV = (75 * Math.PI) / 180;
    const distance = 2;
    const height = 2 * Math.tan(vFOV / 2) * distance;
    const width = height * aspect;

    const getPos = (index: number): THREE.Vector3 | null => {
      const lm = handLandmarks[index];
      if (!lm || (lm.visibility !== undefined && lm.visibility < 0.5)) return null;

      return new THREE.Vector3(
        -(lm.x - 0.5) * width,
        -(lm.y - 0.5) * height,
        lm.z * -2
      );
    };

    const start = getPos(startIndex);
    const end = getPos(endIndex);

    if (!start || !end) return;

    // Calculate direction and distance
    const direction = new THREE.Vector3().subVectors(end, start);
    const dist = direction.length();
    if (dist === 0) return;
    direction.normalize();

    // Rotate to point toward END landmark
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    cloneRef.current.quaternion.copy(quaternion);

    // Scale bone to match the exact distance between landmarks
    const scaleY = dist / boneLength.current;
    cloneRef.current.scale.set(0.05, scaleY, 0.05);

    // Position at midpoint between start and end
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    cloneRef.current.position.copy(midpoint);

    // Debug log
    if (boneMesh.name === "Pointer_phong1_0") {
      console.log(`🦴 ${boneMesh.name}:`, {
        start: start.toArray(),
        end: end.toArray(),
        midpoint: midpoint.toArray(),
        distance: dist.toFixed(3),
        boneLength: boneLength.current.toFixed(3),
        scaleY: scaleY.toFixed(3)
      });
    }
  });

  // Render the cloned mesh if it exists
  if (!cloneRef.current) return null;
  return <primitive object={cloneRef.current} />;
}

// Hand skeleton using GLB bones
function HandSkeletonGLB({ landmarks }: { landmarks: any }) {
  const { scene } = useGLTF("/skeleton_arm.glb");
  const handLandmarks = landmarks?.rightHandLandmarks;
  const boneClones = useRef<Map<string, THREE.Object3D>>(new Map());
  const initialized = useRef(false);

  // Clone bones once on mount
  useEffect(() => {
    if (initialized.current) return;

    // Find all the mesh objects in the GLB
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.name) {
        // Clone each mesh so we can position them independently
        const clone = child.clone();
        boneClones.current.set(child.name, clone);
      }
    });

    console.log("📦 Cloned bone meshes:", Array.from(boneClones.current.keys()));
    initialized.current = true;
  }, [scene]);

  // Debug logging - MUST be before any conditional returns
  useEffect(() => {
    if (!handLandmarks) return;

    // Helper to get 3D position from landmark
    const aspect = window.innerWidth / window.innerHeight;
    const vFOV = (75 * Math.PI) / 180;
    const distance = 2;
    const height = 2 * Math.tan(vFOV / 2) * distance;
    const width = height * aspect;

    const getPos = (index: number): THREE.Vector3 | null => {
      const lm = handLandmarks[index];
      if (!lm || (lm.visibility !== undefined && lm.visibility < 0.5)) return null;

      return new THREE.Vector3(
        -(lm.x - 0.5) * width,
        -(lm.y - 0.5) * height,
        lm.z * -2
      );
    };

    const wrist = getPos(HAND_LANDMARKS.WRIST);
    const indexMCP = getPos(HAND_LANDMARKS.INDEX_MCP);
    const indexPIP = getPos(HAND_LANDMARKS.INDEX_PIP);
    console.log("🖐️ Landmark positions:");
    console.log("  Wrist:", wrist?.toArray());
    console.log("  Index MCP:", indexMCP?.toArray());
    console.log("  Index PIP:", indexPIP?.toArray());
  }, [handLandmarks]);

  if (!handLandmarks) return null;

  // Helper to get 3D position from landmark
  const aspect = window.innerWidth / window.innerHeight;
  const vFOV = (75 * Math.PI) / 180;
  const distance = 2;
  const height = 2 * Math.tan(vFOV / 2) * distance;
  const width = height * aspect;

  const getPos = (index: number): THREE.Vector3 | null => {
    const lm = handLandmarks[index];
    if (!lm || (lm.visibility !== undefined && lm.visibility < 0.5)) return null;

    return new THREE.Vector3(
      -(lm.x - 0.5) * width,
      -(lm.y - 0.5) * height,
      lm.z * -2
    );
  };


  // Map GLB bone names to MediaPipe landmark pairs
  const boneMapping = [
    // Thumb
    { boneName: "Thumb_phong1_0", start: HAND_LANDMARKS.THUMB_CMC, end: HAND_LANDMARKS.THUMB_MCP },
    { boneName: "FingerSeg12_phong1_0", start: HAND_LANDMARKS.THUMB_MCP, end: HAND_LANDMARKS.THUMB_IP },
    { boneName: "FingerSeg3_phong1_0_3", start: HAND_LANDMARKS.THUMB_IP, end: HAND_LANDMARKS.THUMB_TIP },

    // Index/Pointer
    { boneName: "Pointer_phong1_0", start: HAND_LANDMARKS.INDEX_MCP, end: HAND_LANDMARKS.INDEX_PIP },
    { boneName: "FingerSeg2_phong1_0_3", start: HAND_LANDMARKS.INDEX_PIP, end: HAND_LANDMARKS.INDEX_DIP },
    { boneName: "FingerSeg3_phong1_0_4", start: HAND_LANDMARKS.INDEX_DIP, end: HAND_LANDMARKS.INDEX_TIP },

    // Middle
    { boneName: "Middle_phong1_0", start: HAND_LANDMARKS.MIDDLE_MCP, end: HAND_LANDMARKS.MIDDLE_PIP },
    { boneName: "FingerSeg2_phong1_0_2", start: HAND_LANDMARKS.MIDDLE_PIP, end: HAND_LANDMARKS.MIDDLE_DIP },
    { boneName: "FingerSeg3_phong1_0_2", start: HAND_LANDMARKS.MIDDLE_DIP, end: HAND_LANDMARKS.MIDDLE_TIP },

    // Ring
    { boneName: "Ring_phong1_0", start: HAND_LANDMARKS.RING_MCP, end: HAND_LANDMARKS.RING_PIP },
    { boneName: "FingerSeg2_phong1_0_1", start: HAND_LANDMARKS.RING_PIP, end: HAND_LANDMARKS.RING_DIP },
    { boneName: "FingerSeg3_phong1_0_1", start: HAND_LANDMARKS.RING_DIP, end: HAND_LANDMARKS.RING_TIP },

    // Pinky
    { boneName: "Pinky_phong1_0", start: HAND_LANDMARKS.PINKY_MCP, end: HAND_LANDMARKS.PINKY_PIP },
    { boneName: "FingerSeg2_phong1_0", start: HAND_LANDMARKS.PINKY_PIP, end: HAND_LANDMARKS.PINKY_DIP },
    { boneName: "FingerSeg3_phong1_0", start: HAND_LANDMARKS.PINKY_DIP, end: HAND_LANDMARKS.PINKY_TIP },

    // Palm
    { boneName: "Palm_phong1_0", start: HAND_LANDMARKS.WRIST, end: HAND_LANDMARKS.MIDDLE_MCP },

    // Forearm - commented out for now
    // { boneName: "Forearm_phong1_0", start: HAND_LANDMARKS.WRIST, end: HAND_LANDMARKS.WRIST },
  ];

  return (
    <group>
      {/* Debug: Show small spheres at landmark positions */}
      {[HAND_LANDMARKS.WRIST, HAND_LANDMARKS.INDEX_MCP, HAND_LANDMARKS.INDEX_PIP, HAND_LANDMARKS.INDEX_TIP].map((idx) => {
        const pos = getPos(idx);
        if (!pos) return null;
        return (
          <mesh key={`debug-${idx}`} position={pos}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#FF00FF" />
          </mesh>
        );
      })}

      {boneMapping.map(({ boneName, start, end }, index) => {
        const boneMesh = boneClones.current.get(boneName);
        if (!boneMesh) {
          console.warn(`⚠️ Bone mesh not found: ${boneName}`);
          return null;
        }

        return (
          <GLBBone
            key={`glb-bone-${index}`}
            boneMesh={boneMesh}
            handLandmarks={handLandmarks}
            startIndex={start}
            endIndex={end}
          />
        );
      })}
    </group>
  );
}

// Main canvas wrapper component
export default function AvatarRig({ landmarks }: AvatarRigProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{
          position: [0, 0, 2],
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, -5, -5]} intensity={0.5} />

        <HandSkeletonGLB landmarks={landmarks} />
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload("/skeleton_arm.glb");
