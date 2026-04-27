import { GoogleGenerativeAI } from "@google/generative-ai";

// Discover the best available Gemini model for this API key via REST.
async function resolveModel(): Promise<{ genAI: GoogleGenerativeAI; modelName: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const PREFERENCE = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest", "gemini-pro"];

  for (const apiVersion of ["v1", "v1beta"]) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`);
      if (!res.ok) continue;
      const data = await res.json();
      const available = (data.models || []).map((m: any) => m.name.split("/").pop());
      for (const p of PREFERENCE) { if (available.includes(p)) return { genAI, modelName: p }; }
    } catch { continue; }
  }
  return { genAI, modelName: "gemini-1.5-flash" }; // Fallback
}

export async function extractCertificateData(file: File) {
  try {
    const { genAI, modelName } = await resolveModel();
    const model = genAI.getGenerativeModel({ model: modelName });

    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    const prompt = `
      Analyze this certificate and extract in JSON:
      {
        "issuer": "string",
        "issue_date": "YYYY-MM-DD",
        "score": number,
        "summary": "string"
      }
      Only return JSON.
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: file.type } },
    ]);

    const text = (await result.response).text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return {
      issuer: "Unknown (Manual Verification Required)",
      issue_date: new Date().toISOString().split('T')[0],
      score: 50.0,
      summary: "Extraction failed"
    };
  }
}
