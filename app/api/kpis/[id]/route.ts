import { NextResponse } from "next/server";
import { airtableService } from "@/services/airtable.service";
import { KPISchema, UpdateKPISchema } from "@/schemas/validation";
import { auth } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/auth/permissions";
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
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to access this resource",
        } as APIResponse<null>,
        { status: 401 }
      );
    }

    const userRole = session.user.role;

    if (!hasPermission(userRole, "kpis", "read")) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "You do not have permission to view KPIs",
        } as APIResponse<null>,
        { status: 403 }
      );
    }

    const kpi = await airtableService.getKPIById(id);

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
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to update KPIs",
        } as APIResponse<null>,
        { status: 401 }
      );
    }

    const userRole = session.user.role;

    if (!hasPermission(userRole, "kpis", "update")) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "You do not have permission to update KPIs",
        } as APIResponse<null>,
        { status: 403 }
      );
    }

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

    await airtableService.updateRecord("KPIs", id, airtableFields as Partial<FieldSet>);

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
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to delete KPIs",
        } as APIResponse<null>,
        { status: 401 }
      );
    }

    const userRole = session.user.role;

    if (!hasPermission(userRole, "kpis", "delete")) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "You do not have permission to delete KPIs",
        } as APIResponse<null>,
        { status: 403 }
      );
    }

    await airtableService.deleteRecord("KPIs", id);

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
