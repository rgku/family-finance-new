export const EXPENSE_CATEGORIES = [
  { value: "Moradia", icon: "home" },
  { value: "Alimentação", icon: "restaurant" },
  { value: "Transporte", icon: "directions_car" },
  { value: "Lazer", icon: "movie" },
  { value: "Saúde", icon: "local_hospital" },
  { value: "Educação", icon: "school" },
  { value: "Bem estar", icon: "spa" },
  { value: "Restauração", icon: "local_cafe" },
  { value: "Outros", icon: "more_horiz" },
] as const;

export const INCOME_CATEGORIES = [
  { value: "Renda", icon: "work" },
  { value: "Salário", icon: "payments" },
  { value: "Investimentos", icon: "trending_up" },
  { value: "Outros", icon: "more_horiz" },
] as const;

export const GOAL_ICONS = [
  "savings",
  "home",
  "directions_car",
  "flight",
  "school",
  "celebration",
  "diamond",
  "局部",
  "build",
] as const;

export const DEFAULT_CATEGORIES = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]["value"];
export type IncomeCategory = typeof INCOME_CATEGORIES[number]["value"];
export type GoalIcon = typeof GOAL_ICONS[number];