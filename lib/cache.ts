/**
 * Simple in-memory cache for API responses
 * This caches data on the server to avoid hitting Airtable on every request
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ServerCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached data if it exists and is not expired
   */
  get<T>(key: string, ttl?: number): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    const maxAge = ttl || this.defaultTTL;

    if (age > maxAge) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache data with timestamp
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const serverCache = new ServerCache();

// Cache keys
export const CACHE_KEYS = {
  KPIS: "kpis:all",
  EMPLOYEES: "employees:all",
  DEPARTMENTS: "departments:all",
  TASKS: "tasks:all",
  ACHIEVEMENTS: "achievements:all",
  KPI_BY_ID: (id: string) => `kpis:${id}`,
  EMPLOYEE_BY_ID: (id: string) => `employees:${id}`,
  DEPARTMENT_BY_ID: (id: string) => `departments:${id}`,
  TASK_BY_ID: (id: string) => `tasks:${id}`,
};
