/**
 * Centralized ClickUp Embed Configuration
 * 
 * Provides safe, client-accessible configuration for ClickUp live embedded views.
 * Sensitive API keys and tokens are never exposed here; only sanitized public embed URLs.
 */

export type ClickUpEmbedKey = "issues" | "rocks" | "l10" | "todos";

export interface ClickUpEmbedItem {
  key: ClickUpEmbedKey;
  title: string;
  description: string;
  envVar: string;
  url: string;
}

export const CLICKUP_EMBED_CONFIG: Record<ClickUpEmbedKey, ClickUpEmbedItem> = {
  issues: {
    key: "issues",
    title: "Issues / IDS",
    description: "Identify, Discuss, and Solve organizational issues and hurdles in real-time.",
    envVar: "NEXT_PUBLIC_CLICKUP_ISSUES_URL",
    url: process.env.NEXT_PUBLIC_CLICKUP_ISSUES_URL || "",
  },
  rocks: {
    key: "rocks",
    title: "Rocks / Quarterly Goals",
    description: "Track and manage quarterly strategic priorities and milestone rocks.",
    envVar: "NEXT_PUBLIC_CLICKUP_ROCKS_URL",
    url: process.env.NEXT_PUBLIC_CLICKUP_ROCKS_URL || "",
  },
  l10: {
    key: "l10",
    title: "L10 Meetings",
    description: "Level 10 weekly meeting cadence, agendas, and leadership alignment.",
    envVar: "NEXT_PUBLIC_CLICKUP_L10_URL",
    url: process.env.NEXT_PUBLIC_CLICKUP_L10_URL || "",
  },
  todos: {
    key: "todos",
    title: "To-Dos",
    description: "Live ClickUp To-Do embedded list for real-time action items and task execution.",
    envVar: "NEXT_PUBLIC_CLICKUP_TODOS_URL",
    url:
      process.env.NEXT_PUBLIC_CLICKUP_TODOS_URL ||
      process.env.NEXT_PUBLIC_CLICKUP_TODO_URL ||
      "",
  },
};

export function getClickUpConfig(key: ClickUpEmbedKey): ClickUpEmbedItem {
  return CLICKUP_EMBED_CONFIG[key];
}
