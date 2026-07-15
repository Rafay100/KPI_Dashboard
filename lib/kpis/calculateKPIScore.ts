export type KPIScoreRule = "more-is-better" | "less-is-better" | "equal-is-better" | "range" | "milestone" | "yes-no";

export interface KPIScoreInput {
  actualValue: number;
  targetValue: number;
  minimumValue?: number;
  maximumValue?: number;
  rule?: KPIScoreRule;
  scoreCap?: number;
}

export function calculateKPIScore(input: KPIScoreInput): number {
  const actual = Number.isFinite(input.actualValue) ? input.actualValue : 0;
  const target = Number.isFinite(input.targetValue) ? input.targetValue : 0;
  const minimumValue = Number.isFinite(input.minimumValue ?? 0) ? (input.minimumValue ?? 0) : 0;
  const maximumValue = Number.isFinite(input.maximumValue ?? 0) ? (input.maximumValue ?? 0) : 0;
  const scoreCap = Number.isFinite(input.scoreCap ?? 100) ? (input.scoreCap ?? 100) : 100;
  const rule = input.rule ?? "more-is-better";

  if (target <= 0 && rule !== "yes-no" && rule !== "equal-is-better") {
    return 0;
  }

  if (actual < 0) {
    return 0;
  }

  switch (rule) {
    case "less-is-better": {
      const ratio = target > 0 ? Math.max(0, target - actual) / target : 0;
      return Math.max(0, Math.min(scoreCap, Math.round((1 - ratio) * scoreCap)));
    }
    case "equal-is-better": {
      return actual === target ? scoreCap : 0;
    }
    case "range": {
      if (minimumValue > maximumValue) return 0;
      if (actual <= minimumValue) return 0;
      if (actual >= maximumValue) return scoreCap;
      const range = maximumValue - minimumValue;
      return Math.max(0, Math.min(scoreCap, Math.round(((actual - minimumValue) / range) * scoreCap)));
    }
    case "milestone": {
      return actual >= target ? scoreCap : Math.round((actual / target) * scoreCap);
    }
    case "yes-no": {
      return actual > 0 ? scoreCap : 0;
    }
    case "more-is-better":
    default: {
      if (target <= 0) return 0;
      const ratio = Math.min(actual / target, 1);
      return Math.max(0, Math.min(scoreCap, Math.round(ratio * scoreCap)));
    }
  }
}
