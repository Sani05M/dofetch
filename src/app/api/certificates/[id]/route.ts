import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { deleteFromTelegram } from "@/lib/telegram";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 1. Fetch certificate to get telegram_message_id and check ownership
    const { data: certificate, error: fetchError } = await supabase
      .from("certificates")
      .select("student_id, telegram_message_id")
      .eq("id", id)
      .single();

    if (fetchError || !certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // 2. Authorization check: Only the owner can delete
    if (certificate.student_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Delete from Telegram (to save data as requested)
    if (certificate.telegram_message_id) {
      try {
        await deleteFromTelegram(Number(certificate.telegram_message_id));
      } catch (tgError) {
        console.error("Failed to delete from Telegram:", tgError);
        // We continue anyway to ensure the DB is cleaned up
      }
    }

    // 4. Delete from Supabase
    const { error: deleteError } = await supabase
      .from("certificates")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
