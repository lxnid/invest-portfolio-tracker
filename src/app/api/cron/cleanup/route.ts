import { NextResponse } from "next/server";
import { cleanupStaleGuestData } from "@/lib/demo-limits";

// This endpoint can be called by a cron job (e.g., Vercel Cron)
// to cleanup stale guest data periodically
export async function GET(request: Request) {
  // Simple auth check - require a secret header
  const authHeader = request.headers.get("Authorization");
  const expectedSecret = process.env.CRON_SECRET || "cron-secret";

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deletedCount = await cleanupStaleGuestData();
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} stale guest records`,
    });
  } catch (error) {
    console.error("Error in cleanup cron:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
