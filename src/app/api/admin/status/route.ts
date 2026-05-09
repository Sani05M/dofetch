import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  // 1. Check if superuser from env
  const superAdmins = [
    ...(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "").split(",").map(e => e.trim().toLowerCase()),
    ...Object.values(process.env).map(v => typeof v === 'string' ? v.toLowerCase() : "")
  ].filter(Boolean);

  if (email && superAdmins.includes(email.toLowerCase())) {
    return NextResponse.json({
      status: "authorized",
      role: "super_admin",
      permissions: ["overview", "users", "analytics", "logs", "settings", "management"]
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });
  }

  // 2. Check if admin_user
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (adminUser) {
    return NextResponse.json({
      status: adminUser.password_hash ? "needs_password" : "set_password",
      role: adminUser.role,
      permissions: adminUser.permissions
    });
  }

  // 3. Check if request exists
  const { data: request } = await supabase
    .from("admin_requests")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (request) {
    return NextResponse.json({ status: "request_pending", requestStatus: request.status });
  }

  return NextResponse.json({ status: "unauthorized" });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  const { data, error } = await supabase
    .from("admin_requests")
    .upsert({ user_id: userId, email, status: "pending" }, { onConflict: "user_id" });

  if (error) {
    console.error("Supabase Error:", error);
    return NextResponse.json({ error: `Database Error: ${error.message}. Make sure to run the SQL provided.` }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
