import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import type { APIResponse } from "@/types/models";

/**
 * GET /api/teams
 * Fetch all teams from Airtable
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to view teams",
        } as APIResponse<null>,
        { status: 401 }
      );
    }

    // Fetch teams from Airtable
    const base = (await import("@/services/airtable.client")).default.getBase();
    const records = await base("Teams").select().all();

    const teams = records.map((record) => ({
      id: record.id,
      teamName: String(record.fields["Team Name"] || "Unknown Team"),
      department: String(record.fields["Department"] || ""),
      teamLead: String(record.fields["Team Lead"] || ""),
      members: record.fields["Members"] || [],
      activeKpis: Number(record.fields["Active KPIs"] || 0),
      description: String(record.fields["Description"] || ""),
      status: String(record.fields["Status"] || "active"),
    }));

    return NextResponse.json(
      {
        success: true,
        data: teams,
        message: `Successfully fetched ${teams.length} teams`,
      } as APIResponse<typeof teams>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/teams:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to fetch teams",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}
