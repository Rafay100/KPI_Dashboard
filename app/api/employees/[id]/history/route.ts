import { NextResponse } from "next/server";
import { airtableService } from "@/services/airtable.service";
import airtableClient from "@/services/airtable.client";
import { cleanErrorMessage } from "@/utils/helpers";

/**
 * GET /api/employees/[id]/history
 * Fetch historical KPI updates performed by or assigned to a specific employee
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 1. Fetch employee details to get their full name
    const employees = await airtableService.getEmployees();
    const employee = employees.find((emp) => emp.id === id);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Not Found", message: "Employee not found" },
        { status: 404 }
      );
    }

    const empName = employee.name;

    // 2. Query the KPI Updates table
    const base = airtableClient.getBase();
    const tableName = await airtableClient.getTableName("kpiUpdates");

    console.log(`🔄 Fetching update history logs for Employee: "${empName}"...`);

    const records = await base(tableName)
      .select({
        filterByFormula: `{Updated By} = '${empName}'`,
        sort: [{ field: "Updated Date", direction: "desc" }],
      })
      .all();

    // 3. Map Airtable rows to structured API output
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
        updatedBy: String(fields["Updated By"] || ""),
        approvalStatus: String(fields["Approval Status"] || "Approved"),
        updateDate: String(fields["Updated Date"] || ""),
      };
    });

    console.log(`✅ Successfully fetched ${history.length} updates logged by ${empName}`);

    return NextResponse.json(
      {
        success: true,
        data: history,
        message: `Successfully loaded history for ${empName}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error loading updates for employee ${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: "Failed to fetch employee history",
      },
      { status: 500 }
    );
  }
}
