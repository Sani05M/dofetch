import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate start of today in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from("certificates")
      .select("*", { count: 'exact', head: true })
      .eq("student_id", userId)
      .gte("created_at", today.toISOString());

    if (error) {
      console.error("Quota Check Error:", error);
      return NextResponse.json({ error: "Failed to verify daily quota." }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      used: count || 0,
      limit: 9999,
      reset_at: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error: any) {
    console.error("Quota Check Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
