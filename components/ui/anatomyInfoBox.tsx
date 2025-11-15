"use client";

import { useEffect, useState } from "react";

interface AnatomyResponse {
  description: string;
}

export default function AnatomyInfoBox() {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function fetchAnatomyInfo(structureName: string) {
    setLoading(true);
    setText("");

    try {
      const res = await fetch("/api/anatomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structure: structureName }),
      });

      const data: AnatomyResponse = await res.json();
      setText(data.description);
    } catch (err) {
      console.error(err);
      setText("Error retrieving anatomy details.");
    }

    setLoading(false);
  }

  // Global trigger so the camera AR code can call this
  useEffect(() => {
    (window as any).showAnatomyInfo = fetchAnatomyInfo;
  }, []);

  return (
    <div className="absolute bottom-4 right-4 w-80 p-4 bg-white/90 text-black rounded-lg shadow-md border border-gray-200 backdrop-blur">
      <h2 className="font-semibold mb-2 text-lg">Anatomy Details</h2>
      {loading ? (
        <p className="text-gray-500 italic">Loading…</p>
      ) : (
        <p className="text-sm whitespace-pre-line">
          {text || "Select an anatomical structure to learn more."}
        </p>
      )}
    </div>
  );
}
