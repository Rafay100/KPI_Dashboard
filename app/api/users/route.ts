import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import type { APIResponse } from "@/types/models";

/**
 * GET /api/users
 * Fetch all users from Airtable
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "You must be logged in to view users",
        } as APIResponse<null>,
        { status: 401 }
      );
    }

    // Only admins can view all users
    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "Only administrators can view all users",
        } as APIResponse<null>,
        { status: 403 }
      );
    }

    // Fetch users from Airtable
    const base = (await import("@/services/airtable.client")).default.getBase();
    const records = await base("Users").select().all();

    const users = records.map((record) => ({
      id: String(record.fields["ID"] || record.id),
      username: String(record.fields["Username"] || ""),
      email: String(record.fields["Email"] || ""),
      role: String(record.fields["Role"] || "employee"),
      status: String(record.fields["Status"] || "active"),
      lastLogin: String(record.fields["Last Login"] || ""),
      createdAt: String(record.fields["Created Date"] || new Date().toISOString()),
      employeeId: String(record.fields["Employee ID"] || ""),
    }));

    return NextResponse.json(
      {
        success: true,
        data: users,
        message: `Successfully fetched ${users.length} users`,
      } as APIResponse<typeof users>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/users:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to fetch users",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}
