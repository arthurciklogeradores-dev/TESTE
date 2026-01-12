
import { Fraction } from '../types';
import { addFractions, subtractFractions, multiplyFractions, divideFractions, simplify } from '../utils/math';

export function parseLocalFractions(input: string) {
  const normalized = input.toLowerCase()
    .replace(/mais|\+/g, '+')
    .replace(/menos|\-/g, '-')
    .replace(/vezes|multiplicado por|\*/g, '*')
    .replace(/dividido por|dividido|\//g, '/');

  const fractionRegex = /(\d+)\/(\d+)|(\d+)/g;
  const matches = normalized.match(fractionRegex);
  
  if (!matches || matches.length < 2) {
    throw new Error("Não consegui entender as frações.");
  }

  const getFrac = (str: string): Fraction => {
    if (str.includes('/')) {
      const [n, d] = str.split('/').map(Number);
      return { n, d };
    }
    return { n: Number(str), d: 1 };
  };

  const f1 = getFrac(matches[0]);
  const f2 = getFrac(matches[1]);
  
  let result: Fraction;
  let op = '';

  if (normalized.includes('+')) { result = addFractions(f1, f2); op = '+'; }
  else if (normalized.includes('-')) { result = subtractFractions(f1, f2); op = '-'; }
  else if (normalized.includes('*')) { result = multiplyFractions(f1, f2); op = '*'; }
  else { result = divideFractions(f1, f2); op = '/'; }

  return {
    explanation: "Processado localmente (Modo Offline).",
    numerator: result.n,
    denominator: result.d,
    expression: `${matches[0]} ${op} ${matches[1]}`
  };
}
