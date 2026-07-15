/**
 * Simple logger utility for adapter operations
 */

export function logInfo(service: string, message: string): void {
  console.log(`[${service}] ℹ️  ${message}`);
}

export function logSuccess(service: string, message: string): void {
  console.log(`[${service}] ✅ ${message}`);
}

export function logError(service: string, message: string, error?: unknown): void {
  console.error(`[${service}] ❌ ${message}`);
  if (error) {
    console.error(error);
  }
}

export function logWarning(service: string, message: string): void {
  console.warn(`[${service}] ⚠️  ${message}`);
}

export function logDebug(service: string, message: string, data?: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[${service}] 🐛 ${message}`);
    if (data) {
      console.log(data);
    }
  }
}
