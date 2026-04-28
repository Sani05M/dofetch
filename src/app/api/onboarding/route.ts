import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// Use service role so we can write edit_count / max_edits (RLS blocks anon writes)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { role, department, batch, section, rollNumber, regNumber, sectionsManaged, fullName, email } = body;

    // 1. Upsert the profile — seed edit_count=0, max_edits by role
    const { error: dbError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id:               userId,
        email:            email,
        full_name:        fullName,
        full_name_locked: true, // Lock the name after onboarding
        role:             role,
        department:       department || null,
        batch:            batch || null,
        section:          section || null,
        roll_number:      rollNumber || null,
        reg_number:       regNumber || null,
        sections_managed: sectionsManaged || null,
        edit_count:       0,
        max_edits:        role === "faculty" ? 5 : 1,
        updated_at:       new Date().toISOString(),
      }, { onConflict: "id" });

    if (dbError) {
      console.error("Supabase Profile Upsert Error:", dbError);
      return NextResponse.json({ error: `Database Error: ${dbError.message}` }, { status: 500 });
    }

    // 2. Update Clerk publicMetadata — mark onboarding complete
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        onboardingComplete: true,
        role:              role,
        section:           section,
        rollNumber:        rollNumber,
        regNumber:         regNumber,
        sectionsManaged:   sectionsManaged,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Onboarding Error:", error);
    return NextResponse.json(
      { error: `Server Error: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
