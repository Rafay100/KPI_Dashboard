import { NextResponse } from "next/server";
import airtableClient from "@/services/airtable.client";
import { validateEnvVars } from "@/utils/helpers";

/**
 * GET /api/health
 * Health check endpoint to verify Airtable connection
 */
export async function GET() {
  try {
    // Validate environment variables
    const envCheck = validateEnvVars();
    if (!envCheck.isValid) {
      return NextResponse.json(
        {
          status: "error",
          message: "Configuration error",
          details: {
            missingVars: envCheck.missing,
          },
        },
        { status: 500 }
      );
    }

    // Test Airtable connection
    const isConnected = await airtableClient.testConnection();

    if (isConnected) {
      return NextResponse.json(
        {
          status: "healthy",
          message: "Airtable connection successful",
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          status: "unhealthy",
          message: "Airtable connection failed",
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Health check error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

