import { NextRequest, NextResponse } from "next/server";
import { getAnalytics } from "@/lib/analytics";

const ADMIN_KEY = process.env.ANALYTICS_KEY || "";

export async function GET(req: NextRequest) {
  // Simple auth via query param
  const key = req.nextUrl.searchParams.get("key");
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getAnalytics();
  return NextResponse.json(data);
}
