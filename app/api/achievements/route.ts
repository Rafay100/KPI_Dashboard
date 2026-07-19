import { NextResponse } from "next/server";
import { dataService } from "@/services/data\.service";
import { AchievementSchema } from "@/schemas/validation";
import { validateEnvVars, cleanErrorMessage } from "@/utils/helpers";
import { serverCache, CACHE_KEYS } from "@/lib/cache";
import type { APIResponse, Achievement } from "@/types/models";

/**
 * GET /api/achievements
 * Fetch all achievements from Airtable (with server-side caching)
 */
export async function GET() {
  try {
    // Validate environment variables
    const envCheck = validateEnvVars();
    if (!envCheck.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error",
          message: `Missing environment variables: ${envCheck.missing.join(", ")}`,
        } as APIResponse<null>,
        { status: 500 }
      );
    }

    // Check cache first (5 minute TTL)
    const cachedAchievements = serverCache.get<Achievement[]>(CACHE_KEYS.ACHIEVEMENTS, 5 * 60 * 1000);
    if (cachedAchievements) {
      console.log("✅ Serving Achievements from cache");
      return NextResponse.json(
        {
          success: true,
          data: cachedAchievements,
          message: `Successfully fetched ${cachedAchievements.length} achievements (cached)`,
        } as APIResponse<Achievement[]>,
        { status: 200 }
      );
    }

    // Fetch achievements from Airtable
    console.log("🔄 Fetching Achievements from Airtable...");
    const achievements = await dataService.getAchievements();

    // Validate data and filter out invalid records
    const validatedAchievements = achievements
      .map((achievement) => {
        const result = AchievementSchema.safeParse(achievement);
        return result.success ? result.data : null;
      })
      .filter((ach): ach is Achievement => ach !== null);

    // Cache the result
    serverCache.set(CACHE_KEYS.ACHIEVEMENTS, validatedAchievements);
    console.log(`✅ Cached ${validatedAchievements.length} Achievements`);

    return NextResponse.json(
      {
        success: true,
        data: validatedAchievements,
        message: `Successfully fetched ${validatedAchievements.length} achievements`,
      } as APIResponse<Achievement[]>,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/achievements:", error);

    return NextResponse.json(
      {
        success: false,
        error: cleanErrorMessage(error),
        message: "Failed to fetch achievements",
      } as APIResponse<null>,
      { status: 500 }
    );
  }
}

