import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const superAdmins = [
    process.env.Sayan?.toLowerCase(),
    process.env.Abhishek?.toLowerCase()
  ].filter(Boolean);

  let isAuthorized = email && superAdmins.includes(email.toLowerCase());

  if (!isAuthorized) {
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("role, permissions")
      .eq("user_id", userId)
      .single();
    
    if (adminUser && (adminUser.role === "super_admin" || adminUser.permissions?.includes("management"))) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: requests } = await supabase.from("admin_requests").select("*");
  const { data: admins } = await supabase.from("admin_users").select("*");

  return NextResponse.json({ requests, admins });
}

export async function POST(req: Request) {
  const { userId: superUserId } = await auth();
  const superUser = await currentUser();
  const email = superUser?.primaryEmailAddress?.emailAddress;
  const superAdmins = [
    process.env.Sayan?.toLowerCase(),
    process.env.Abhishek?.toLowerCase()
  ].filter(Boolean);
  
  let isAuthorized = email && superAdmins.includes(email.toLowerCase());

  if (!isAuthorized) {
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("role, permissions")
      .eq("user_id", superUserId)
      .single();
    
    if (adminUser && (adminUser.role === "super_admin" || adminUser.permissions?.includes("management"))) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let { targetUserId, action, permissions, role } = await req.json();

  // If targetUserId is an email, find the user_id from requests or profiles
  if (targetUserId && targetUserId.includes("@")) {
    const { data: reqData } = await supabase
      .from("admin_requests")
      .select("user_id")
      .eq("email", targetUserId)
      .single();
    
    if (reqData?.user_id) {
      targetUserId = reqData.user_id;
    } else {
      // Try to find in profiles if possible
      const { data: profData } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", targetUserId)
        .single();
      if (profData?.id) targetUserId = profData.id;
    }
  }

  if (action === "approve") {
    // 1. Update request status if exists
    await supabase
      .from("admin_requests")
      .update({ status: "approved" })
      .eq("user_id", targetUserId);

    // 2. Create or Update admin_user entry
    const { data: existingAdmin } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", targetUserId)
      .single();

    if (existingAdmin) {
      await supabase
        .from("admin_users")
        .update({
          permissions: permissions || ["overview"],
          role: role || "admin"
        })
        .eq("user_id", targetUserId);
    } else {
      const { error } = await supabase
        .from("admin_users")
        .insert({
          user_id: targetUserId,
          permissions: permissions || ["overview"],
          role: role || "admin"
        });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  }

  if (action === "reject") {
    await supabase
      .from("admin_requests")
      .update({ status: "rejected" })
      .eq("user_id", targetUserId);
    return NextResponse.json({ success: true });
  }

  if (action === "update") {
    await supabase
      .from("admin_users")
      .update({ permissions, role })
      .eq("user_id", targetUserId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
