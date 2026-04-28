import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { uploadToTelegram } from "@/lib/telegram";
import { supabase } from "@/lib/supabase";
import { extractCertificateData } from "@/lib/gemini";
import { redis } from "@/lib/redis";

// Allow up to 60 seconds for Gemini Vision to process the certificate
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Set status to synchronizing
    await redis.set(`upload_status:${userId}`, { 
      status: "synchronizing", 
      message: "Distributing artifact payload across the mesh...",
      timestamp: Date.now() 
    }, 300); // 5 min TTL

    // 0. Enforce Daily Upload Quota (10 per day)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from("certificates")
      .select("*", { count: 'exact', head: true })
      .eq("student_id", userId)
      .gte("created_at", today.toISOString());

    if (countError) {
      console.error("Quota Check Error:", countError);
      return NextResponse.json({ error: "Failed to verify daily quota." }, { status: 500 });
    }

    if (count !== null && count >= 10) {
      return NextResponse.json({ 
        error: "Daily Limit Reached: You have reached your limit of 10 certificate uploads for today. Please try again tomorrow." 
      }, { status: 429 });
    }

    const formData = await req.formData();
    let file = formData.get("file") as File | null;
    const stagedPath = formData.get("staged_path") as string | null;
    const title = formData.get("title") as string;
    const type = formData.get("type") as string;
    
    // Accept pre-extracted fields from the frontend
    const issuer = formData.get("issuer") as string || "Unknown";
    const issue_date = formData.get("issue_date") as string || new Date().toISOString().split('T')[0];
    const score = parseInt(formData.get("score") as string) || 0;
    const authenticity_reasoning = formData.get("authenticity_reasoning") as string || "No reasoning provided.";
    const file_hash = formData.get("file_hash") as string || null;
    const verification_link = formData.get("verification_link") as string || null;
    const recipient_name = formData.get("recipient_name") as string || null;
    const name_match = formData.get("name_match") === "true";
    const name_mismatch_flag = formData.get("name_mismatch_flag") === "true";

    // If no file is provided but a staged path exists, recover the file from Supabase
    if (!file && stagedPath) {
      const { data, error: downloadError } = await supabase.storage
        .from("draft-artifacts")
        .download(stagedPath);

      if (downloadError) {
        console.error("Failed to download staged file:", downloadError);
        return NextResponse.json({ error: "Failed to recover staged artifact. Please upload again." }, { status: 400 });
      }

      // Reconstruct File object (Telegram needs the buffer/blob)
      const fileName = title ? `${title}.pdf` : "artifact.pdf";
      file = new File([data], fileName, { type: data.type }) as File;
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided or staged artifact found." }, { status: 400 });
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

    // 1. Upload to Telegram (Infinite Storage)
    const { fileId, messageId } = await uploadToTelegram(file, file.name);

    // 2. Save Metadata to Supabase using pre-extracted data
    const { data, error } = await supabase
      .from("certificates")
      .insert({
        student_id: userId,
        telegram_file_id: fileId,
        telegram_message_id: messageId,
        title: title || file.name,
        type: type,
        issuer: issuer,
        issue_date: issue_date,
        score: score,
        status: "pending",
        extracted_text: { 
          raw_filename: file.name, 
          authenticity_reasoning: authenticity_reasoning,
          file_hash: file_hash,
          verification_link: verification_link,
          recipient_name: recipient_name,
          name_match: name_match,
          name_mismatch_flag: name_mismatch_flag
        }
      })
      .select()
      .single();

    if (error) throw error;

    // Clear status on success
    await redis.del(`upload_status:${userId}`);

    // Cleanup staged file if it exists
    if (stagedPath) {
      await supabase.storage.from("draft-artifacts").remove([stagedPath]);
    }

    return NextResponse.json({ success: true, certificate: data });
  } catch (error: any) {
    // Clear status on error
    const { userId } = await auth();
    if (userId) await redis.del(`upload_status:${userId}`);

    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
