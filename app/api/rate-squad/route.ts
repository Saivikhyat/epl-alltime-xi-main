import { NextResponse } from "next/server";

interface Player {
  id: number;
  name: string;
  position: string;
  club: string;
  rating: number;
}

interface SquadRequest {
  squad: (Player | null)[];
}

interface AIResponse {
  rating: number;
  tacticalSummary: string;
  keyStrengths: string[];
}

export async function POST(request: Request) {
  try {
    const body: SquadRequest = await request.json();
    const { squad } = body;

    if (!squad || squad.length !== 11) {
      return NextResponse.json(
        { error: "Squad must contain exactly 11 players" },
        { status: 400 }
      );
    }

    const filledSlots = squad.filter((p): p is Player => p !== null);
    const squadDescription = filledSlots
      .map((p) => `${p.name} (${p.position}, ${p.club})`)
      .join(", ");

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a Premier League football expert. Rate squads based on tactical balance, player quality, and historical performance. Return ONLY valid JSON with no additional text.`,
            },
            {
              role: "user",
              content: `Rate this Premier League All-Time XI squad in a 4-3-3 formation: ${squadDescription}. 

Return a JSON object with exactly these fields:
- "rating": a number out of 10.0 (one decimal place)
- "tacticalSummary": a string (2-3 sentences) analyzing the squad's tactical balance and style
- "keyStrengths": an array of 3-5 strings highlighting the main strengths

Return ONLY the JSON object, no markdown or additional text.`,
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    const responseText = await response.text();
    console.log("API Response Status:", response.status);
    console.log("API Response Body:", responseText);

    if (!response.ok) {
      return NextResponse.json(
        { error: `API error (${response.status}): ${responseText}` },
        { status: 502 }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON from API", raw: responseText },
        { status: 502 }
      );
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No content in API response", data },
        { status: 502 }
      );
    }

    let aiResponse: AIResponse;
    try {
      const parsed = JSON.parse(content);
      aiResponse = {
        rating: Math.min(10.0, Math.max(0, parsed.rating)),
        tacticalSummary: parsed.tacticalSummary || "No summary available.",
        keyStrengths: Array.isArray(parsed.keyStrengths)
          ? parsed.keyStrengths
          : [],
      };
    } catch {
      return NextResponse.json(
        { error: "Invalid AI response format", raw: content },
        { status: 502 }
      );
    }

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error("Rate squad error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
