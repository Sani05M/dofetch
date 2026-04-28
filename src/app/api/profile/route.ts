import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await request.json();

    // Ensure users can only update their own profile and prevent malicious role updates
    delete updates.id;
    delete updates.role;
    delete updates.email;

    // Fetch current profile to check if full_name is locked
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name_locked")
      .eq("id", userId)
      .single();

    if (profile?.full_name_locked) {
      delete updates.full_name;
    }
    
    // We use the service_role key to bypass RLS for this specific update, 
    // but we enforce security by strictly filtering by the authenticated user's ID
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Supabase Profile Update Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Profile API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
