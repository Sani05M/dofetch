import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { extractCertificateData } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";
import { updateStudentStreak } from "@/lib/gamification";
import { redis } from "@/lib/redis";
import crypto from "crypto";

// Allow up to 60 seconds for Gemini Vision to process the certificate
export const maxDuration = 60;

/**
 * Simple fuzzy name match: normalizes both names and checks if either
 * name contains the other, or if they share a significant overlap.
 */
function namesMatch(certName: string | null, uploaderName: string | null): { match: boolean; confidence: string } {
  if (!certName || !uploaderName) return { match: false, confidence: "no_name_on_cert" };
  
  const normalize = (n: string) => n.toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();
  const a = normalize(certName);
  const b = normalize(uploaderName);
  
  if (!a || !b) return { match: false, confidence: "no_name_on_cert" };
  
  // Exact match
  if (a === b) return { match: true, confidence: "exact" };
  
  // One contains the other (handles "Abhishek" vs "Abhishek Singh")
  if (a.includes(b) || b.includes(a)) return { match: true, confidence: "partial" };
  
  // Check word overlap: if at least 2 words match between both names
  const wordsA = a.split(" ");
  const wordsB = b.split(" ");
  const commonWords = wordsA.filter(w => w.length > 1 && wordsB.includes(w));
  if (commonWords.length >= 2) return { match: true, confidence: "word_overlap" };
  if (commonWords.length === 1 && (wordsA.length === 1 || wordsB.length === 1)) return { match: true, confidence: "single_word" };
  
  return { match: false, confidence: "mismatch" };
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Set status to extracting
    await redis.set(`upload_status:${userId}`, { 
      status: "extracting", 
      message: "AI is analyzing your artifact...",
      timestamp: Date.now() 
    }, 300); // 5 min TTL

    // Rate limit: max 5 extractions per minute per user
    const limit = rateLimit(userId, 5, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${limit.resetIn} seconds.` },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 0.5 File Security: Limit to 10MB and valid types
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Please upload an image or PDF." }, { status: 400 });
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

    // 2.5 Stage File in Supabase Storage (Resilience)
    // This allows recovery if the user refreshes before clicking "Sync"
    const stagedPath = `${userId}/${fileHash}`;
    
    // Ensure bucket exists (one-time check would be better, but this is safer for now)
    await supabase.storage.createBucket("draft-artifacts", { public: false }).catch(() => {});

    const { error: stageError } = await supabase.storage
      .from("draft-artifacts")
      .upload(stagedPath, file, { upsert: true });

    if (stageError) {
      console.warn("Staging failed, but proceeding with extraction:", stageError);
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

    // 5. Identity Cross-Reference: Compare certificate recipient vs uploader
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    const uploaderName = profile?.full_name || null;
    const certRecipient = extractedData.recipient_name || null;
    const nameCheck = namesMatch(certRecipient, uploaderName);

    let finalScore = extractedData.score;
    let finalReasoning = extractedData.authenticity_reasoning;
    let nameMismatchFlag = false;

    if (!nameCheck.match && nameCheck.confidence === "mismatch") {
      // Heavy penalty: the certificate belongs to someone else
      const penalty = Math.min(finalScore, 20);
      finalScore = Math.max(0, finalScore - penalty);
      nameMismatchFlag = true;
      finalReasoning = `⚠️ NAME MISMATCH: Certificate is issued to "${certRecipient}" but uploaded by "${uploaderName}". Score penalized by -${penalty}. ` + finalReasoning;
    } else if (!nameCheck.match && nameCheck.confidence === "no_name_on_cert") {
      // Mild penalty: can't verify identity
      finalScore = Math.max(0, finalScore - 5);
      finalReasoning = `⚠️ NO RECIPIENT NAME: Could not identify the recipient on this certificate. Score penalized by -5. ` + finalReasoning;
    }

    // 6. Update Gamification (Streak)
    await updateStudentStreak(userId);

    const result = { 
      ...extractedData, 
      score: finalScore,
      authenticity_reasoning: finalReasoning,
      file_hash: fileHash,
      recipient_name: certRecipient,
      uploader_name: uploaderName,
      name_match: nameCheck.match,
      name_match_confidence: nameCheck.confidence,
      name_mismatch_flag: nameMismatchFlag
    };

    // Store result in Redis so the frontend can retrieve it after refresh
    await redis.set(`upload_status:${userId}`, { 
      status: "completed", 
      result,
      staged_path: stagedPath,
      timestamp: Date.now() 
    }, 600); // Increased TTL to 10 min

    return NextResponse.json({ 
      success: true, 
      data: result 
    });
  } catch (error: any) {
    // Clear status on error
    const { userId } = await auth();
    if (userId) await redis.del(`upload_status:${userId}`);

    console.error("Extraction Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
