import { getDb } from "@/db";
import { organizations } from "@/db/schema/organizations";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    await db.select({ count: sql<number>`1` }).from(organizations).limit(1);

    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
