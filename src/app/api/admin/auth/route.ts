import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password, action } = await req.json();

  if (action === "set") {
    // Check if user is approved but has no password
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("password_hash")
      .eq("user_id", userId)
      .single();

    if (!adminUser || adminUser.password_hash) {
      return NextResponse.json({ error: "Cannot set password" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const { error } = await supabase
      .from("admin_users")
      .update({ password_hash: hash })
      .eq("user_id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "verify") {
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("password_hash")
      .eq("user_id", userId)
      .single();

    if (!adminUser || !adminUser.password_hash) {
      return NextResponse.json({ error: "No password set" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(password, adminUser.password_hash);
    if (!isValid) return NextResponse.json({ error: "Invalid password" }, { status: 401 });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
