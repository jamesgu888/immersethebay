# HandModel3D Component

A Three.js-based 3D hand model viewer with click detection for bone/part identification.

## Features

- ✅ Three.js 3D scene with lighting and camera controls
- ✅ GLTF/GLB model loading support
- ✅ Raycasting-based click detection
- ✅ Automatic bone name mapping and identification
- ✅ API endpoint integration for fetching bone data
- ✅ Visual feedback when bones are clicked
- ✅ Responsive design with proper cleanup

## Usage

```tsx
import HandModel3D from "@/components/HandModel3D";

<HandModel3D
  modelPath="/models/hand.glb"
  apiEndpoint="/api/hand/bone"
  onBoneClick={(boneName, boneData) => {
    console.log("Clicked bone:", boneName);
    console.log("Bone data:", boneData);
  }}
/>
```

## Props

- `modelPath` (string, optional): Path to your GLTF/GLB hand model file. Default: `/models/hand.glb`
- `apiEndpoint` (string, optional): Base URL for your API endpoint. Default: `/api/hand/bone`
  - The component will append the bone identifier: `${apiEndpoint}/${boneIdentifier}`
- `onBoneClick` (function, optional): Callback function called when a bone is clicked
  - Parameters: `(boneName: string, boneData: any) => void`

## Bone Identifiers

The component maps common hand bone names to identifiers. Supported bones:

### Thumb
- `thumb_metacarpal`
- `thumb_proximal_phalange`
- `thumb_intermediate_phalange`
- `thumb_distal_phalange`

### Index Finger
- `index_metacarpal`
- `index_proximal_phalange`
- `index_intermediate_phalange`
- `index_distal_phalange`

### Middle Finger
- `middle_metacarpal`
- `middle_proximal_phalange`
- `middle_intermediate_phalange`
- `middle_distal_phalange`

### Ring Finger
- `ring_metacarpal`
- `ring_proximal_phalange`
- `ring_intermediate_phalange`
- `ring_distal_phalange`

### Pinky Finger
- `pinky_metacarpal`
- `pinky_proximal_phalange`
- `pinky_intermediate_phalange`
- `pinky_distal_phalange`

### Wrist/Palm
- `carpal_bones`
- `metacarpals`

## API Endpoint Format

When a bone is clicked, the component will make a GET request to:
```
${apiEndpoint}/${boneIdentifier}
```

For example, if `apiEndpoint="/api/hand/bone"` and you click on the thumb metacarpal, it will call:
```
GET /api/hand/bone/thumb_metacarpal
```

The API should return JSON data with bone information.

## Model Requirements

1. **GLTF/GLB Format**: Your hand model should be in GLTF or GLB format
2. **Named Bones/Meshes**: Each bone or mesh part should have a descriptive name that includes:
   - Finger name (thumb, index, middle, ring, pinky)
   - Bone type (metacarpal, proximal, intermediate, distal, phalange)
   - Alternative names are supported (e.g., "little" for pinky)

3. **Example Bone Names in Model**:
   - `LeftThumb_Metacarpal`
   - `thumb_proximal_phalange`
   - `Index_Finger_Proximal`
   - `MiddleFingerMetacarpal`
   - etc.

## Setup Instructions

1. **Place your 3D model** in the `public/models/` directory (or your public folder)
2. **Update the model path** in your component usage:
   ```tsx
   <HandModel3D modelPath="/models/your-hand-model.glb" />
   ```

3. **Configure your API endpoint**:
   ```tsx
   <HandModel3D apiEndpoint="https://your-api.com/api/hand/bone" />
   ```

4. **If bone names don't match**, you can:
   - Update the `getBoneIdentifier()` function in `HandModel3D.tsx`
   - Add your bone naming patterns to the mapping logic
   - Rename bones in your 3D model to match standard names

## Customization

### Changing the API Request Format

To customize how the API is called, modify the `fetchBoneData` function in `HandModel3D.tsx`:

```tsx
const fetchBoneData = async (boneIdentifier: string) => {
  const response = await fetch(`${apiEndpoint}/${boneIdentifier}`, {
    method: "POST", // Change to POST if needed
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bone: boneIdentifier }), // Add body if needed
  });
  // ...
};
```

### Adding More Bone Mappings

Add entries to the `HAND_BONE_MAPPING` object or extend the `getBoneIdentifier()` function with your specific naming patterns.

### Styling

The component uses Tailwind CSS classes. You can customize:
- Background colors
- Highlight colors (currently green)
- Text colors
- Container sizes

## Example Page

See `/app/hand/page.tsx` for a complete example implementation.

