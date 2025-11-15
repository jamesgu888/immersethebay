import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  const { structure } = await req.json();

  const prompt = `
You are an expert medical anatomy instructor.
Explain the following anatomical structure clearly and accurately:

Structure: ${structure}

In 5–7 sentences, include:
- Location in the body
- Surrounding structures
- Function
- Physiology
- Clinical relevance (common injuries, pathology)

Use clear language appropriate for students.
  `;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a highly accurate anatomy expert." },
      { role: "user", content: prompt }
    ]
  });

  return Response.json({
    description: completion.choices[0].message.content
  });
}
