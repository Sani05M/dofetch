import { GoogleGenerativeAI } from "@google/generative-ai";

// Discover the best available Gemini model for this API key via REST.
export async function resolveModel(): Promise<{ genAI: GoogleGenerativeAI; modelName: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const PREFERENCE = ["gemini-flash-lite-latest", "gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash"];

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

/**
 * Executes a Gemini request with automatic retry logic for 429 (Rate Limit) errors.
 * Uses exponential backoff with jitter to maximize success on free-tier keys.
 */
export async function safeGenerateContent(model: any, request: any, retries = 3, delay = 1000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(request);
    } catch (error: any) {
      const isRateLimit = error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("Too Many Requests");
      
      if (isRateLimit && i < retries - 1) {
        const waitTime = delay * Math.pow(2, i) + Math.random() * 1000;
        console.log(`[Gemini] Rate limit hit. Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }
}

export async function extractCertificateData(file: File) {
  try {
    const { genAI, modelName } = await resolveModel();
    const model = genAI.getGenerativeModel({ model: modelName });

    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    const prompt = `
      You are an expert academic credential verifier. Analyze this certificate/document image and extract the following in pure JSON format:
      {
        "title": "string (the name/title of the course, achievement, or certificate)",
        "issuer": "string (the name of the issuing authority/company/institution)",
        "issue_date": "YYYY-MM-DD (extract the issue date, if none found use null)",
        "type": "string (Classify it strictly as one of: 'Academic Artifact', 'Professional Cert', 'Extracurricular', or 'Other')",
        "score": number (Evaluate the authenticity, effort, and value of this certificate and give it a weightage score OUT OF 50. Use strict criteria.),
        "authenticity_reasoning": "string (Explain why you gave this score out of 50. Check for signs of forgery, the reputation of the issuer, and the effort required to obtain it.)"
      }
      Only return valid JSON without Markdown blocks.
    `;

    const result = await safeGenerateContent(model, {
      contents: [{ role: "user", parts: [
        { text: prompt },
        { inlineData: { data: base64Data, mimeType: file.type } }
      ]}],
      generationConfig: {
        temperature: 0,
        topK: 1,
        topP: 1
      }
    });

    const text = (await result.response).text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return {
      issuer: "Unknown (Manual Verification Required)",
      issue_date: new Date().toISOString().split('T')[0],
      score: 0,
      authenticity_reasoning: "AI verification failed. Manual verification required."
    };
  }
}
