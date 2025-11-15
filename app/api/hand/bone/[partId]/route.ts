import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Friend's API endpoint (update this with the actual endpoint)
const FRIEND_API_ENDPOINT = process.env.FRIEND_API_ENDPOINT || "https://api.example.com/hand/bone";
const FRIEND_API_KEY = process.env.FRIEND_API_KEY || process.env.OPENAI_API_KEY;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partId: string }> }
) {
  try {
    const { partId } = await params;

    if (!partId) {
      return NextResponse.json(
        { error: "Part ID is required" },
        { status: 400 }
      );
    }

    // Try to call friend's API first
    try {
      const friendApiUrl = `${FRIEND_API_ENDPOINT}/${partId}`;
      const friendResponse = await fetch(friendApiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${FRIEND_API_KEY || ""}`,
          "X-API-Key": FRIEND_API_KEY || "",
        },
      });

      if (friendResponse.ok) {
        const data = await friendResponse.json();
        return NextResponse.json(data);
      }
    } catch (friendError) {
      console.log("Friend's API not available, using OpenAI fallback");
    }

    // Fallback: Use OpenAI to generate bone information
    const prompt = `You are an expert medical anatomy instructor. Provide detailed information about the following bone/anatomical structure:

Structure: ${partId.replace(/_/g, " ")}

Provide information in JSON format with these fields:
- name: The anatomical name
- location: Where it's located in the body
- function: What it does
- connections: What it connects to
- clinicalNotes: Common injuries or clinical relevance

Be concise but informative.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a highly accurate anatomy expert. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    let boneData;
    
    try {
      boneData = JSON.parse(content || "{}");
    } catch {
      // If JSON parsing fails, return as description
      boneData = {
        name: partId.replace(/_/g, " "),
        description: content,
      };
    }

    return NextResponse.json(boneData);
  } catch (error) {
    console.error("Error fetching bone data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch bone data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

