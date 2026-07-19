import { NextResponse } from "next/server";
import { dataService } from "@/services/data.service";
import { KPISchema, UpdateKPISchema } from "@/schemas/validation";
import { cleanErrorMessage } from "@/utils/helpers";
import type { APIResponse, KPI } from "@/types/models";
import type { FieldSet } from "airtable";

/**
 * GET /api/kpis/[id]
 * Fetch a single KPI by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const kpi = await dataService.getKPIById(id);

    if (!kpi) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: `KPI with ID ${id} not found`,
        } as APIResponse<null>,
        { status: 404 }
      );
    }

    const validatedKPI = KPISchema.parse(kpi);

    return NextResponse.json(
      {
        success: true,
        data: validatedKPI,
        message: "Successfully fetched KPI",
      } as APIResponse<KPI>,
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in GET /api/kpis/${id}:`, error);

    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: "Failed to fetch KPI",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/kpis/[id]
 * Update an existing KPI
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();

    // Validate input
    const validated = UpdateKPISchema.parse(body);

    // Map to Airtable fields
    const airtableFields: Record<string, unknown> = {};

    if (validated.kpiName !== undefined) airtableFields.Name = validated.kpiName;
    if (validated.description !== undefined) airtableFields.Description = validated.description;
    if (validated.targetValue !== undefined) airtableFields.TargetValue = validated.targetValue;
    if (validated.actualValue !== undefined) airtableFields.ActualValue = validated.actualValue;
    if (validated.status !== undefined) airtableFields.Status = validated.status;
    if (validated.dueDate !== undefined) airtableFields.DueDate = validated.dueDate;

    // Always update LastUpdated
    airtableFields.LastUpdated = new Date().toISOString();

    await dataService.updateRecord("KPIs", id, airtableFields as Partial<FieldSet>);

    return NextResponse.json(
      {
        success: true,
        data: { id: id, ...validated },
        message: "KPI updated successfully",
      } as APIResponse<Partial<KPI>>,
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in PUT /api/kpis/${id}:`, error);

    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: "Failed to update KPI",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/kpis/[id]
 * Delete a KPI
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await dataService.deleteRecord("KPIs", id);

    return NextResponse.json(
      {
        success: true,
        data: { id: id },
        message: "KPI deleted successfully",
      } as APIResponse<{ id: string }>,
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in DELETE /api/kpis/${id}:`, error);

    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: "Failed to delete KPI",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}