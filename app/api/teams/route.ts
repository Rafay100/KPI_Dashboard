import { NextResponse } from "next/server";
import type { APIResponse } from "@/types/models";

/**
 * GET /api/teams
 * Fetch all teams from Airtable
 */
export async function GET() {
  try {
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

/**
 * POST /api/teams
 * Create a new team in Airtable
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teamName, department, teamLead, description } = body;

    if (!teamName || String(teamName).trim() === "") {
      return NextResponse.json(
        { success: false, error: "Team Name is required" } as APIResponse<null>,
        { status: 400 }
      );
    }

    const base = (await import("@/services/airtable.client")).default.getBase();
    const tableName = "Teams";

    // Fetch existing teams to check duplicate names
    const existingRecords = await base(tableName).select().all();
    const isDuplicate = existingRecords.some((rec) => {
      const name = String(rec.fields["Team Name"] || "").toLowerCase().trim();
      return name === String(teamName).toLowerCase().trim();
    });

    if (isDuplicate) {
      return NextResponse.json(
        { success: false, error: `Team "${teamName}" already exists` } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Generate new TEAM-XXX ID
    const maxId = existingRecords.reduce((max, rec) => {
      const idStr = String(rec.fields["ID"] || "");
      const match = idStr.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        return val > max ? val : max;
      }
      return max;
    }, 0);
    const newId = `TEAM-${String(maxId + 1).padStart(3, "0")}`;

    const fields: Record<string, any> = {
      "Team Name": teamName.trim(),
      "ID": newId,
      "Status": "active", // Default status
    };

    if (department) fields["Department"] = department;
    if (teamLead) {
      fields["Team Manager"] = teamLead;
      fields["Team Lead"] = teamLead;
    }
    if (description) fields["Description"] = description;

    const newRecord = await base(tableName).create(fields);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newRecord.id,
          teamName: fields["Team Name"],
          idCode: newId,
          department: fields["Department"] || "",
          teamLead: fields["Team Manager"] || "",
          description: fields["Description"] || "",
          status: "active",
        },
        message: "Team created successfully",
      } as APIResponse<any>,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/teams:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to create team",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}