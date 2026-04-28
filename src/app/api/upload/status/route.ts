import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = await redis.get(`upload_status:${userId}`);
    return NextResponse.json(status || { status: "idle" });
  } catch (error) {
    return NextResponse.json({ status: "idle" });
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await redis.del(`upload_status:${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to clear status" }, { status: 500 });
  }
}
