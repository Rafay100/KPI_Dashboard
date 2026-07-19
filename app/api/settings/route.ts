import { NextResponse } from "next/server";
import airtableClient from "@/services/airtable.client";
import type { APIResponse } from "@/types/models";

/**
 * GET /api/settings
 * Fetch all settings from Airtable
 */
export async function GET() {
  try {
    const base = airtableClient.getBase();
    const tableName = await airtableClient.getTableName("settings");
    const records = await base(tableName).select().all();

    const settingsMap: Record<string, { id: string; value: string; category: string; description: string }> = {};
    const settingsList = records.map((record) => {
      const name = String(record.fields["Setting Name"] || "");
      const value = String(record.fields["Setting Value"] || "");
      const category = String(record.fields["Category"] || "");
      const description = String(record.fields["Description"] || "");

      if (name) {
        settingsMap[name] = {
          id: record.id,
          value,
          category,
          description,
        };
      }

      return {
        id: record.id,
        name,
        value,
        category,
        description,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          map: settingsMap,
          list: settingsList,
        },
        message: "Successfully fetched settings",
      } as APIResponse<{
        map: typeof settingsMap;
        list: typeof settingsList;
      }>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to fetch settings",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings
 * Upsert settings in Airtable
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { settings } = body; // Array of { name, value, category, description } or map of name -> value

    if (!settings) {
      return NextResponse.json(
        { success: false, error: "Settings object is required" } as APIResponse<null>,
        { status: 400 }
      );
    }

    const base = airtableClient.getBase();
    const tableName = await airtableClient.getTableName("settings");

    // Fetch existing records first to know if we should update or create
    const existingRecords = await base(tableName).select().all();
    const existingMap = new Map<string, string>(); // name -> recordId
    existingRecords.forEach((record) => {
      const name = String(record.fields["Setting Name"] || "");
      if (name) {
        existingMap.set(name, record.id);
      }
    });

    const entries = Array.isArray(settings)
      ? settings
      : Object.entries(settings).map(([name, val]) => {
          const valObj = val as any;
          return {
            name,
            value: typeof valObj === "object" ? valObj.value : String(valObj),
            category: typeof valObj === "object" ? valObj.category : "",
            description: typeof valObj === "object" ? valObj.description : "",
          };
        });

    const results = [];

    for (const entry of entries) {
      const { name, value, category, description } = entry;
      if (!name) continue;

      const recordId = existingMap.get(name);
      if (recordId) {
        // Update existing record
        const fields: Record<string, any> = {
          "Setting Value": String(value),
        };
        if (category) fields["Category"] = category;
        if (description) fields["Description"] = description;

        await base(tableName).update(recordId, fields);
        results.push({ name, status: "updated", id: recordId });
      } else {
        // Create new record
        const fields: Record<string, any> = {
          "Setting Name": name,
          "Setting Value": String(value),
        };
        if (category) fields["Category"] = category;
        if (description) fields["Description"] = description;

        const newRec = await base(tableName).create(fields);
        results.push({ name, status: "created", id: newRec.id });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: results,
        message: "Successfully saved settings",
      } as APIResponse<typeof results>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to save settings",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

