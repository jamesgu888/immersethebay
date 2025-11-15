"use client";

import { useState } from "react";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  async function sendMessage() {
    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: input })
    });

    const data = await res.json();
    setResponse(data.reply);
  }

  return (
    <div className="p-4">
      <input
        className="border p-2"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        className="ml-2 p-2 bg-blue-500 text-white"
        onClick={sendMessage}
      >
        Send
      </button>

      <div className="mt-4">{response}</div>
    </div>
  );
}
