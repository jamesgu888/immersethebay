"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { loadScript } from "@/lib/loadScript";
import AnatomyInfoBox from "@/components/ui/anatomyInfoBox";

const AvatarRig = dynamic(() => import("@/components/AvatarRig"), { ssr: false });

// Bone groupings for labeling (Pose landmarks)
const BODY_PARTS = {
  SKULL: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "LEFT HUMERUS": [11, 13],  // Left shoulder to elbow
  "LEFT RADIUS": [13, 15],   // Left elbow to wrist
  "RIGHT HUMERUS": [12, 14], // Right shoulder to elbow
  "RIGHT RADIUS": [14, 16],  // Right elbow to wrist
  "SPINE": [11, 12, 23, 24], // Torso/spine
  "LEFT FEMUR": [23, 25],    // Left hip to knee
  "LEFT TIBIA": [25, 27],    // Left knee to ankle
  "RIGHT FEMUR": [24, 26],   // Right hip to knee
  "RIGHT TIBIA": [26, 28],   // Right knee to ankle
};

// Extend Window interface for MediaPipe globals
declare global {
  interface Window {
    Holistic?: any;
    Camera?: any;
    drawConnectors?: any;
    drawLandmarks?: any;
    POSE_CONNECTIONS?: any;
    HAND_CONNECTIONS?: any;
    FACEMESH_TESSELATION?: any;
    FACEMESH_RIGHT_EYE?: any;
    FACEMESH_LEFT_EYE?: any;
    FACEMESH_RIGHT_EYEBROW?: any;
    FACEMESH_LEFT_EYEBROW?: any;
    FACEMESH_FACE_OVAL?: any;
    FACEMESH_LIPS?: any;
  }
}

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string>("");
  const [detectedParts, setDetectedParts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const [mediapipeLoaded, setMediapipeLoaded] = useState(false);
  const [currentLandmarks, setCurrentLandmarks] = useState<any>(null);
  const [showMediaPipe, setShowMediaPipe] = useState(true);
  const lastDetectedPartRef = useRef<string | null>(null);

  const onResults = (results: any) => {
    if (!canvasRef.current || !window.drawConnectors || !window.drawLandmarks) return;

    const canvasCtx = canvasRef.current.getContext("2d");
    if (!canvasCtx) return;

    // Clear canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const detected: string[] = [];

    // Only draw if MediaPipe visualization is enabled
    if (showMediaPipe) {
      // Draw face mesh (468 landmarks)
      if (results.faceLandmarks) {
        // Don't add FACE to detected parts - we only track body parts/bones

        // Draw face tesselation (mesh)
        window.drawConnectors(canvasCtx, results.faceLandmarks, window.FACEMESH_TESSELATION, {
          color: "#C0C0C070",
          lineWidth: 1,
        });

        // Draw face contours with more emphasis
        window.drawConnectors(canvasCtx, results.faceLandmarks, window.FACEMESH_RIGHT_EYE, {
          color: "#FF3030",
          lineWidth: 2,
        });
        window.drawConnectors(canvasCtx, results.faceLandmarks, window.FACEMESH_LEFT_EYE, {
          color: "#30FF30",
          lineWidth: 2,
        });
        window.drawConnectors(canvasCtx, results.faceLandmarks, window.FACEMESH_FACE_OVAL, {
          color: "#E0E0E0",
          lineWidth: 2,
        });
        window.drawConnectors(canvasCtx, results.faceLandmarks, window.FACEMESH_LIPS, {
          color: "#FF6090",
          lineWidth: 2,
        });
      }

      // Draw pose landmarks (33 points - body skeleton)
      if (results.poseLandmarks) {
        // Draw connections (skeleton)
        window.drawConnectors(canvasCtx, results.poseLandmarks, window.POSE_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 4,
        });

        // Draw landmarks (joints)
        window.drawLandmarks(canvasCtx, results.poseLandmarks, {
          color: "#FF0000",
          lineWidth: 2,
          radius: 6,
        });

        // Label major body parts
        const canvasWidth = canvasRef.current.width;
        const canvasHeight = canvasRef.current.height;

        Object.entries(BODY_PARTS).forEach(([partName, indices]) => {
          const landmarks = indices
            .map((i) => results.poseLandmarks[i])
            .filter((l: any) => l && l.visibility && l.visibility > 0.5);

          if (landmarks.length > 0) {
            detected.push(partName);

            // Calculate average position for label
            const avgX = landmarks.reduce((sum: number, l: any) => sum + l.x, 0) / landmarks.length;
            const avgY = landmarks.reduce((sum: number, l: any) => sum + l.y, 0) / landmarks.length;

            // Draw label
            canvasCtx.font = "bold 16px Arial";
            canvasCtx.fillStyle = "#FFFF00";
            canvasCtx.strokeStyle = "#000000";
            canvasCtx.lineWidth = 3;
            const text = partName.replace("_", " ");
            const x = avgX * canvasWidth;
            const y = avgY * canvasHeight;

            canvasCtx.strokeText(text, x, y);
            canvasCtx.fillText(text, x, y);
          }
        });
      }

      // Draw left hand landmarks (21 points)
      if (results.leftHandLandmarks) {
        detected.push("LEFT HAND");
        window.drawConnectors(canvasCtx, results.leftHandLandmarks, window.HAND_CONNECTIONS, {
          color: "#CC00FF",
          lineWidth: 3,
        });
        window.drawLandmarks(canvasCtx, results.leftHandLandmarks, {
          color: "#FF00FF",
          lineWidth: 2,
          radius: 4,
        });
      }

      // Draw right hand landmarks (21 points)
      if (results.rightHandLandmarks) {
        detected.push("RIGHT HAND");
        window.drawConnectors(canvasCtx, results.rightHandLandmarks, window.HAND_CONNECTIONS, {
          color: "#00CCFF",
          lineWidth: 3,
        });
        window.drawLandmarks(canvasCtx, results.rightHandLandmarks, {
          color: "#00FFFF",
          lineWidth: 2,
          radius: 4,
        });
      }

      setDetectedParts(detected);
    } else {
      // Still track detected parts even when hidden (only body parts, not face)
      if (results.poseLandmarks) {
        Object.entries(BODY_PARTS).forEach(([partName, indices]) => {
          const landmarks = indices
            .map((i) => results.poseLandmarks[i])
            .filter((l: any) => l && l.visibility && l.visibility > 0.5);
          if (landmarks.length > 0) detected.push(partName);
        });
      }
      if (results.leftHandLandmarks) detected.push("LEFT HAND");
      if (results.rightHandLandmarks) detected.push("RIGHT HAND");
      setDetectedParts(detected);
    }

    // Don't trigger anatomy info from MediaPipe detection
    // Anatomy info is only shown when hovering over bones in the 3D avatar

    setCurrentLandmarks(results);
    canvasCtx.restore();
  };

  // Load MediaPipe scripts on component mount
  useEffect(() => {
    const loadMediaPipe = async () => {
      try {
        await Promise.all([
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"),
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js"),
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"),
          loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js"),
        ]);

        setMediapipeLoaded(true);
      } catch (err) {
        console.error("Error loading MediaPipe scripts:", err);
        setError("Failed to load holistic detection libraries. Please refresh the page.");
      }
    };

    loadMediaPipe();
  }, []);

  const startCamera = async () => {
    try {
      setError("");
      setIsLoading(true);

      if (!mediapipeLoaded) {
        setError("Pose detection is still loading. Please wait a moment and try again.");
        setIsLoading(false);
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: false,
      });

      setStream(mediaStream);
      setIsActive(true);
      setIsLoading(false);
    } catch (err) {
      setError("Failed to access camera. Please make sure you have granted camera permissions.");
      console.error("Error accessing camera:", err);
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsActive(false);
    }
    setDetectedParts([]);
  };

  // Initialize MediaPipe Holistic when camera starts
  useEffect(() => {
    if (isActive && !poseRef.current && mediapipeLoaded && window.Holistic) {
      setIsLoading(true);

      try {
        const holistic = new window.Holistic({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
          },
        });

        holistic.setOptions({
          modelComplexity: 2, // Maximum detail (0=lite, 1=full, 2=heavy)
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          refineFaceLandmarks: true, // Enable detailed face mesh
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        holistic.onResults(onResults);
        poseRef.current = holistic;
        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing holistic:", err);
        setError("Failed to initialize holistic detection. Please refresh the page.");
        setIsLoading(false);
      }
    }
  }, [isActive, mediapipeLoaded]);

  // Connect stream to video element and start pose detection
  useEffect(() => {
    if (stream && videoRef.current && poseRef.current && !cameraRef.current && window.Camera) {
      videoRef.current.srcObject = stream;

      // Wait for video to be ready
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current && canvasRef.current && poseRef.current) {
          // Set canvas size to match video
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;

          // Start MediaPipe camera
          const camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (poseRef.current && videoRef.current) {
                await poseRef.current.send({ image: videoRef.current });
              }
            },
            width: 1280,
            height: 720,
          });

          camera.start();
          cameraRef.current = camera;
        }
      };
    }
  }, [stream, poseRef.current]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (poseRef.current) {
        poseRef.current.close();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <>
      {isActive ? (
        // Fullscreen video mode
        <div className="fixed inset-0 w-full h-full bg-black">
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <canvas
              ref={canvasRef}
              onClick={(e) => {
                if (detectedParts.length > 0) {
                  (window as any).showAnatomyInfo(detectedParts[0]);
                }
              }}
              className="absolute top-0 left-0 w-full h-full"
              style={{
                transform: "scaleX(-1)",
                display: showMediaPipe ? "block" : "none"
              }}
            />

            <AnatomyInfoBox />

            {/* 3D Avatar Rig Overlay */}
            {currentLandmarks && <AvatarRig landmarks={currentLandmarks} />}
          </div>

          {/* Top overlay with title */}
          <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/70 to-transparent">
            <h1 className="text-3xl font-bold text-white">Anatomy Augmentation</h1>
          </div>

          {/* Bottom overlay with controls and detected parts */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex flex-col gap-4 max-w-7xl mx-auto">
              {detectedParts.length > 0 && (
                <div className="bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-white">Detected Body Parts:</h3>
                  <div className="flex flex-wrap gap-2">
                    {detectedParts.map((part) => (
                      <span
                        key={part}
                        className="bg-white/90 text-black px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {part.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 max-w-md mx-auto w-full">
                <Button
                  onClick={() => setShowMediaPipe(!showMediaPipe)}
                  variant={showMediaPipe ? "default" : "outline"}
                  size="lg"
                  className="flex-1"
                >
                  {showMediaPipe ? "Hide" : "Show"} MediaPipe
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="destructive"
                  size="lg"
                  className="flex-1"
                >
                  Stop Camera
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Landing page
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 bg-background">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Anatomy Augmentation</h1>
            <p className="text-muted-foreground">
              Real-time body part detection for anatomical visualization
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg max-w-md">
              {error}
            </div>
          )}

          {!mediapipeLoaded && (
            <div className="text-muted-foreground">
              Loading holistic detection libraries...
            </div>
          )}

          {isLoading && (
            <div className="text-muted-foreground">
              Initializing full-body tracking...
            </div>
          )}

          <Button
            onClick={startCamera}
            size="lg"
            className="px-8"
            disabled={isLoading || !mediapipeLoaded}
          >
            {isLoading ? "Initializing..." : !mediapipeLoaded ? "Loading..." : "Start Full Body Detection"}
          </Button>

          <div className="text-center text-sm text-muted-foreground max-w-md space-y-2">
            <p>
              This app uses MediaPipe Holistic to detect <strong>543 landmarks</strong> in real-time.
            </p>
            <p className="text-xs">
              33 body points + 42 hand points (21 per hand) + 468 face mesh points
            </p>
            <p className="text-xs">
              Detected: HEAD, TORSO, ARMS, LEGS, HANDS, FACE
            </p>
          </div>
        </div>
      )}
    </>
  );
}
