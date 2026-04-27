import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { uploadToTelegram } from "@/lib/telegram";
import { supabase } from "@/lib/supabase";
import { extractCertificateData } from "@/lib/gemini";

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

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Upload to Telegram (Infinite Storage)
    const { fileId, messageId } = await uploadToTelegram(file, file.name);

    // 2. AI Extraction (Gemini 1.5 Vision)
    const extractedData = await extractCertificateData(file);

    // 3. (Profile is now handled by mandatory onboarding, so we skip the upsert here)
    // We just proceed to save the certificate linked to the authenticated userId.

    // 4. Save Metadata to Supabase
    const { data, error } = await supabase
      .from("certificates")
      .insert({
        student_id: userId,
        telegram_file_id: fileId,
        telegram_message_id: messageId,
        title: title || file.name,
        type: type,
        issuer: extractedData.issuer,
        issue_date: extractedData.issue_date,
        score: extractedData.score,
        status: "pending",
        extracted_text: { raw_filename: file.name, note: "AI extraction pending final verify" }
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
