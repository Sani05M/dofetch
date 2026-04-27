import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Discover the best available Gemini model for this API key via REST.
// Uses the listModels endpoint (no token cost), NOT generateContent.
async function resolveModel(): Promise<{ genAI: GoogleGenerativeAI; modelName: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const genAI = new GoogleGenerativeAI(apiKey);

  // Priority: Gemini 2.x Flash (fast + cheap) > Pro > legacy
  const PREFERENCE = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-pro",
  ];

  for (const apiVersion of ["v1", "v1beta"]) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`
      );
      if (!res.ok) continue;
      const data = await res.json();
      const available: string[] = (data.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m: any) => m.name.split("/").pop() as string);

      for (const p of PREFERENCE) {
        if (available.includes(p)) return { genAI, modelName: p };
      }
      if (available.length > 0) return { genAI, modelName: available[0] };
    } catch {
      continue;
    }
  }
  throw new Error(
    "No Gemini models found. Enable the Generative Language API in your Google Cloud project."
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Pull certificate record from our own registry — NO PDF download needed
    const { data: cert, error: dbErr } = await supabase
      .from("certificates")
      .select("*, profiles!inner(full_name, department, batch, section)")
      .eq("id", id)
      .single();

    if (dbErr || !cert) throw new Error("Certificate not found in registry");

    // 2. Resolve the best available Gemini model (no quota cost — only lists models)
    const { genAI, modelName } = await resolveModel();
    console.log(`[Verify] Using model: ${modelName}`);

    // 3. Send ONLY text metadata (~150 tokens vs ~100k+ for a PDF binary)
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `You are an official credential verification agent for Adamas University's digital registry.

A certificate record has been retrieved from the official university database. 
Evaluate whether this looks like a legitimate academic credential.

REGISTRY DATA:
- Title: ${cert.title}
- Issuer: ${cert.issuer || "Unknown"}
- Certificate Type: ${cert.type || "Unknown"}
- Issue Date: ${cert.issue_date || "Unknown"}
- Student Name: ${cert.profiles?.full_name || "Unknown"}
- Department: ${cert.profiles?.department || "Unknown"}
- Batch: ${cert.profiles?.batch || "Unknown"}
- Current Registry Status: ${cert.status}

EVALUATION CRITERIA:
1. Is the issuer name a plausible institution (not blank or gibberish)?
2. Is the certificate title a recognizable course, achievement, or credential name?
3. Is the issue date logically valid (not in the future, not before 1990)?
4. Does the overall record look like a genuine academic credential from a university?

Respond with ONLY a valid JSON object (no markdown, no code blocks):
{"isAuthentic": boolean, "confidenceScore": number, "reasoning": "string"}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json|```/g, "").trim();
    const auditResult = JSON.parse(responseText);
    console.log(`[Verify] Audit complete:`, auditResult);

    // 4. Persist to registry if verified as authentic
    if (auditResult.isAuthentic && auditResult.confidenceScore > 60) {
      await supabase
        .from("certificates")
        .update({
          status: "approved",
          score: auditResult.confidenceScore,
          extracted_text: {
            ai_reasoning: auditResult.reasoning,
            model_used: modelName,
          },
        })
        .eq("id", id);
    }

    return NextResponse.json({ ...auditResult, modelUsed: modelName });

  } catch (error: any) {
    console.error("[Verify] Error:", error.message);

    if (
      error.message?.includes("429") ||
      error.message?.includes("quota") ||
      error.message?.includes("Too Many Requests")
    ) {
      return NextResponse.json(
        { error: "Gemini API rate limit hit. Please wait 60 seconds and try again." },
        { status: 429 }
      );
    }
    if (error.message?.includes("API key") || error.message?.includes("API_KEY")) {
      return NextResponse.json({ error: "Invalid Gemini API key." }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
