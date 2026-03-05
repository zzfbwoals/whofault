export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { plaintiff, defendant } = await request.json();

    if (!plaintiff || !defendant) {
      return new Response(JSON.stringify({ error: "Plaintiff and defendant claims are required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Gemini API Key is not configured." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = `
      You are an "AI Judge" in a humorous court called "The Petty Court" (소소한 재판소).
      Your job is to settle minor disputes between friends or couples with a mix of solemnity and wit.
      
      Plaintiff's Claim: "${plaintiff}"
      Defendant's Claim: "${defendant}"
      
      Please provide a judgment in the following JSON format:
      {
        "winner": "원고" or "피고",
        "title": "A creative and funny title for the crime/case (e.g., '소스 눅눅함 방조죄')",
        "text": "A 3-4 sentence formal yet humorous verdict explanation in Korean.",
        "punishment": "A funny and lighthearted punishment or penalty."
      }
      
      Respond ONLY with the JSON object.
    `;

    // Updated model to gemini-2.5-flash and using X-goog-api-key header
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
        },
      }),
    });

    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error.message || "Gemini API Error");
    }

    const verdict = JSON.parse(data.candidates[0].content.parts[0].text);

    return new Response(JSON.stringify(verdict), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
