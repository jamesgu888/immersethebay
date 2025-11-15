"use client";

import { useEffect, useState, useRef } from "react";

interface AnatomyResponse {
  description: string;
  boneName?: string;
}

export default function AnatomyInfoBox() {
  const [text, setText] = useState<string>("");
  const [boneName, setBoneName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);

  async function fetchAnatomyInfo(structureName: string) {
    // Rate limit: only allow one request per second
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1000) {
      console.log("Rate limited - too soon since last request");
      return;
    }
    lastFetchTimeRef.current = now;

    setLoading(true);
    setText("");
    setBoneName(structureName);

    try {
      const res = await fetch("/api/anatomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structure: structureName }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("API Error:", errorData);
        setText(`Error: ${errorData.error || "Failed to fetch anatomy information"}`);
        setLoading(false);
        return;
      }

      const data: AnatomyResponse = await res.json();
      setText(data.description);
      if (data.boneName) {
        setBoneName(data.boneName);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setText("Error retrieving anatomy details.");
    }

    setLoading(false);
  }

  // Global trigger so the camera AR code can call this
  useEffect(() => {
    (window as any).showAnatomyInfo = fetchAnatomyInfo;
  }, []);

  return (
    <div className="absolute top-20 left-4 w-80 bg-white/90 text-black rounded-lg shadow-md border border-gray-200 backdrop-blur flex flex-col max-h-[calc(100vh-6rem)]">
      <div className="px-4 pt-4 pb-0 border-b border-gray-200 flex-shrink-0">
        <h2 className="font-semibold text-lg">
          {boneName || "Anatomy Information"}
        </h2>
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <p className="text-gray-500 italic">Analyzing bone structure...</p>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-line leading-relaxed">
            {text || "Hover over a bone to learn more."}
          </p>
        )}
      </div>
    </div>
  );
}
