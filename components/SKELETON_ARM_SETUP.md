# Skeleton Arm 3D Setup

## Overview

The `SkeletonArm3D` component loads all your Blender GLB files and sets up click detection to call your friend's API when parts are clicked.

## File Structure

Your GLB files should be in:
```
public/models/skeleton_arm/
```

## GLB Files Supported

The component recognizes these files:
- **Arm bones**: `humerus.glb`, `radius.glb`, `ulna.glb`
- **Carpals**: `scaphoid.glb`, `lunate.glb`, `pisiform + triquetrum.glb`, `hamate.glb`, `capitate.glb`, `trapezoid.glb`, `trapezium.glb`, `carpal1.glb`, `carpal2.glb`, `carpal3.glb`, `carpal4.glb`
- **Fingers**: `Thumb_phong.glb`, `Pointer_phong.glb`, `Middle_phong.glb`, `Ring_phong.glb`, `Pinky_phong.glb`
- **Finger segments**: `FingerSeg2_*.glb` (Pointer), `FingerSeg3_*.glb` (Middle)

## Part Identifier Mapping

When a part is clicked, the component maps the GLB filename to a part identifier that gets sent to your friend's API:

| GLB File | Part ID Sent to API |
|----------|---------------------|
| `humerus.glb` | `humerus` |
| `radius.glb` | `radius` |
| `ulna.glb` | `ulna` |
| `scaphoid.glb` | `scaphoid` |
| `Thumb_phong.glb` | `thumb_proximal` |
| `Pointer_phong.glb` | `pointer_proximal` |
| `FingerSeg2_1.glb` | `pointer_segment_1` |
| `FingerSeg3_1.glb` | `middle_segment_1` |
| etc. | etc. |

## Usage

### Basic Usage

```tsx
import SkeletonArm3D from "@/components/SkeletonArm3D";

<SkeletonArm3D
  apiEndpoint="https://your-friend-api.com/api/hand/bone"
  onPartClick={(partId, partData) => {
    console.log("Clicked:", partId);
    console.log("Data:", partData);
  }}
/>
```

### API Endpoint Format

When you click on a part, the component makes a GET request:
```
GET ${apiEndpoint}/${partId}
```

For example:
- Clicking on `humerus.glb` → `GET /api/hand/bone/humerus`
- Clicking on `Thumb_phong.glb` → `GET /api/hand/bone/thumb_proximal`
- Clicking on `FingerSeg2_3.glb` → `GET /api/hand/bone/pointer_segment_3`

## Setup Steps

1. **Copy GLB files to public folder**:
   ```bash
   mkdir -p public/models/skeleton_arm
   cp "/path/to/skeleton_arm parts"/*.glb public/models/skeleton_arm/
   ```

2. **Update API endpoint** in `components/SkeletonArm3D.tsx` or pass it as a prop:
   ```tsx
   <SkeletonArm3D apiEndpoint="https://your-friend-api.com/api/hand/bone" />
   ```

3. **Use the component** in a page:
   ```tsx
   // app/skeleton/page.tsx
   import SkeletonArm3D from "@/components/SkeletonArm3D";
   
   export default function SkeletonPage() {
     return <SkeletonArm3D />;
   }
   ```

## Customizing Part ID Mapping

If your friend's API expects different part identifiers, modify the `mapObjectToPartId` function in `SkeletonArm3D.tsx`. For example:

```tsx
// Change this line:
if (searchName.includes("thumb_phong")) return "thumb_proximal";

// To:
if (searchName.includes("thumb_phong")) return "thumb";
```

## Testing

1. Navigate to `/skeleton` in your app
2. Click on different bones/parts
3. Check the console for logged part IDs and API responses
4. The selected part and data will display in the top-left corner

## Troubleshooting

**Models not loading?**
- Verify GLB files are in `public/models/skeleton_arm/`
- Check browser console for loading errors
- Ensure file names match exactly (case-sensitive)

**Clicks not working?**
- Check that meshes have proper names in Blender
- Verify the renderer's DOM element is clickable
- Check browser console for raycasting errors

**API calls failing?**
- Verify the API endpoint URL is correct
- Check CORS settings if API is on a different domain
- Check network tab in browser DevTools

