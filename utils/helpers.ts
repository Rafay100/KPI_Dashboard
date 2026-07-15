/**
 * Helper utility functions for data transformation and formatting
 */

/**
 * Safely convert value to string, returning empty string if undefined/null
 */
export function safeString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

/**
 * Safely convert value to number, returning 0 if invalid
 */
export function safeNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Format date to ISO string
 */
export function formatDateISO(date: string | Date | undefined): string {
  if (!date) {
    return new Date().toISOString();
  }

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

/**
 * Format date for display
 */
export function formatDateDisplay(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return dateString;
  }
}

/**
 * Calculate percentage
 */
export function calculatePercentage(
  actual: number,
  target: number,
  decimals = 1
): number {
  if (target === 0) return 0;
  const percentage = (actual / target) * 100;
  return Number(percentage.toFixed(decimals));
}

/**
 * Validate environment variables
 */
export function validateEnvVars(): {
  isValid: boolean;
  missing: string[];
} {
  const required = ["AIRTABLE_API_KEY", "AIRTABLE_BASE_ID"];
  const missing: string[] = [];

  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}

/**
 * Clean error message for client
 */
export function cleanErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

/**
 * Check if value is empty
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}
