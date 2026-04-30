import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";

// ─── Format validators ──────────────────────────────────────────────────────
const ROLL_REGEX = /^[A-Z]+\/\d{2}\/[A-Z]+\/\d{4}\/\d{3,4}$/;
const REG_REGEX = /^AU\/\d{4}\/\d{6,8}$/;
// Batch: YYYY-YYYY  e.g. 2023-2027
const BATCH_REGEX = /^\d{4}-\d{4}$/;

// ─── Service client — bypasses RLS ──────────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      display_name,
      department,
      // student fields
      roll_no,
      reg_no,
      section,
      batch,
      // faculty fields
      sections_managed,
      batches_managed,
      faculty_id,
    } = body;

    // 2. Format validation (students)
    if (roll_no && !ROLL_REGEX.test(roll_no.trim().toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid roll number format. Expected: UG/02/BTCSE/2023/011" },
        { status: 400 },
      );
    }
    if (reg_no && !REG_REGEX.test(reg_no.trim().toUpperCase())) {
      return NextResponse.json(
        {
          error:
            "Invalid registration number format. Expected: AU/2023/0008918",
        },
        { status: 400 },
      );
    }

    // 3. Fetch profile + quota check
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, edit_count, max_edits, full_name_locked")
      .eq("id", userId)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.edit_count >= profile.max_edits) {
      return NextResponse.json(
        {
          error: `Edit limit reached. You have used all ${profile.max_edits} allowed edit${profile.max_edits === 1 ? "" : "s"}.`,
          editsRemaining: 0,
        },
        { status: 403 },
      );
    }

    // 4. Build update payload
    const updatePayload: Record<string, any> = {
      edit_count: profile.edit_count + 1,
    };

    if (display_name?.trim()) {
      // If full_name is not locked, we can update it (Legal Name)
      // If it is locked, we ONLY update username (Public Display)
      if (!profile.full_name_locked) {
        updatePayload.full_name = display_name.trim();
        // Once they set it here, we don't necessarily lock it yet,
        // unless it's their last edit or they are finishing onboarding.
        // But for this correction path, we'll let them fix it if unlocked.
      }
      updatePayload.username = display_name.trim();
    }

    // Explicitly handle username if provided separately
    if (body.username?.trim()) {
      updatePayload.username = body.username.trim();
    }

    if (department?.trim()) updatePayload.department = department.trim();

    if (profile.role === "student") {
      if (roll_no?.trim()) updatePayload.roll_no = roll_no.trim().toUpperCase();
      if (reg_no?.trim()) updatePayload.reg_no = reg_no.trim().toUpperCase();
      if (section?.trim()) updatePayload.section = section.trim().toUpperCase();
      if (batch?.trim()) updatePayload.batch = batch.trim();
    } else {
      // faculty
      if (sections_managed !== undefined) {
        updatePayload.sections_managed = Array.isArray(sections_managed)
          ? sections_managed
          : [];
      }
      if (batches_managed !== undefined) {
        updatePayload.batches_managed = Array.isArray(batches_managed)
          ? batches_managed
          : [];
      }
      if (faculty_id?.trim()) updatePayload.faculty_id = faculty_id.trim();
    }

    // 5. Atomic update — race guard via edit_count match
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId)
      .eq("edit_count", profile.edit_count)
      .select("id, edit_count, max_edits")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        {
          error:
            "Update failed — concurrent edit detected or profile not found.",
        },
        { status: 409 },
      );
    }

    // 6. Sync to Clerk (server-side only)
    const clerk = await clerkClient();
    const metadataUpdate: Record<string, any> = {};

    if (display_name?.trim()) {
      const nameParts = display_name.trim().split(" ");
      await clerk.users.updateUser(userId, {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
      });
      metadataUpdate.fullName = display_name.trim();
    }

    // Sync all changed fields to publicMetadata so AuthContext stays in sync on refresh
    if (department) metadataUpdate.department = department;
    if (profile.role === "student") {
      if (section) metadataUpdate.section = section;
      if (batch) metadataUpdate.batch = batch;
      if (roll_no) metadataUpdate.rollNumber = roll_no;
      if (reg_no) metadataUpdate.regNumber = reg_no;
    } else {
      if (sections_managed) metadataUpdate.sectionsManaged = sections_managed;
      if (batches_managed) metadataUpdate.batchesManaged = batches_managed;
      if (faculty_id) metadataUpdate.facultyId = faculty_id;
    }

    if (Object.keys(metadataUpdate).length > 0) {
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: metadataUpdate,
      });
    }

    return NextResponse.json({
      success: true,
      editsRemaining: updated.max_edits - updated.edit_count,
    });
  } catch (err: any) {
    console.error("[profile/update] Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── GET: fetch full profile ─────────────────────────────────────────────────
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, role, full_name, username, full_name_locked, department, roll_no, reg_no, section, batch, sections_managed, batches_managed, faculty_id, edit_count, max_edits",
      )
      .eq("id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...data,
      editsRemaining: data.max_edits - data.edit_count,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
