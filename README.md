# Immerse the Bay - Anatomy Augmentation App

A Next.js web app with real-time body part detection for anatomical visualization, built for your hackathon project.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Beautiful UI components
- **MediaPipe Pose** - Real-time body tracking and pose detection

## Getting Started

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Click "Start Body Detection"** to access your webcam and start detecting body parts

## Features

### Real-time Full Body Detection (543 Landmarks!)
- **MediaPipe Holistic** - Ultra-detailed tracking combining pose, hands, and face
- **33 Body Landmarks** - Full skeleton tracking (shoulders, elbows, wrists, hips, knees, ankles, etc.)
- **42 Hand Landmarks** - Detailed finger tracking (21 points per hand)
- **468 Face Mesh Landmarks** - High-resolution facial feature detection
- **Body Part Grouping** - Identifies and labels major body regions:
  - HEAD (facial features)
  - TORSO (shoulders and hips)
  - LEFT ARM / RIGHT ARM (shoulder, elbow, wrist)
  - LEFT LEG / RIGHT LEG (hip, knee, ankle, foot)
  - LEFT HAND / RIGHT HAND (palm, fingers, thumb)
  - FACE (detailed mesh with eyes, lips, contours)
- **Color-coded Visualization**:
  - Green skeleton (body connections)
  - Red dots (body joints)
  - Magenta (left hand) and Cyan (right hand)
  - Silver face mesh with highlighted eyes and lips
- **Maximum Model Complexity** - Set to level 2 for highest accuracy
- **Detection Feedback** - Live list of successfully detected body parts

### UI/UX
- Clean, modern interface with Shadcn/ui components
- Dark mode support
- Responsive design
- Camera permission handling
- Error messages for troubleshooting
- Mirror view (flipped camera for natural interaction)

## Project Structure

```
immersethebay/
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles with Tailwind
├── components/
│   ├── Camera.tsx       # Main camera + pose detection component
│   └── ui/              # Shadcn UI components (Button)
├── lib/
│   └── utils.ts         # Utility functions
├── types/
│   └── mediapipe.d.ts   # TypeScript declarations for MediaPipe
└── ...config files
```

## How It Works

### MediaPipe Holistic Detection
The app uses Google's MediaPipe Holistic model for ultra-detailed full-body tracking:

1. **Camera Feed** - Captures video from your webcam at 1280x720
2. **Holistic Model** - Processes each frame through MediaPipe Holistic (complexity level 2 - maximum detail)
3. **Multi-Modal Detection** - Simultaneously detects:
   - Body pose (33 landmarks)
   - Hand gestures (21 landmarks per hand)
   - Face mesh (468 landmarks)
4. **Canvas Overlay** - Draws all landmarks and connections on a canvas layer
5. **Real-time Rendering** - Updates at ~30 FPS with smooth landmark tracking

### Landmark Breakdown (543 total)
- **Body Pose**: 33 points (nose, eyes, shoulders, elbows, wrists, hips, knees, ankles, feet)
- **Left Hand**: 21 points (thumb, index, middle, ring, pinky - each with 4 joints + palm)
- **Right Hand**: 21 points (thumb, index, middle, ring, pinky - each with 4 joints + palm)
- **Face Mesh**: 468 points (eyes, eyebrows, nose, lips, face contour, cheeks)

### Visualization
- **Body skeleton** - Green lines connecting joints
- **Body joints** - Red circles at key points
- **Left hand** - Magenta connections and landmarks
- **Right hand** - Cyan connections and landmarks
- **Face mesh** - Silver tesselation with highlighted features (eyes, lips, oval)

## Next Steps for Anatomy Augmentation

This foundation is ready for adding anatomical overlays! Here are suggested enhancements:

### 1. Add Anatomical Layer Toggle
- [ ] Skeletal system overlay
- [ ] Muscular system overlay
- [ ] Circulatory system overlay
- [ ] Nervous system overlay

### 2. 3D Model Integration
- Consider using Three.js or React Three Fiber
- Map detected pose to 3D anatomical models
- Allow rotation and zoom of anatomy layers

### 3. Educational Features
- Click on body parts to show information
- Quiz mode for learning anatomy
- Highlight specific muscles/bones during movements

### 4. Motion Tracking
- Track joint angles for exercise form
- Measure range of motion
- Analyze movement patterns

## Building for Production

```bash
npm run build
npm start
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository on Vercel
3. Vercel will automatically detect Next.js and deploy

## Technical Notes

- **Camera access requires HTTPS** in production (Vercel provides this automatically)
- **Performance**: Runs at ~20-30 FPS on modern devices (543 landmarks is intensive!)
- **Model complexity**: Set to 2 (maximum accuracy and detail)
  - Note: Higher complexity = more accurate but slower
  - For better performance on lower-end devices, change to 1 or 0 in Camera.tsx:244
- **Face refinement**: Enabled for ultra-detailed face mesh (468 points)
- **Privacy**: All processing is client-side - no data sent to servers
- **Browser compatibility**: Works on Chrome, Edge, Safari (latest versions)
- **Model size**: ~10MB total (loaded from CDN on first use, then cached)

## Troubleshooting

**Camera not detected?**
- Make sure you've granted camera permissions
- Check that your camera is not being used by another application
- Try refreshing the page

**Detection not working?**
- Ensure good lighting
- For body tracking: Stand 3-6 feet from camera with full body visible
- For hand tracking: Hold hands in front of camera clearly
- For face tracking: Face the camera directly

**Performance issues?**
- Lower `modelComplexity` from 2 to 1 or 0 in Camera.tsx:244
- Disable face refinement by setting `refineFaceLandmarks: false` in Camera.tsx:248
- Reduce video resolution in Camera.tsx:196

**Hands not detected?**
- Make sure hands are visible and not overlapping
- Try spreading fingers and facing palms toward camera
- Ensure hands are well-lit

Ready to build your anatomy augmentation project! 🏥💪
