"use client";

import HandModel3D from "@/components/HandModel3D";
import { useState } from "react";

export default function HandPage() {
  const [boneData, setBoneData] = useState<any>(null);

  const handleBoneClick = (boneName: string, data: any) => {
    console.log("Bone clicked:", boneName);
    setBoneData({ boneName, data });
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 relative">
        <HandModel3D
          modelPath="/models/hand.glb" // Update this path to your actual model
          apiEndpoint="/api/hand/bone" // Update this to your friend's API endpoint
          onBoneClick={handleBoneClick}
        />
      </div>
      
      {boneData && (
        <div className="p-4 bg-gray-900 text-white border-t border-gray-700 max-h-[300px] overflow-y-auto">
          <h3 className="text-lg font-bold mb-2">
            Bone: {boneData.boneName.replace(/_/g, " ")}
          </h3>
          <pre className="text-sm bg-gray-800 p-3 rounded overflow-auto">
            {JSON.stringify(boneData.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

