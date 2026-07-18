import { NextResponse } from "next/server";
import airtableClient from "@/services/airtable.client";
import type { APIResponse } from "@/types/models";

/**
 * PUT /api/users/[id]
 * Update user role or status
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, status, department } = body;

    const base = airtableClient.getBase();
    
    // Find record by ID or field ID
    const records = await base("Users").select().all();
    const record = records.find(r => r.id === id || r.fields["ID"] === id);

    if (!record) {
      return NextResponse.json(
        { success: false, error: "User not found" } as APIResponse<null>,
        { status: 404 }
      );
    }

    const fields: Record<string, any> = {};
    if (role !== undefined) fields["Role"] = role;
    if (status !== undefined) fields["Status"] = status;
    if (department !== undefined) fields["Department"] = department;

    await base("Users").update(record.id, fields);

    return NextResponse.json(
      {
        success: true,
        message: "User updated successfully",
      } as APIResponse<null>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT /api/users/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to update user",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}
