"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useState, createContext, useContext, useEffect } from "react";

// Props interface
interface AvatarRigProps {
  landmarks: any; // MediaPipe Holistic results
}

// Context for hover state
const HoverContext = createContext<{
  hoveredBone: string | null;
  setHoveredBone: (name: string | null) => void;
}>({
  hoveredBone: null,
  setHoveredBone: () => {},
});

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

// MediaPipe Pose landmark indices (33 points for body)
const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

// Bone that uses pose landmarks instead of hand landmarks
function PoseBone({
  poseLandmarks,
  startIndex,
  endIndex,
  radius = 0.02,
  color = "#FFFFFF",
  name,
}: {
  poseLandmarks: any;
  startIndex: number;
  endIndex: number;
  radius?: number;
  color?: string;
  name?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const shaftRef = useRef<THREE.Mesh>(null);
  const headStartRef = useRef<THREE.Mesh>(null);
  const headEndRef = useRef<THREE.Mesh>(null);
  const { setHoveredBone } = useContext(HoverContext);

  useFrame(() => {
    if (!groupRef.current || !shaftRef.current || !headStartRef.current || !headEndRef.current || !poseLandmarks) return;

    const getPos = (index: number): THREE.Vector3 | null => {
      const lm = poseLandmarks[index];
      if (!lm || (lm.visibility !== undefined && lm.visibility < 0.5)) return null;

      // Direct mapping from MediaPipe normalized coordinates to Three.js NDC
      // Then convert to world space using inverse of projection
      const aspect = window.innerWidth / window.innerHeight;
      const fov = 75;
      const vFOV = (fov * Math.PI) / 180;
      const camDistance = 2;
      const height = 2 * Math.tan(vFOV / 2) * camDistance;
      const width = height * aspect;

      return new THREE.Vector3(
        (lm.x - 0.5) * width * -1,
        (lm.y - 0.5) * height * -1,
        0  // Keep all bones at same depth for perfect alignment with 2D overlay
      );
    };

    const start = getPos(startIndex);
    const end = getPos(endIndex);

    if (!start || !end) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Calculate bone properties
    const boneLength = start.distanceTo(end);
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(end, start);
    const axis = new THREE.Vector3(0, 1, 0);

    // Position and rotate the bone group
    groupRef.current.position.copy(midpoint);
    groupRef.current.quaternion.setFromUnitVectors(axis, direction.clone().normalize());

    // Bone shaft - full length to match landmarks exactly
    shaftRef.current.scale.set(1, boneLength, 1);

    // Bone heads (wider ends) - positioned at both ends (hidden but needed for refs)
    const headSize = radius * 1.8;
    headStartRef.current.position.set(0, -boneLength / 2, 0);
    headStartRef.current.scale.set(headSize, headSize, headSize);

    headEndRef.current.position.set(0, boneLength / 2, 0);
    headEndRef.current.scale.set(headSize, headSize, headSize);
  });

  return (
    <group
      ref={groupRef}
      onPointerEnter={() => name && setHoveredBone(name)}
      onPointerLeave={() => name && setHoveredBone(null)}
    >
      {/* Bone shaft - cylindrical middle section */}
      <mesh ref={shaftRef}>
        <cylinderGeometry args={[radius * 1.2, radius * 1.2, 1, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {/* Bone heads hidden for cleaner arm visualization */}
      <mesh ref={headStartRef} visible={false}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <mesh ref={headEndRef} visible={false}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// Realistic bone with bone heads (epiphysis) and shaft (diaphysis)
function Bone({
  handLandmarks,
  startIndex,
  endIndex,
  radius = 0.008,
  color = "#FFFFFF",
  name,
}: {
  handLandmarks: any;
  startIndex: number;
  endIndex: number;
  radius?: number;
  color?: string;
  name?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const shaftRef = useRef<THREE.Mesh>(null);
  const headStartRef = useRef<THREE.Mesh>(null);
  const headEndRef = useRef<THREE.Mesh>(null);
  const { setHoveredBone } = useContext(HoverContext);

  useFrame(() => {
    if (!groupRef.current || !shaftRef.current || !headStartRef.current || !headEndRef.current || !handLandmarks) return;

    const getPos = (index: number): THREE.Vector3 | null => {
      const lm = handLandmarks[index];
      if (!lm || (lm.visibility !== undefined && lm.visibility < 0.5)) return null;

      const aspect = window.innerWidth / window.innerHeight;
      const fov = 75;
      const vFOV = (fov * Math.PI) / 180;
      const camDistance = 2;
      const height = 2 * Math.tan(vFOV / 2) * camDistance;
      const width = height * aspect;

      return new THREE.Vector3(
        (lm.x - 0.5) * width * -1,
        (lm.y - 0.5) * height * -1,
        0  // Keep all bones at same depth for perfect alignment with 2D overlay
      );
    };

    const start = getPos(startIndex);
    const end = getPos(endIndex);

    if (!start || !end) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Calculate bone properties
    const boneLength = start.distanceTo(end);
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(end, start);
    const axis = new THREE.Vector3(0, 1, 0);

    // Position and rotate the bone group
    groupRef.current.position.copy(midpoint);
    groupRef.current.quaternion.setFromUnitVectors(axis, direction.clone().normalize());

    // Bone shaft (narrower middle part)
    const shaftLength = boneLength * 0.7;
    shaftRef.current.scale.set(1, shaftLength, 1);

    // Bone heads (wider ends) - positioned at both ends
    const headSize = radius * 1.8;
    headStartRef.current.position.set(0, -boneLength / 2, 0);
    headStartRef.current.scale.set(headSize, headSize, headSize);

    headEndRef.current.position.set(0, boneLength / 2, 0);
    headEndRef.current.scale.set(headSize, headSize, headSize);
  });

  return (
    <group
      ref={groupRef}
      onPointerEnter={() => name && setHoveredBone(name)}
      onPointerLeave={() => name && setHoveredBone(null)}
    >
      {/* Bone shaft - cylindrical middle section */}
      <mesh ref={shaftRef}>
        <cylinderGeometry args={[radius * 1.2, radius * 1.2, 1, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {/* Bone head at start (proximal end) */}
      <mesh ref={headStartRef}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {/* Bone head at end (distal end) */}
      <mesh ref={headEndRef}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// Joint sphere at a landmark
function Joint({
  handLandmarks,
  index,
  radius = 0.012,
  color = "#CCCCCC",
}: {
  handLandmarks: any;
  index: number;
  radius?: number;
  color?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current || !handLandmarks) return;

    const aspect = window.innerWidth / window.innerHeight;
    const vFOV = (75 * Math.PI) / 180;
    const camDistance = 2;
    const height = 2 * Math.tan(vFOV / 2) * camDistance;
    const width = height * aspect;

    const lm = handLandmarks[index];
    if (!lm || (lm.visibility !== undefined && lm.visibility < 0.5)) {
      meshRef.current.visible = false;
      return;
    }

    meshRef.current.visible = true;
    meshRef.current.position.set(
      -(lm.x - 0.5) * width,
      -(lm.y - 0.5) * height,
      lm.z * -2
    );
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
    </mesh>
  );
}

// Single hover label that follows the mouse
function HoverLabel() {
  const { hoveredBone } = useContext(HoverContext);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  if (!hoveredBone) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: mousePos.x + 15,
        top: mousePos.y + 15,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        pointerEvents: 'none',
        zIndex: 1000,
        whiteSpace: 'nowrap',
      }}
    >
      {hoveredBone}
    </div>
  );
}

// Label for a bone at a specific position
function BoneLabel({
  handLandmarks,
  index,
  text,
  offset = [0, 0.03, 0],
}: {
  handLandmarks: any;
  index?: number;
  text: string;
  offset?: [number, number, number];
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current || !handLandmarks) return;

    const aspect = window.innerWidth / window.innerHeight;
    const vFOV = (75 * Math.PI) / 180;
    const camDistance = 2;
    const height = 2 * Math.tan(vFOV / 2) * camDistance;
    const width = height * aspect;

    if (index !== undefined) {
      const lm = handLandmarks[index];
      if (!lm || (lm.visibility !== undefined && lm.visibility < 0.5)) {
        groupRef.current.visible = false;
        return;
      }

      groupRef.current.visible = true;
      groupRef.current.position.set(
        -(lm.x - 0.5) * width + offset[0],
        -(lm.y - 0.5) * height + offset[1],
        lm.z * -2 + offset[2]
      );
    }
  });

  return (
    <group ref={groupRef}>
      <Html
        center
        distanceFactor={0.5}
        style={{
          color: "white",
          fontSize: "10px",
          fontWeight: "bold",
          textShadow: "0 0 3px black, 0 0 5px black",
          pointerEvents: "none",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </Html>
    </group>
  );
}

// Label for carpal bones with custom positioning
function CarpalLabel({
  handLandmarks,
  lateralOffset,
  proximityToWrist,
  text,
  offset = [0, 0, 0],
}: {
  handLandmarks: any;
  lateralOffset: number;
  proximityToWrist: number;
  text: string;
  offset?: [number, number, number];
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current || !handLandmarks) return;

    const aspect = window.innerWidth / window.innerHeight;
    const vFOV = (75 * Math.PI) / 180;
    const camDistance = 2;
    const height = 2 * Math.tan(vFOV / 2) * camDistance;
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
    const middleMCP = getPos(HAND_LANDMARKS.MIDDLE_MCP);

    if (!wrist || !middleMCP) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    const palmDirection = new THREE.Vector3().subVectors(middleMCP, wrist);
    const palmRight = new THREE.Vector3(-palmDirection.y, palmDirection.x, 0).normalize();

    const basePos = wrist.clone().add(palmRight.multiplyScalar(lateralOffset * 0.08));
    const towardPalm = palmDirection.clone().multiplyScalar(proximityToWrist * 0.4);
    basePos.add(towardPalm);

    groupRef.current.position.set(
      basePos.x + offset[0],
      basePos.y + offset[1],
      basePos.z + offset[2]
    );
  });

  return (
    <group ref={groupRef}>
      <Html
        center
        distanceFactor={0.5}
        style={{
          color: "#FFD700",
          fontSize: "9px",
          fontWeight: "bold",
          textShadow: "0 0 3px black, 0 0 5px black",
          pointerEvents: "none",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </Html>
    </group>
  );
}

// Metacarpals with calculated base positions connecting to distal carpals
function Metacarpals({ handLandmarks }: { handLandmarks: any }) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef}>
      {/* Thumb Metacarpal - connects to distal carpal at -2.0 (Trapezium) */}
      <MetacarpalBone
        handLandmarks={handLandmarks}
        mcpIndex={HAND_LANDMARKS.THUMB_CMC}
        baseOffset={-2.0}
        radius={0.017}
        color="#FFFFFF"
        name="1st Metacarpal (Thumb) - duplicate bone"
      />
      {/* Index Metacarpal - connects to distal carpal at -0.7 (Trapezoid) */}
      <MetacarpalBone
        handLandmarks={handLandmarks}
        mcpIndex={HAND_LANDMARKS.INDEX_MCP}
        baseOffset={-0.7}
        radius={0.018}
        color="#FFFFFF"
        name="2nd Metacarpal (Index)"
      />
      {/* Middle Metacarpal - connects between carpals at -0.2 (Capitate area) */}
      <MetacarpalBone
        handLandmarks={handLandmarks}
        mcpIndex={HAND_LANDMARKS.MIDDLE_MCP}
        baseOffset={-0.2}
        radius={0.018}
        color="#FFFFFF"
        name="3rd Metacarpal (Middle)"
      />
      {/* Ring Metacarpal - connects to distal carpal at 0.7 (Capitate/Hamate) */}
      <MetacarpalBone
        handLandmarks={handLandmarks}
        mcpIndex={HAND_LANDMARKS.RING_MCP}
        baseOffset={0.7}
        radius={0.018}
        color="#FFFFFF"
        name="4th Metacarpal (Ring)"
      />
      {/* Pinky Metacarpal - connects to distal carpal at 2.0 (Hamate) */}
      <MetacarpalBone
        handLandmarks={handLandmarks}
        mcpIndex={HAND_LANDMARKS.PINKY_MCP}
        baseOffset={2.0}
        radius={0.017}
        color="#FFFFFF"
        name="5th Metacarpal (Pinky)"
      />
    </group>
  );
}

// Individual metacarpal bone with calculated base position at carpal bones
function MetacarpalBone({
  handLandmarks,
  mcpIndex,
  baseOffset,
  radius,
  color,
  name,
}: {
  handLandmarks: any;
  mcpIndex: number;
  baseOffset: number;
  radius: number;
  color: string;
  name?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const shaftRef = useRef<THREE.Mesh>(null);
  const headStartRef = useRef<THREE.Mesh>(null);
  const headEndRef = useRef<THREE.Mesh>(null);
  const { setHoveredBone } = useContext(HoverContext);

  useFrame(() => {
    if (!groupRef.current || !shaftRef.current || !headStartRef.current || !headEndRef.current || !handLandmarks) return;

    const aspect = window.innerWidth / window.innerHeight;
    const vFOV = (75 * Math.PI) / 180;
    const camDistance = 2;
    const height = 2 * Math.tan(vFOV / 2) * camDistance;
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
    const mcp = getPos(mcpIndex);
    const middleMCP = getPos(HAND_LANDMARKS.MIDDLE_MCP);
    const indexMCP = getPos(HAND_LANDMARKS.INDEX_MCP);
    const pinkyMCP = getPos(HAND_LANDMARKS.PINKY_MCP);

    if (!wrist || !mcp || !middleMCP || !indexMCP || !pinkyMCP) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Calculate the palm orientation in 3D space (matching CarpalBone calculation)
    const palmDirection = new THREE.Vector3().subVectors(middleMCP, wrist).normalize();
    const palmWidthVector = new THREE.Vector3().subVectors(pinkyMCP, indexMCP);
    const palmNormal = new THREE.Vector3().crossVectors(palmWidthVector, palmDirection).normalize();
    const palmRight = new THREE.Vector3().crossVectors(palmDirection, palmNormal).normalize();

    // Calculate base position at DISTAL CARPAL ROW (position to connect with distal carpals)
    // Must match distal carpal proximityToWrist = 0.55 exactly
    // palmDirection is already normalized, so we need to scale it by the actual distance
    const palmLength = new THREE.Vector3().subVectors(middleMCP, wrist).length();
    const basePosition = wrist.clone()
      .add(palmRight.clone().multiplyScalar(baseOffset * 0.08))
      .add(palmDirection.clone().multiplyScalar(0.55 * 0.4 * palmLength));

    // Calculate bone properties
    const boneLength = basePosition.distanceTo(mcp);
    const midpoint = new THREE.Vector3().addVectors(basePosition, mcp).multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(mcp, basePosition);
    const axis = new THREE.Vector3(0, 1, 0);

    // Position and rotate the bone group
    groupRef.current.position.copy(midpoint);
    groupRef.current.quaternion.setFromUnitVectors(axis, direction.clone().normalize());

    // Bone shaft
    const shaftLength = boneLength * 0.7;
    shaftRef.current.scale.set(1, shaftLength, 1);

    // Bone heads
    const headSize = radius * 1.8;
    headStartRef.current.position.set(0, -boneLength / 2, 0);
    headStartRef.current.scale.set(headSize, headSize, headSize);

    headEndRef.current.position.set(0, boneLength / 2, 0);
    headEndRef.current.scale.set(headSize, headSize, headSize);
  });

  return (
    <group
      ref={groupRef}
      onPointerEnter={() => name && setHoveredBone(name)}
      onPointerLeave={() => name && setHoveredBone(null)}
    >
      <mesh ref={shaftRef}>
        <cylinderGeometry args={[radius * 1.2, radius * 1.2, 1, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {/* Bone heads hidden on metacarpals to avoid orange spheres at joints */}
      <mesh ref={headStartRef} visible={false}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <mesh ref={headEndRef} visible={false}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// Individual carpal bone with calculated position
function CarpalBone({
  handLandmarks,
  lateralOffset,
  proximityToWrist,
  color,
  name,
}: {
  handLandmarks: any;
  lateralOffset: number; // -1.5 to 1.5 (left to right across wrist)
  proximityToWrist: number; // 0.0 (at wrist) to 1.0 (near metacarpals)
  color: string;
  name?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { setHoveredBone } = useContext(HoverContext);

  useFrame(() => {
    if (!meshRef.current || !handLandmarks) return;

    const aspect = window.innerWidth / window.innerHeight;
    const vFOV = (75 * Math.PI) / 180;
    const camDistance = 2;
    const height = 2 * Math.tan(vFOV / 2) * camDistance;
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
    const middleMCP = getPos(HAND_LANDMARKS.MIDDLE_MCP);
    const ringMCP = getPos(HAND_LANDMARKS.RING_MCP);
    const pinkyMCP = getPos(HAND_LANDMARKS.PINKY_MCP);

    if (!wrist || !indexMCP || !middleMCP || !ringMCP || !pinkyMCP) {
      meshRef.current.visible = false;
      return;
    }

    meshRef.current.visible = true;

    // Calculate the palm orientation in 3D space
    const palmDirection = new THREE.Vector3().subVectors(middleMCP, wrist).normalize();

    // Calculate palm width vector (from index to pinky - flipped to get correct orientation)
    const palmWidthVector = new THREE.Vector3().subVectors(pinkyMCP, indexMCP);

    // Calculate palm normal (perpendicular to palm surface) using cross product
    const palmNormal = new THREE.Vector3().crossVectors(palmWidthVector, palmDirection).normalize();

    // Calculate true palm right vector (perpendicular to both palm direction and normal)
    const palmRight = new THREE.Vector3().crossVectors(palmDirection, palmNormal).normalize();

    // Start at wrist, offset laterally - MUCH MORE SPREAD
    const basePos = wrist.clone().add(palmRight.clone().multiplyScalar(lateralOffset * 0.08));

    // Move toward the palm based on proximity (0 = at wrist, 1 = near metacarpals)
    // palmDirection is normalized, so scale by actual palm length
    const palmLength = new THREE.Vector3().subVectors(middleMCP, wrist).length();
    const towardPalm = palmDirection.clone().multiplyScalar(proximityToWrist * 0.4 * palmLength);
    basePos.add(towardPalm);

    meshRef.current.position.copy(basePos);

    // ROTATION: Orient the carpal bone based on hand orientation in 3D
    // Use the calculated palm basis vectors
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeBasis(palmRight, palmDirection, palmNormal);
    meshRef.current.rotation.setFromRotationMatrix(rotationMatrix);
  });

  return (
    <mesh
      ref={meshRef}
      onPointerEnter={() => name && setHoveredBone(name)}
      onPointerLeave={() => name && setHoveredBone(null)}
    >
      <boxGeometry args={[0.045, 0.035, 0.045]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
    </mesh>
  );
}

// Connection between two carpal bone positions
function CarpalConnection({
  handLandmarks,
  fromOffset,
  fromProximity,
  toOffset,
  toProximity,
}: {
  handLandmarks: any;
  fromOffset: number;
  fromProximity: number;
  toOffset: number;
  toProximity: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current || !handLandmarks) return;

    const aspect = window.innerWidth / window.innerHeight;
    const vFOV = (75 * Math.PI) / 180;
    const camDistance = 2;
    const height = 2 * Math.tan(vFOV / 2) * camDistance;
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
    const middleMCP = getPos(HAND_LANDMARKS.MIDDLE_MCP);
    const indexMCP = getPos(HAND_LANDMARKS.INDEX_MCP);
    const pinkyMCP = getPos(HAND_LANDMARKS.PINKY_MCP);

    if (!wrist || !middleMCP || !indexMCP || !pinkyMCP) {
      meshRef.current.visible = false;
      return;
    }

    meshRef.current.visible = true;

    // Calculate the palm orientation in 3D space (matching CarpalBone calculation)
    const palmDirection = new THREE.Vector3().subVectors(middleMCP, wrist).normalize();
    const palmWidthVector = new THREE.Vector3().subVectors(pinkyMCP, indexMCP);
    const palmNormal = new THREE.Vector3().crossVectors(palmWidthVector, palmDirection).normalize();
    const palmRight = new THREE.Vector3().crossVectors(palmDirection, palmNormal).normalize();

    // Calculate start and end positions with proper 3D scaling
    const palmLength = new THREE.Vector3().subVectors(middleMCP, wrist).length();

    const startPos = wrist.clone()
      .add(palmRight.clone().multiplyScalar(fromOffset * 0.08))
      .add(palmDirection.clone().multiplyScalar(fromProximity * 0.4 * palmLength));

    const endPos = wrist.clone()
      .add(palmRight.clone().multiplyScalar(toOffset * 0.08))
      .add(palmDirection.clone().multiplyScalar(toProximity * 0.4 * palmLength));

    const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
    const distance = startPos.distanceTo(endPos);
    const direction = new THREE.Vector3().subVectors(endPos, startPos);

    meshRef.current.position.copy(midpoint);
    meshRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    meshRef.current.scale.set(1, distance, 1);
  });

  return (
    <mesh ref={meshRef}>
      <cylinderGeometry args={[0.008, 0.008, 1, 8]} />
      <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} />
    </mesh>
  );
}

// Carpal bones (8 small bones at the wrist) - arranged in anatomical rows
// Anatomy: Two rows of 4 bones each, forming a funnel shape from narrow wrist to wide palm
function CarpalBones({ handLandmarks }: { handLandmarks: any }) {
  return (
    <group>
      {/* ===== PROXIMAL ROW (at wrist) - SPREAD OUT MORE ===== */}
      {/* These bones articulate with the radius and ulna of the forearm */}

      {/* SCAPHOID - Boat-shaped bone on thumb side of wrist */}
      <CarpalBone handLandmarks={handLandmarks} lateralOffset={-1.2} proximityToWrist={0.15} color="#FFFFFF" name="Scaphoid" />

      {/* LUNATE - Moon-shaped bone, central-radial side */}
      <CarpalBone handLandmarks={handLandmarks} lateralOffset={-0.5} proximityToWrist={0.15} color="#FFFFFF" name="Lunate" />

      {/* TRIQUETRUM - Triangular bone, central-ulnar side */}
      <CarpalBone handLandmarks={handLandmarks} lateralOffset={0.5} proximityToWrist={0.15} color="#FFFFFF" name="Triquetrum" />

      {/* PISIFORM - Pea-shaped bone on pinky side of wrist */}
      <CarpalBone handLandmarks={handLandmarks} lateralOffset={1.2} proximityToWrist={0.15} color="#FFFFFF" name="Pisiform" />

      {/* Labels for Proximal Row */}
      {/* <CarpalLabel handLandmarks={handLandmarks} lateralOffset={-0.4} proximityToWrist={0.15} text="Scaphoid" offset={[0, -0.03, 0]} />
      <CarpalLabel handLandmarks={handLandmarks} lateralOffset={-0.15} proximityToWrist={0.15} text="Lunate" offset={[0, -0.03, 0]} />
      <CarpalLabel handLandmarks={handLandmarks} lateralOffset={0.15} proximityToWrist={0.15} text="Triquetrum" offset={[0, -0.03, 0]} />
      <CarpalLabel handLandmarks={handLandmarks} lateralOffset={0.4} proximityToWrist={0.15} text="Pisiform" offset={[0, -0.03, 0]} /> */}

      {/* ===== DISTAL ROW (toward palm) - WIDE, spreading out to metacarpals ===== */}
      {/* These bones articulate with the metacarpals */}

      {/* TRAPEZIUM - Articulates with first metacarpal (thumb) */}
      <CarpalBone handLandmarks={handLandmarks} lateralOffset={-2.0} proximityToWrist={0.55} color="#FFFFFF" name="Trapezium" />

      {/* TRAPEZOID - Articulates with second metacarpal (index finger) */}
      <CarpalBone handLandmarks={handLandmarks} lateralOffset={-0.7} proximityToWrist={0.55} color="#FFFFFF" name="Trapezoid" />

      {/* CAPITATE - Largest carpal, articulates with third metacarpal (middle finger) and partially with fourth */}
      <CarpalBone handLandmarks={handLandmarks} lateralOffset={0.7} proximityToWrist={0.55} color="#FFFFFF" name="Capitate" />

      {/* HAMATE - Hook-shaped bone, articulates with fourth and fifth metacarpals (ring and pinky) */}
      <CarpalBone handLandmarks={handLandmarks} lateralOffset={2.0} proximityToWrist={0.55} color="#FFFFFF" name="Hamate" />

      {/* Labels for Distal Row */}
      {/* <CarpalLabel handLandmarks={handLandmarks} lateralOffset={-2.0} proximityToWrist={0.55} text="Trapezium" offset={[0, 0.03, 0]} />
      <CarpalLabel handLandmarks={handLandmarks} lateralOffset={-0.7} proximityToWrist={0.55} text="Trapezoid" offset={[0, 0.03, 0]} />
      <CarpalLabel handLandmarks={handLandmarks} lateralOffset={0.7} proximityToWrist={0.55} text="Capitate" offset={[0, 0.03, 0]} />
      <CarpalLabel handLandmarks={handLandmarks} lateralOffset={2.0} proximityToWrist={0.55} text="Hamate" offset={[0, 0.03, 0]} /> */}

      {/* ===== LIGAMENTOUS CONNECTIONS - fan OUT from narrow wrist to wide palm base ===== */}
      {/* Scaphoid → Trapezium */}
      <CarpalConnection handLandmarks={handLandmarks} fromOffset={-1.2} fromProximity={0.15} toOffset={-2.0} toProximity={0.55} />

      {/* Lunate → Trapezoid */}
      <CarpalConnection handLandmarks={handLandmarks} fromOffset={-0.5} fromProximity={0.15} toOffset={-0.7} toProximity={0.55} />

      {/* Triquetrum → Capitate */}
      <CarpalConnection handLandmarks={handLandmarks} fromOffset={0.5} fromProximity={0.15} toOffset={0.7} toProximity={0.55} />

      {/* Pisiform → Hamate */}
      <CarpalConnection handLandmarks={handLandmarks} fromOffset={1.2} fromProximity={0.15} toOffset={2.0} toProximity={0.55} />
    </group>
  );
}

// Forearm bones (radius and ulna) positioned side by side
function ForearmBones({ landmarks, isLeft = false }: { landmarks: any; isLeft?: boolean }) {
  const poseLandmarks = landmarks?.poseLandmarks;
  const handLandmarks = isLeft ? landmarks?.leftHandLandmarks : landmarks?.rightHandLandmarks;

  const groupRef = useRef<THREE.Group>(null);
  const radiusShaftRef = useRef<THREE.Mesh>(null);
  const ulnaShaftRef = useRef<THREE.Mesh>(null);
  const { setHoveredBone } = useContext(HoverContext);

  useFrame(() => {
    if (!poseLandmarks || !radiusShaftRef.current || !ulnaShaftRef.current) return;

    const aspect = window.innerWidth / window.innerHeight;
    const fov = 75;
    const vFOV = (fov * Math.PI) / 180;
    const camDistance = 2;
    const height = 2 * Math.tan(vFOV / 2) * camDistance;
    const width = height * aspect;

    const getPosePos = (index: number): THREE.Vector3 | null => {
      const lm = poseLandmarks[index];
      if (!lm || (lm.visibility !== undefined && lm.visibility < 0.5)) return null;
      return new THREE.Vector3(
        (lm.x - 0.5) * width * -1,
        (lm.y - 0.5) * height * -1,
        0  // Keep all bones at same depth for perfect alignment with 2D overlay
      );
    };

    const getHandPos = (index: number): THREE.Vector3 | null => {
      if (!handLandmarks) return null;
      const lm = handLandmarks[index];
      if (!lm || (lm.visibility !== undefined && lm.visibility < 0.5)) return null;
      return new THREE.Vector3(
        (lm.x - 0.5) * width * -1,
        (lm.y - 0.5) * height * -1,
        0  // Keep all bones at same depth for perfect alignment with 2D overlay
      );
    };

    const elbowIndex = isLeft ? POSE_LANDMARKS.LEFT_ELBOW : POSE_LANDMARKS.RIGHT_ELBOW;
    const wristIndex = isLeft ? POSE_LANDMARKS.LEFT_WRIST : POSE_LANDMARKS.RIGHT_WRIST;

    const elbow = getPosePos(elbowIndex);
    // Use hand wrist if available, otherwise fall back to pose wrist
    const wrist = getHandPos(HAND_LANDMARKS.WRIST) || getPosePos(wristIndex);

    if (!elbow || !wrist) {
      if (radiusShaftRef.current) radiusShaftRef.current.visible = false;
      if (ulnaShaftRef.current) ulnaShaftRef.current.visible = false;
      return;
    }

    // Calculate perpendicular offset to separate radius and ulna side by side
    const forearmDirection = new THREE.Vector3().subVectors(wrist, elbow).normalize();
    // Create a perpendicular vector (cross with up vector to get side-to-side offset)
    const perpendicular = new THREE.Vector3().crossVectors(forearmDirection, new THREE.Vector3(0, 1, 0)).normalize();
    const offsetDistance = 0.08; // Larger offset to separate the bones side by side

    // Radius on one side (thumb side)
    const radiusElbow = elbow.clone().add(perpendicular.clone().multiplyScalar(-offsetDistance));
    const radiusWrist = wrist.clone().add(perpendicular.clone().multiplyScalar(-offsetDistance));

    // Ulna on the other side (pinky side)
    const ulnaElbow = elbow.clone().add(perpendicular.clone().multiplyScalar(offsetDistance));
    const ulnaWrist = wrist.clone().add(perpendicular.clone().multiplyScalar(offsetDistance));

    // Position and scale radius - full length to match landmarks exactly
    const radiusLength = radiusElbow.distanceTo(radiusWrist);
    const radiusMid = new THREE.Vector3().addVectors(radiusElbow, radiusWrist).multiplyScalar(0.5);
    const radiusDirection = new THREE.Vector3().subVectors(radiusWrist, radiusElbow).normalize();

    radiusShaftRef.current.position.copy(radiusMid);
    radiusShaftRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), radiusDirection);
    radiusShaftRef.current.scale.set(1, radiusLength, 1);
    radiusShaftRef.current.visible = true;

    // Position and scale ulna - full length to match landmarks exactly
    const ulnaLength = ulnaElbow.distanceTo(ulnaWrist);
    const ulnaMid = new THREE.Vector3().addVectors(ulnaElbow, ulnaWrist).multiplyScalar(0.5);
    const ulnaDirection = new THREE.Vector3().subVectors(ulnaWrist, ulnaElbow).normalize();

    ulnaShaftRef.current.position.copy(ulnaMid);
    ulnaShaftRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ulnaDirection);
    ulnaShaftRef.current.scale.set(1, ulnaLength, 1);
    ulnaShaftRef.current.visible = true;
  });

  return (
    <group ref={groupRef}>
      {/* Radius - thumb side */}
      <mesh
        ref={radiusShaftRef}
        onPointerEnter={() => setHoveredBone("Radius (Forearm - Thumb Side)")}
        onPointerLeave={() => setHoveredBone(null)}
      >
        <cylinderGeometry args={[0.012, 0.012, 1, 12]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} />
      </mesh>

      {/* Ulna - pinky side */}
      <mesh
        ref={ulnaShaftRef}
        onPointerEnter={() => setHoveredBone("Ulna (Forearm - Pinky Side)")}
        onPointerLeave={() => setHoveredBone(null)}
      >
        <cylinderGeometry args={[0.012, 0.012, 1, 12]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// Debug joint spheres to visualize landmark positions
function DebugJoint({ poseLandmarks, index, color = "#FF0000" }: { poseLandmarks: any; index: number; color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ camera }) => {
    if (!meshRef.current || !poseLandmarks) return;

    const lm = poseLandmarks[index];
    if (!lm || (lm.visibility !== undefined && lm.visibility < 0.5)) {
      meshRef.current.visible = false;
      return;
    }

    meshRef.current.visible = true;

    // Use the exact same coordinate transformation as PoseBone
    const aspect = window.innerWidth / window.innerHeight;
    const vFOV = (75 * Math.PI) / 180;
    const camDistance = 2;
    const height = 2 * Math.tan(vFOV / 2) * camDistance;
    const width = height * aspect;

    meshRef.current.position.set(
      -(lm.x - 0.5) * width,
      -(lm.y - 0.5) * height,
      lm.z * -2
    );
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.03, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
}

// Arm skeleton (humerus, radius, ulna) - both arms
function ArmSkeleton({ landmarks }: { landmarks: any }) {
  const poseLandmarks = landmarks?.poseLandmarks;

  if (!poseLandmarks) return null;

  return (
    <group>
      {/* ===== RIGHT ARM BONES ===== */}
      {/* HUMERUS - Upper arm bone (shoulder to elbow) */}
      <PoseBone
        poseLandmarks={poseLandmarks}
        startIndex={POSE_LANDMARKS.RIGHT_SHOULDER}
        endIndex={POSE_LANDMARKS.RIGHT_ELBOW}
        radius={0.025}
        color="#FFFFFF"
        name="Right Humerus (Upper Arm)"
      />

      {/* RADIUS & ULNA - Right forearm bones */}
      <ForearmBones landmarks={landmarks} isLeft={false} />

      {/* ===== LEFT ARM BONES ===== */}
      {/* HUMERUS - Upper arm bone (shoulder to elbow) */}
      <PoseBone
        poseLandmarks={poseLandmarks}
        startIndex={POSE_LANDMARKS.LEFT_SHOULDER}
        endIndex={POSE_LANDMARKS.LEFT_ELBOW}
        radius={0.025}
        color="#FFFFFF"
        name="Left Humerus (Upper Arm)"
      />

      {/* RADIUS & ULNA - Left forearm bones */}
      <ForearmBones landmarks={landmarks} isLeft={true} />
    </group>
  );
}

// Hand skeleton using anatomically accurate procedural bones
function HandSkeleton({ landmarks }: { landmarks: any }) {
  const rightHandLandmarks = landmarks?.rightHandLandmarks;
  const leftHandLandmarks = landmarks?.leftHandLandmarks;

  if (!rightHandLandmarks && !leftHandLandmarks) return null;

  return (
    <group>
      {/* ===== RIGHT HAND SKELETON ===== */}
      {rightHandLandmarks && (
        <group>
          {/* ===== CARPAL BONES (8 wrist bones) ===== */}
          <CarpalBones handLandmarks={rightHandLandmarks} />

          {/* ===== METACARPALS (5 palm bones) ===== */}
          {/* These are rendered by a special component that calculates proper base positions */}
          <Metacarpals handLandmarks={rightHandLandmarks} />

          {/* ===== THUMB PHALANGES (2 bones - no middle phalanx) ===== */}
          {/* Proximal Phalanx of Thumb */}
          <Bone
            handLandmarks={rightHandLandmarks}
            startIndex={HAND_LANDMARKS.THUMB_CMC}
            endIndex={HAND_LANDMARKS.THUMB_MCP}
            radius={0.014}
            color="#FFFFFF"
            name="1st Metacarpal (Thumb)"
          />
          <Bone
            handLandmarks={rightHandLandmarks}
            startIndex={HAND_LANDMARKS.THUMB_MCP}
            endIndex={HAND_LANDMARKS.THUMB_IP}
            radius={0.013}
            color="#FFFFFF"
            name="Thumb Proximal Phalanx"
          />
          {/* Distal Phalanx of Thumb */}
          <Bone
            handLandmarks={rightHandLandmarks}
            startIndex={HAND_LANDMARKS.THUMB_IP}
            endIndex={HAND_LANDMARKS.THUMB_TIP}
            radius={0.012}
            color="#FFFFFF"
            name="Thumb Distal Phalanx"
          />

          {/* ===== INDEX FINGER PHALANGES (3 bones) ===== */}
          {/* Proximal Phalanx */}
          <Bone
            handLandmarks={rightHandLandmarks}
            startIndex={HAND_LANDMARKS.INDEX_MCP}
            endIndex={HAND_LANDMARKS.INDEX_PIP}
            radius={0.013}
            color="#FFFFFF"
            name="Index Proximal Phalanx"
          />
          {/* Middle Phalanx */}
          <Bone
            handLandmarks={rightHandLandmarks}
            startIndex={HAND_LANDMARKS.INDEX_PIP}
            endIndex={HAND_LANDMARKS.INDEX_DIP}
            radius={0.011}
            color="#FFFFFF"
            name="Index Middle Phalanx"
          />
          {/* Distal Phalanx */}
          <Bone
            handLandmarks={rightHandLandmarks}
            startIndex={HAND_LANDMARKS.INDEX_DIP}
            endIndex={HAND_LANDMARKS.INDEX_TIP}
            radius={0.010}
            color="#FFFFFF"
            name="Index Distal Phalanx"
          />

          {/* ===== MIDDLE FINGER PHALANGES (3 bones) ===== */}
          {/* Proximal Phalanx */}
          <Bone
            handLandmarks={rightHandLandmarks}
            startIndex={HAND_LANDMARKS.MIDDLE_MCP}
            endIndex={HAND_LANDMARKS.MIDDLE_PIP}
            radius={0.013}
            color="#FFFFFF"
            name="Middle Proximal Phalanx"
          />
          {/* Middle Phalanx */}
          <Bone
            handLandmarks={rightHandLandmarks}
            startIndex={HAND_LANDMARKS.MIDDLE_PIP}
            endIndex={HAND_LANDMARKS.MIDDLE_DIP}
            radius={0.011}
            color="#FFFFFF"
            name="Middle Middle Phalanx"
          />
          {/* Distal Phalanx */}
          <Bone
            handLandmarks={rightHandLandmarks}
            startIndex={HAND_LANDMARKS.MIDDLE_DIP}
            endIndex={HAND_LANDMARKS.MIDDLE_TIP}
            radius={0.010}
            color="#FFFFFF"
            name="Middle Distal Phalanx"
          />

          {/* ===== RING FINGER PHALANGES (3 bones) ===== */}
          {/* Proximal Phalanx */}
          <Bone
            handLandmarks={rightHandLandmarks}
            startIndex={HAND_LANDMARKS.RING_MCP}
            endIndex={HAND_LANDMARKS.RING_PIP}
            radius={0.012}
            color="#FFFFFF"
            name="Ring Proximal Phalanx"
          />
          {/* Middle Phalanx */}
          <Bone
            handLandmarks={rightHandLandmarks}
            startIndex={HAND_LANDMARKS.RING_PIP}
            endIndex={HAND_LANDMARKS.RING_DIP}
            radius={0.010}
            color="#FFFFFF"
            name="Ring Middle Phalanx"
          />
          {/* Distal Phalanx */}
          <Bone
            handLandmarks={rightHandLandmarks}
            startIndex={HAND_LANDMARKS.RING_DIP}
            endIndex={HAND_LANDMARKS.RING_TIP}
            radius={0.009}
            color="#FFFFFF"
            name="Ring Distal Phalanx"
          />

          {/* ===== PINKY FINGER PHALANGES (3 bones) ===== */}
          {/* Proximal Phalanx */}
          <Bone
            handLandmarks={rightHandLandmarks}
            startIndex={HAND_LANDMARKS.PINKY_MCP}
            endIndex={HAND_LANDMARKS.PINKY_PIP}
            radius={0.011}
            color="#FFFFFF"
            name="Pinky Proximal Phalanx"
          />
          {/* Middle Phalanx */}
          <Bone
            handLandmarks={rightHandLandmarks}
            startIndex={HAND_LANDMARKS.PINKY_PIP}
            endIndex={HAND_LANDMARKS.PINKY_DIP}
            radius={0.009}
            color="#FFFFFF"
            name="Pinky Middle Phalanx"
          />
          {/* Distal Phalanx */}
          <Bone
            handLandmarks={rightHandLandmarks}
            startIndex={HAND_LANDMARKS.PINKY_DIP}
            endIndex={HAND_LANDMARKS.PINKY_TIP}
            radius={0.008}
            color="#FFFFFF"
            name="Pinky Distal Phalanx"
          />

          {/* ===== JOINTS (Articulations) - ALL HIDDEN ===== */}
          {/* MCP Joints (Metacarpophalangeal - knuckles) - HIDDEN */}
          {/* <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.THUMB_CMC} radius={0.014} color="#FF6B35" /> */}
          {/* <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.THUMB_MCP} radius={0.013} color="#FF6B35" />
          <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.INDEX_MCP} radius={0.013} color="#FF6B35" />
          <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.MIDDLE_MCP} radius={0.013} color="#FF6B35" />
          <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.RING_MCP} radius={0.013} color="#FF6B35" />
          <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.PINKY_MCP} radius={0.012} color="#FF6B35" /> */}

          {/* PIP Joints (Proximal Interphalangeal) - HIDDEN */}
          {/* <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.THUMB_IP} radius={0.011} color="#FF1744" />
          <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.INDEX_PIP} radius={0.011} color="#FF1744" />
          <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.MIDDLE_PIP} radius={0.011} color="#FF1744" />
          <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.RING_PIP} radius={0.011} color="#FF1744" />
          <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.PINKY_PIP} radius={0.010} color="#FF1744" /> */}

          {/* DIP Joints (Distal Interphalangeal) - HIDDEN */}
          {/* <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.INDEX_DIP} radius={0.009} color="#E040FB" />
          <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.MIDDLE_DIP} radius={0.009} color="#E040FB" />
          <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.RING_DIP} radius={0.009} color="#E040FB" />
          <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.PINKY_DIP} radius={0.008} color="#E040FB" /> */}

          {/* Fingertips - HIDDEN */}
          {/* <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.THUMB_TIP} radius={0.010} color="#00E676" />
          <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.INDEX_TIP} radius={0.009} color="#00E676" />
          <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.MIDDLE_TIP} radius={0.009} color="#00E676" />
          <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.RING_TIP} radius={0.009} color="#00E676" />
          <Joint handLandmarks={rightHandLandmarks} index={HAND_LANDMARKS.PINKY_TIP} radius={0.008} color="#00E676" /> */}

      {/* ===== BONE LABELS ===== */}
      {/* TEMPORARILY HIDDEN
      {/* Metacarpal Labels */}
      {/* <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.THUMB_CMC} text="1st Metacarpal" offset={[-0.05, 0, 0]} />
      <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.INDEX_MCP} text="2nd Metacarpal" offset={[-0.05, -0.02, 0]} />
      <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.MIDDLE_MCP} text="3rd Metacarpal" offset={[0, -0.02, 0]} />
      <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.RING_MCP} text="4th Metacarpal" offset={[0.05, -0.02, 0]} />
      <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.PINKY_MCP} text="5th Metacarpal" offset={[0.05, -0.02, 0]} /> */}

      {/* Thumb Phalanges Labels */}
      {/* <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.THUMB_MCP} text="Thumb Proximal Phalanx" offset={[-0.06, 0, 0]} />
      <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.THUMB_IP} text="Thumb Distal Phalanx" offset={[-0.06, 0, 0]} /> */}

      {/* Index Finger Labels */}
      {/* <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.INDEX_PIP} text="Index Proximal Phalanx" offset={[-0.07, 0, 0]} />
      <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.INDEX_DIP} text="Index Middle Phalanx" offset={[-0.07, 0, 0]} />
      <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.INDEX_TIP} text="Index Distal Phalanx" offset={[-0.07, 0, 0]} /> */}

      {/* Middle Finger Labels */}
      {/* <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.MIDDLE_PIP} text="Middle Proximal Phalanx" offset={[0, 0.02, 0]} />
      <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.MIDDLE_DIP} text="Middle Middle Phalanx" offset={[0, 0.02, 0]} />
      <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.MIDDLE_TIP} text="Middle Distal Phalanx" offset={[0, 0.02, 0]} /> */}

      {/* Ring Finger Labels */}
      {/* <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.RING_PIP} text="Ring Proximal Phalanx" offset={[0.07, 0, 0]} />
      <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.RING_DIP} text="Ring Middle Phalanx" offset={[0.07, 0, 0]} />
      <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.RING_TIP} text="Ring Distal Phalanx" offset={[0.07, 0, 0]} /> */}

      {/* Pinky Finger Labels */}
      {/* <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.PINKY_PIP} text="Pinky Proximal Phalanx" offset={[0.07, 0, 0]} />
      <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.PINKY_DIP} text="Pinky Middle Phalanx" offset={[0.07, 0, 0]} />
      <BoneLabel handLandmarks={handLandmarks} index={HAND_LANDMARKS.PINKY_TIP} text="Pinky Distal Phalanx" offset={[0.07, 0, 0]} /> */}

      {/* Wrist - removed, bases of metacarpals now spread properly */}
        </group>
      )}

      {/* ===== LEFT HAND SKELETON ===== */}
      {leftHandLandmarks && (
        <group>
          {/* ===== CARPAL BONES (8 wrist bones) ===== */}
          <CarpalBones handLandmarks={leftHandLandmarks} />

          {/* ===== METACARPALS (5 palm bones) ===== */}
          <Metacarpals handLandmarks={leftHandLandmarks} />

          {/* ===== THUMB PHALANGES (2 bones - no middle phalanx) ===== */}
          {/* Proximal Phalanx of Thumb */}
          <Bone
            handLandmarks={leftHandLandmarks}
            startIndex={HAND_LANDMARKS.THUMB_CMC}
            endIndex={HAND_LANDMARKS.THUMB_MCP}
            radius={0.014}
            color="#FFFFFF"
            name="1st Metacarpal (Thumb)"
          />
          <Bone
            handLandmarks={leftHandLandmarks}
            startIndex={HAND_LANDMARKS.THUMB_MCP}
            endIndex={HAND_LANDMARKS.THUMB_IP}
            radius={0.013}
            color="#FFFFFF"
            name="Thumb Proximal Phalanx"
          />
          {/* Distal Phalanx of Thumb */}
          <Bone
            handLandmarks={leftHandLandmarks}
            startIndex={HAND_LANDMARKS.THUMB_IP}
            endIndex={HAND_LANDMARKS.THUMB_TIP}
            radius={0.012}
            color="#FFFFFF"
            name="Thumb Distal Phalanx"
          />

          {/* ===== INDEX FINGER PHALANGES (3 bones) ===== */}
          {/* Proximal Phalanx */}
          <Bone
            handLandmarks={leftHandLandmarks}
            startIndex={HAND_LANDMARKS.INDEX_MCP}
            endIndex={HAND_LANDMARKS.INDEX_PIP}
            radius={0.013}
            color="#FFFFFF"
            name="Index Proximal Phalanx"
          />
          {/* Middle Phalanx */}
          <Bone
            handLandmarks={leftHandLandmarks}
            startIndex={HAND_LANDMARKS.INDEX_PIP}
            endIndex={HAND_LANDMARKS.INDEX_DIP}
            radius={0.011}
            color="#FFFFFF"
            name="Index Middle Phalanx"
          />
          {/* Distal Phalanx */}
          <Bone
            handLandmarks={leftHandLandmarks}
            startIndex={HAND_LANDMARKS.INDEX_DIP}
            endIndex={HAND_LANDMARKS.INDEX_TIP}
            radius={0.010}
            color="#FFFFFF"
            name="Index Distal Phalanx"
          />

          {/* ===== MIDDLE FINGER PHALANGES (3 bones) ===== */}
          {/* Proximal Phalanx */}
          <Bone
            handLandmarks={leftHandLandmarks}
            startIndex={HAND_LANDMARKS.MIDDLE_MCP}
            endIndex={HAND_LANDMARKS.MIDDLE_PIP}
            radius={0.013}
            color="#FFFFFF"
            name="Middle Proximal Phalanx"
          />
          {/* Middle Phalanx */}
          <Bone
            handLandmarks={leftHandLandmarks}
            startIndex={HAND_LANDMARKS.MIDDLE_PIP}
            endIndex={HAND_LANDMARKS.MIDDLE_DIP}
            radius={0.011}
            color="#FFFFFF"
            name="Middle Middle Phalanx"
          />
          {/* Distal Phalanx */}
          <Bone
            handLandmarks={leftHandLandmarks}
            startIndex={HAND_LANDMARKS.MIDDLE_DIP}
            endIndex={HAND_LANDMARKS.MIDDLE_TIP}
            radius={0.010}
            color="#FFFFFF"
            name="Middle Distal Phalanx"
          />

          {/* ===== RING FINGER PHALANGES (3 bones) ===== */}
          {/* Proximal Phalanx */}
          <Bone
            handLandmarks={leftHandLandmarks}
            startIndex={HAND_LANDMARKS.RING_MCP}
            endIndex={HAND_LANDMARKS.RING_PIP}
            radius={0.012}
            color="#FFFFFF"
            name="Ring Proximal Phalanx"
          />
          {/* Middle Phalanx */}
          <Bone
            handLandmarks={leftHandLandmarks}
            startIndex={HAND_LANDMARKS.RING_PIP}
            endIndex={HAND_LANDMARKS.RING_DIP}
            radius={0.010}
            color="#FFFFFF"
            name="Ring Middle Phalanx"
          />
          {/* Distal Phalanx */}
          <Bone
            handLandmarks={leftHandLandmarks}
            startIndex={HAND_LANDMARKS.RING_DIP}
            endIndex={HAND_LANDMARKS.RING_TIP}
            radius={0.009}
            color="#FFFFFF"
            name="Ring Distal Phalanx"
          />

          {/* ===== PINKY FINGER PHALANGES (3 bones) ===== */}
          {/* Proximal Phalanx */}
          <Bone
            handLandmarks={leftHandLandmarks}
            startIndex={HAND_LANDMARKS.PINKY_MCP}
            endIndex={HAND_LANDMARKS.PINKY_PIP}
            radius={0.011}
            color="#FFFFFF"
            name="Pinky Proximal Phalanx"
          />
          {/* Middle Phalanx */}
          <Bone
            handLandmarks={leftHandLandmarks}
            startIndex={HAND_LANDMARKS.PINKY_PIP}
            endIndex={HAND_LANDMARKS.PINKY_DIP}
            radius={0.009}
            color="#FFFFFF"
            name="Pinky Middle Phalanx"
          />
          {/* Distal Phalanx */}
          <Bone
            handLandmarks={leftHandLandmarks}
            startIndex={HAND_LANDMARKS.PINKY_DIP}
            endIndex={HAND_LANDMARKS.PINKY_TIP}
            radius={0.008}
            color="#FFFFFF"
            name="Pinky Distal Phalanx"
          />

          {/* ===== JOINTS (Articulations) - ALL HIDDEN ===== */}
          {/* PIP Joints (Proximal Interphalangeal) - HIDDEN */}
          {/* <Joint handLandmarks={leftHandLandmarks} index={HAND_LANDMARKS.THUMB_IP} radius={0.011} color="#FF1744" />
          <Joint handLandmarks={leftHandLandmarks} index={HAND_LANDMARKS.INDEX_PIP} radius={0.011} color="#FF1744" />
          <Joint handLandmarks={leftHandLandmarks} index={HAND_LANDMARKS.MIDDLE_PIP} radius={0.011} color="#FF1744" />
          <Joint handLandmarks={leftHandLandmarks} index={HAND_LANDMARKS.RING_PIP} radius={0.011} color="#FF1744" />
          <Joint handLandmarks={leftHandLandmarks} index={HAND_LANDMARKS.PINKY_PIP} radius={0.010} color="#FF1744" /> */}

          {/* DIP Joints (Distal Interphalangeal) - HIDDEN */}
          {/* <Joint handLandmarks={leftHandLandmarks} index={HAND_LANDMARKS.INDEX_DIP} radius={0.009} color="#E040FB" />
          <Joint handLandmarks={leftHandLandmarks} index={HAND_LANDMARKS.MIDDLE_DIP} radius={0.009} color="#E040FB" />
          <Joint handLandmarks={leftHandLandmarks} index={HAND_LANDMARKS.RING_DIP} radius={0.009} color="#E040FB" />
          <Joint handLandmarks={leftHandLandmarks} index={HAND_LANDMARKS.PINKY_DIP} radius={0.008} color="#E040FB" /> */}

          {/* Fingertips - HIDDEN */}
          {/* <Joint handLandmarks={leftHandLandmarks} index={HAND_LANDMARKS.THUMB_TIP} radius={0.010} color="#00E676" />
          <Joint handLandmarks={leftHandLandmarks} index={HAND_LANDMARKS.INDEX_TIP} radius={0.009} color="#00E676" />
          <Joint handLandmarks={leftHandLandmarks} index={HAND_LANDMARKS.MIDDLE_TIP} radius={0.009} color="#00E676" />
          <Joint handLandmarks={leftHandLandmarks} index={HAND_LANDMARKS.RING_TIP} radius={0.009} color="#00E676" />
          <Joint handLandmarks={leftHandLandmarks} index={HAND_LANDMARKS.PINKY_TIP} radius={0.008} color="#00E676" /> */}

          {/* Wrist - removed, bases of metacarpals now spread properly */}
        </group>
      )}
    </group>
  );
}

// Main canvas wrapper component
export default function AvatarRig({ landmarks }: AvatarRigProps) {
  const [hoveredBone, setHoveredBone] = useState<string | null>(null);

  return (
    <HoverContext.Provider value={{ hoveredBone, setHoveredBone }}>
      <div className="absolute inset-0 pointer-events-none">
        <Canvas
          camera={{
            position: [0, 0, 2],
            fov: 75,
            near: 0.1,
            far: 1000,
          }}
          style={{ width: "100%", height: "100%", pointerEvents: "auto" }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <directionalLight position={[-5, -5, -5]} intensity={0.5} />

          <ArmSkeleton landmarks={landmarks} />
          <HandSkeleton landmarks={landmarks} />
        </Canvas>
        <HoverLabel />
      </div>
    </HoverContext.Provider>
  );
}
