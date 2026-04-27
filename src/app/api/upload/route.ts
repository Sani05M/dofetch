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
          file_hash: file_hash
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
