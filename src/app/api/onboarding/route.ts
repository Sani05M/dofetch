import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { role, department, batch, section, sectionsManaged, fullName, email } = body;

    // 1. Upsert the profile in Supabase
    // We update all fields to ensure the profile is fully hydrated
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        full_name: fullName,
        role: role,
        department: department || null,
        batch: batch || null,
        section: section || null,
        sections_managed: sectionsManaged || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (dbError) {
      console.error("Supabase Profile Update Error:", dbError);
      return NextResponse.json({ error: `Database Error: ${dbError.message}` }, { status: 500 });
    }

    // 2. Update Clerk publicMetadata to mark onboarding as complete
    // This allows the frontend to instantly know if the user is onboarded without querying Supabase
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        onboardingComplete: true,
        role: role,
        section: section,
        sectionsManaged: sectionsManaged
      }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Onboarding Error:", error);
    return NextResponse.json({ error: `Server Error: ${error.message || "Unknown error"}` }, { status: 500 });
  }
}
