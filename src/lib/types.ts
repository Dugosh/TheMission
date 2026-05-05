export type DailyLog = {
  date: string; // YYYY-MM-DD
  no_vape: boolean;
  no_porn: boolean;
  no_weed: boolean;
  no_processed_food: boolean;
  no_alcohol: boolean;
  pullups_done: boolean;
  steps: number;
  cardio_type: string | null;
  lifting_type: string | null;
  sauna: boolean;
  water_gallon: boolean;
  water_oz: number | null;
  finished_eating_by_730: boolean;
  focused_work_hours: number;
  meal_1: boolean;
  meal_2: boolean;
  meal_3: boolean;
  refeed_day: boolean;
  refeed_extra_carbs_g: number | null;
  weight_lbs: number | null;
  notes: string | null;
};

export const SUBTRACTIONS: { key: keyof DailyLog; label: string }[] = [
  { key: "no_vape", label: "No vape" },
  { key: "no_porn", label: "No porn / masturbation" },
  { key: "no_weed", label: "No weed" },
  { key: "no_processed_food", label: "No processed food" },
  { key: "no_alcohol", label: "No alcohol" },
];

export const CARDIO_OPTIONS = ["incline_walk", "run", "rest"] as const;
export const LIFTING_OPTIONS = ["push", "pull", "legs", "rest"] as const;

export const CARDIO_LABEL: Record<string, string> = {
  incline_walk: "Incline walk",
  run: "Run",
  rest: "Rest",
};
export const LIFTING_LABEL: Record<string, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  rest: "Rest",
};

export type Todo = {
  id: string;
  title: string;
  category: "business" | "fitness" | "financial" | "personal";
  priority: "high" | "medium" | "low";
  completed: boolean;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
};

export type RevenueEntry = {
  id: string;
  month: string; // YYYY-MM-01
  amount: number;
};

export type Debt = {
  id: string;
  name: string;
  initial_balance: number;
  display_order: number;
  archived: boolean;
};

export type DebtPayment = {
  id: string;
  date: string;
  debt_id: string;
  amount: number;
  notes: string | null;
};

export type SavingsSnapshot = {
  id: string;
  date: string;
  balance: number;
};

export type GoalsState = {
  id: number;
  online_business_status: "ideation" | "planning" | "building" | "launched";
  online_business_notes: string | null;
  equity_status: "identifying" | "due_diligence" | "negotiation" | "invested";
  equity_notes: string | null;
};

// Constants from spec
export const WEIGHT_START = 185;
export const WEIGHT_TARGET = 145;
export const WEIGHT_DEADLINE = "2026-12-31";

export const REVENUE_MIN = 3_000_000;
export const REVENUE_STRETCH = 4_000_000;
export const REVENUE_YEAR = 2026;

export const SAVINGS_TARGET = 100_000;

export const ONLINE_BUSINESS_STAGES = [
  "ideation",
  "planning",
  "building",
  "launched",
] as const;
export const EQUITY_STAGES = [
  "identifying",
  "due_diligence",
  "negotiation",
  "invested",
] as const;
