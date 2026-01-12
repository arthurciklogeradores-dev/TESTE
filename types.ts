
export interface Fraction {
  n: number; // numerator
  d: number; // denominator
}

export type Operation = '+' | '-' | '*' | '/' | null;

export interface CalculationResult {
  expression: string;
  result: Fraction;
  decimal: number;
  steps?: string[];
}

export interface HistoryItem extends CalculationResult {
  id: string;
  timestamp: number;
}
