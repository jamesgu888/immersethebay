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

### Real-time Body Detection
- **33 Body Landmarks** - Detects detailed pose landmarks using MediaPipe Pose
- **Body Part Grouping** - Identifies and labels 6 major body regions:
  - HEAD (facial features)
  - TORSO (shoulders and hips)
  - LEFT ARM / RIGHT ARM (shoulder, elbow, wrist, fingers)
  - LEFT LEG / RIGHT LEG (hip, knee, ankle, foot)
- **Visual Overlay** - Green skeleton connections and red joint markers
- **Real-time Labels** - Yellow labels showing detected body parts
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

### MediaPipe Pose Detection
The app uses Google's MediaPipe Pose model to detect 33 3D body landmarks in real-time:

1. **Camera Feed** - Captures video from your webcam
2. **Pose Model** - Processes each frame through MediaPipe Pose
3. **Landmark Detection** - Identifies 33 points on the body (nose, eyes, shoulders, elbows, wrists, hips, knees, ankles, etc.)
4. **Canvas Overlay** - Draws the skeleton and labels on a canvas layer
5. **Body Part Grouping** - Groups landmarks into anatomical regions

### Key Landmarks (33 total)
- **Face**: Nose, eyes, ears, mouth (11 points)
- **Upper Body**: Shoulders, elbows, wrists, fingers (12 points)
- **Lower Body**: Hips, knees, ankles, feet (10 points)

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
- **Performance**: Runs at ~30 FPS on modern devices
- **Model complexity**: Currently set to 1 (balance of speed/accuracy)
  - Change to 0 for faster performance
  - Change to 2 for better accuracy
- **Privacy**: All processing is client-side - no data sent to servers
- **Browser compatibility**: Works on Chrome, Edge, Safari (latest versions)

## Troubleshooting

**Camera not detected?**
- Make sure you've granted camera permissions
- Check that your camera is not being used by another application
- Try refreshing the page

**Pose detection not working?**
- Ensure good lighting
- Stand 3-6 feet from camera
- Make sure your full body is visible in frame

**Performance issues?**
- Lower `modelComplexity` to 0 in Camera.tsx:144
- Reduce video resolution in Camera.tsx:106

Ready to build your anatomy augmentation project! 🏥💪
