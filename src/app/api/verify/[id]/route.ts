import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveModel, safeGenerateContent } from "@/lib/gemini";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Pull certificate record
    const { data: cert, error: dbErr } = await supabase
      .from("certificates")
      .select("*, profiles!inner(full_name, department, batch, section)")
      .eq("id", id)
      .single();

    if (dbErr || !cert) throw new Error("Certificate not found in registry");

    // 2. Resolve model (dynamic selection)
    const { genAI, modelName } = await resolveModel();
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `Evaluate academic credential legitimacy for Adamas University digital registry.
      DATA: ${cert.title}, ${cert.issuer}, ${cert.profiles?.full_name}, ${cert.profiles?.department}.
      Respond with ONLY JSON: {"isAuthentic": boolean, "confidenceScore": number, "reasoning": "string"}`;

    // 3. Resilient AI call with auto-retry
    const result = await safeGenerateContent(model, prompt);
    const responseText = result.response.text().replace(/```json|```/g, "").trim();
    const auditResult = JSON.parse(responseText);

    // 4. Update registry
    if (auditResult.isAuthentic && auditResult.confidenceScore > 60) {
      await supabase
        .from("certificates")
        .update({
          status: "approved",
          score: auditResult.confidenceScore,
          extracted_text: { ai_reasoning: auditResult.reasoning, model_used: modelName },
        })
        .eq("id", id);
    }

    return NextResponse.json({ ...auditResult, modelUsed: modelName });

  } catch (error: any) {
    console.error("[Verify] Error:", error.message);
    const isRateLimit = error.message?.includes("429") || error.message?.includes("quota");
    return NextResponse.json(
      { error: isRateLimit ? "Rate limit hit. Retrying..." : error.message },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
