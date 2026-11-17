/** Calculadora de ahorro — lógica pura (compartida por la UI y los tests). */
export const WEEKS_PER_MONTH = 4.33;
export const SCENARIOS = [20, 40, 60] as const;

export interface CalcInput {
  employees: number;
  weeklyHours: number; // horas semanales por empleado en tareas repetitivas
  hourlyCost: number; // €/hora
  automationPct: number; // 0–100
}

export interface CalcResult {
  monthlyHours: number;
  monthlyCost: number;
  annualCost: number;
  monthlySaving: number;
  annualSaving: number;
  hoursFreedMonthly: number;
}

const clamp = (n: number, min: number, max: number) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;

export function sanitize(input: CalcInput): CalcInput {
  return {
    employees: Math.round(clamp(input.employees, 1, 10000)),
    weeklyHours: clamp(input.weeklyHours, 0, 60),
    hourlyCost: clamp(input.hourlyCost, 0, 500),
    automationPct: clamp(input.automationPct, 0, 100),
  };
}

export function calculate(raw: CalcInput): CalcResult {
  const i = sanitize(raw);
  const monthlyHours = i.employees * i.weeklyHours * WEEKS_PER_MONTH;
  const monthlyCost = monthlyHours * i.hourlyCost;
  const annualCost = monthlyCost * 12;
  const ratio = i.automationPct / 100;
  return {
    monthlyHours,
    monthlyCost,
    annualCost,
    monthlySaving: monthlyCost * ratio,
    annualSaving: annualCost * ratio,
    hoursFreedMonthly: monthlyHours * ratio,
  };
}
