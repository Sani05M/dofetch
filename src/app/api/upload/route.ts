import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { uploadToTelegram } from "@/lib/telegram";
import { supabase } from "@/lib/supabase";
import { extractCertificateData } from "@/lib/gemini";

// Allow up to 60 seconds for Gemini Vision to process the certificate
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (count !== null && count >= 9999) {
      return NextResponse.json({ 
        error: "Daily Limit Reached: You have reached your limit of 9999 certificate uploads for today. Please try again tomorrow." 
      }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const type = formData.get("type") as string;
    
    // Accept pre-extracted fields from the frontend
    const issuer = formData.get("issuer") as string || "Unknown";
    const issue_date = formData.get("issue_date") as string || new Date().toISOString().split('T')[0];
    const score = parseInt(formData.get("score") as string) || 0;
    const authenticity_reasoning = formData.get("authenticity_reasoning") as string || "No reasoning provided.";
    const file_hash = formData.get("file_hash") as string || null;
    const verification_link = formData.get("verification_link") as string || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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
          verification_link: verification_link
        }
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, certificate: data });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
