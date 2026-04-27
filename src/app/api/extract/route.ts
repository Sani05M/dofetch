import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { extractCertificateData } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

// Allow up to 60 seconds for Gemini Vision to process the certificate
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Generate SHA-256 Hash of the file to prevent duplicates
    const buffer = await file.arrayBuffer();
    const fileHash = crypto.createHash("sha256").update(Buffer.from(buffer)).digest("hex");

    // 2. Check if this exact file already exists in the mesh
    const { data: existingCert } = await supabase
      .from("certificates")
      .select("id")
      .eq("extracted_text->>file_hash", fileHash)
      .maybeSingle();

    if (existingCert) {
      return NextResponse.json(
        { error: "Duplicate Artifact Detected: This document already exists in the registry." }, 
        { status: 409 }
      );
    }

    // 3. AI Extraction (Gemini Vision)
    const extractedData = await extractCertificateData(file);

    // 4. Auto-Kill Switch for Extreme Forgeries Only
    if (extractedData.score < 10) {
      return NextResponse.json(
        { error: `Extreme Fraud Alert: ${extractedData.authenticity_reasoning}` },
        { status: 406 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: { ...extractedData, file_hash: fileHash } 
    });
  } catch (error: any) {
    console.error("Extraction Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
