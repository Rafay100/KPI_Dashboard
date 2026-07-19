import { NextResponse } from "next/server";
import { dataService } from "@/services/data\.service";
import { cleanErrorMessage } from "@/utils/helpers";

export async function GET() {
  try {
    const kpis = await dataService.getKPIs();
    return NextResponse.json({ success: true, data: kpis.filter((kpi) => kpi.status === "at-risk" || kpi.status === "overdue") }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: cleanErrorMessage(error), message: "Failed to fetch pending updates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body.id;
    if (!id) {
      return NextResponse.json({ success: false, message: "Update ID is required" }, { status: 400 });
    }

    await dataService.updateRecord("KPIs", id, {
      Status: body.status || "in-progress",
      LastUpdated: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "KPI update recorded" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: cleanErrorMessage(error), message: "Failed to record KPI update" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ success: false, message: "KPI ID and action are required" }, { status: 400 });
    }

    const statusMap = {
      approve: "completed",
      reject: "at-risk",
      revision: "in-progress",
    } as const;

    await dataService.updateRecord("KPIs", id, {
      Status: statusMap[action as keyof typeof statusMap] || "in-progress",
      LastUpdated: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: `KPI ${action}d` }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: cleanErrorMessage(error), message: "Failed to update approval" }, { status: 400 });
  }
}

