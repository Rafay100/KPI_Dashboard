import { NextResponse } from "next/server";
import { dataService } from "@/services/data.service";
import airtableClient from "@/services/airtable.client";
import { cleanErrorMessage } from "@/utils/helpers";

/**
 * GET /api/kpis/[id]/history
 * Fetch the historical updates for a specific KPI from Airtable
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 1. Fetch the KPI record to get its Code (i.e. 'ID' like KPI-003)
    const kpi = await dataService.getKPIById(id);
    if (!kpi) {
      return NextResponse.json(
        { success: false, error: "Not Found", message: "KPI not found" },
        { status: 404 }
      );
    }

    const kpiCode = kpi.code || `KPI-${kpi.id.slice(0, 5).toUpperCase()}`;

    // 2. Query the KPI Updates table from Airtable
    const base = airtableClient.getBase();
    const tableName = await airtableClient.getTableName("kpiUpdates");

    console.log(`🔄 Fetching history for KPI Code ${kpiCode} from ${tableName}...`);

    const records = await base(tableName)
      .select({
        filterByFormula: `{KPI ID} = '${kpiCode}'`,
        sort: [{ field: "Updated Date", direction: "desc" }], // Order by newest first
      })
      .all();

    // 3. Map the Airtable records
    const history = records.map((record) => {
      const fields = record.fields;
      return {
        id: record.id,
        kpiId: String(fields["KPI ID"] || ""),
        kpiName: String(fields["KPI Name"] || ""),
        previousValue: Number(fields["Previous Value"] || 0),
        newValue: Number(fields["New Value"] || 0),
        previousScore: Number(fields["Previous Score"] || 0),
        newScore: Number(fields["New Score"] || 0),
        statusAfterUpdate: String(fields["Status After Update"] || ""),
        updatedBy: String(fields["Updated By"] || "System"),
        approvalStatus: String(fields["Approval Status"] || "Approved"),
        updateDate: String(fields["Updated Date"] || ""),
      };
    });

    console.log(`✅ Successfully fetched ${history.length} update logs for KPI ${kpiCode}`);

    return NextResponse.json(
      {
        success: true,
        data: history,
        message: `Successfully fetched history for ${kpiCode}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error fetching KPI history for record ${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: "Failed to fetch KPI history",
      },
      { status: 500 }
    );
  }
}
