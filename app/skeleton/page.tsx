"use client";

import SkeletonArm3D from "@/components/SkeletonArm3D";

export default function SkeletonPage() {
  return (
    <div className="h-screen w-screen">
      <SkeletonArm3D
        apiEndpoint="/api/hand/bone" // Update this with your friend's actual API endpoint
        onPartClick={(partId, partData) => {
          console.log("Part clicked:", partId);
          console.log("Part data:", partData);
          // You can handle the data here - update state, show modal, etc.
        }}
      />
    </div>
  );
}

