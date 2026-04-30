import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// Use service role so we can write edit_count / max_edits (RLS blocks anon writes)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      role,
      department,
      batch,
      section,
      rollNumber,
      regNumber,
      sectionsManaged,
      fullName,
      email,
      isSync,
    } = body;

    // 1. Upsert the profile
    // If it's a sync, we avoid resetting edit_count and max_edits by using a conditional object
    const profileData: any = {
      id: userId,
      email: email,
      full_name: fullName,
      full_name_locked: true,
      role: role,
      department: department || null,
      batch: batch || null,
      section: section || null,
      roll_number: rollNumber || null,
      reg_number: regNumber || null,
      sections_managed: sectionsManaged || null,
      updated_at: new Date().toISOString(),
    };

    // Only set initial edit limits if it's NOT a sync (initial onboarding)
    if (!isSync) {
      profileData.edit_count = 0;
      profileData.max_edits = role === "faculty" ? 5 : 1;
    }

    const { error: dbError } = await supabaseAdmin
      .from("profiles")
      .upsert(profileData, { onConflict: "id" });

    if (dbError) {
      console.error("Supabase Profile Upsert Error:", dbError);
      return NextResponse.json(
        { error: `Database Error: ${dbError.message}` },
        { status: 500 },
      );
    }

    // 2. Update Clerk publicMetadata — only if not a sync or if metadata is missing
    if (!isSync) {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          onboardingComplete: true,
          role: role,
          section: section,
          rollNumber: rollNumber,
          regNumber: regNumber,
          sectionsManaged: sectionsManaged,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Onboarding Error:", error);
    return NextResponse.json(
      { error: `Server Error: ${error.message || "Unknown error"}` },
      { status: 500 },
    );
  }
}
