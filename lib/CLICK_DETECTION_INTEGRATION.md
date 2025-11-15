# Click Detection Integration Guide

## Quick Start

If you already have a Three.js overlay with GLB files loaded, here's how to add click detection:

### 1. Import the hook

```tsx
import { useHandClickDetection } from "@/lib/useHandClickDetection";
```

### 2. Initialize click detection in your component

```tsx
const { setupClickDetection } = useHandClickDetection({
  apiEndpoint: "https://your-friend-api.com/api/hand/bone", // Your friend's API URL
  onPartClick: (partId, partData) => {
    // Handle the clicked part data
    console.log("Clicked part:", partId);
    console.log("Part data:", partData);
  },
});
```

### 3. Setup click detection after your scene is ready

```tsx
useEffect(() => {
  // ... your existing scene setup code ...
  
  // After your renderer, camera, and scene are created:
  if (renderer && camera && scene) {
    const cleanup = setupClickDetection(renderer, camera, scene);
    
    return () => {
      cleanup(); // Cleanup on unmount
    };
  }
}, [renderer, camera, scene, setupClickDetection]);
```

## Example Integration

```tsx
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useHandClickDetection } from "@/lib/useHandClickDetection";

export default function YourHandOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Setup click detection
  const { setupClickDetection } = useHandClickDetection({
    apiEndpoint: "https://api.example.com/hand/bone", // Update with your friend's API
    onPartClick: (partId, partData) => {
      // Display part data in your UI
      console.log(`Clicked ${partId}:`, partData);
      // You can set state here to show the data in your overlay
    },
    onError: (error) => {
      console.error("API error:", error);
    },
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // ... your existing Three.js setup ...

    // After loading your GLB files and setting up the scene:
    const cleanup = setupClickDetection(
      rendererRef.current!,
      cameraRef.current!,
      sceneRef.current!
    );

    return () => {
      cleanup();
      // ... your existing cleanup ...
    };
  }, [setupClickDetection]);

  return <div ref={containerRef} className="w-full h-full" />;
}
```

## Custom Part Name Mapping

If your Blender GLB files have custom naming that doesn't match the default patterns, provide a custom mapping function:

```tsx
const { setupClickDetection } = useHandClickDetection({
  apiEndpoint: "https://api.example.com/hand/bone",
  mapObjectToPartId: (objectName) => {
    // Your custom logic here
    // Return the part identifier that matches your API endpoint
    
    // Example: if your Blender files are named like:
    // "Thumb_Metacarpal_Bone_L" -> you might want to return "thumb_metacarpal"
    
    const lowerName = objectName.toLowerCase();
    
    if (lowerName.includes("thumb") && lowerName.includes("metacarpal")) {
      return "thumb_metacarpal";
    }
    
    if (lowerName.includes("index") && lowerName.includes("proximal")) {
      return "index_proximal";
    }
    
    // Add more mappings as needed...
    return null; // Return null if not recognized
  },
  onPartClick: (partId, partData) => {
    console.log(partId, partData);
  },
});
```

## API Endpoint Format

The hook will make a GET request to:
```
${apiEndpoint}/${partId}
```

For example:
- `apiEndpoint: "https://api.example.com/hand/bone"`
- `partId: "thumb_metacarpal"`
- Request: `GET https://api.example.com/hand/bone/thumb_metacarpal`

## Important Notes

1. **GLB File Names**: Make sure each part in your Blender GLB files has a meaningful name. The click detection uses the object's name to determine which part was clicked.

2. **Part Identifiers**: The part identifier sent to your friend's API should match what the API expects. You can customize this with the `mapObjectToPartId` function.

3. **Multiple GLB Files**: If you're loading multiple GLB files (one per part), each should be named appropriately so the hook can identify which part was clicked.

4. **Error Handling**: The `onError` callback will be called if the API request fails. Handle errors appropriately in your UI.

## Testing

You can test click detection by clicking on different parts of your hand model. The console will log which part was clicked and the API response.

If clicks aren't being detected:
- Check that your meshes have proper names in Blender
- Verify that the meshes are being added to the scene
- Ensure the renderer's DOM element is clickable (not covered by other elements)

