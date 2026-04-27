import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function extractCertificateData(file: File) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    const prompt = `
      Analyze this certificate/academic artifact and extract the following information in JSON format:
      {
        "issuer": "string (The organization that issued the certificate)",
        "issue_date": "YYYY-MM-DD (The date of issuance)",
        "score": "number (A calculated weightage/forensic score from 0-100 based on authenticity markers and difficulty)",
        "summary": "string (Short description of the achievement)"
      }
      Only return the JSON object.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Clean JSON string
    const jsonString = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonString);
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
