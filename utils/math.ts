
import { Fraction } from '../types';

export const gcd = (a: number, b: number): number => {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
};

export const simplify = (f: Fraction): Fraction => {
  if (f.d === 0) return f;
  const common = gcd(f.n, f.d);
  const sign = f.d < 0 ? -1 : 1;
  return {
    n: (f.n / common) * sign,
    d: Math.abs(f.d / common)
  };
};

export const addFractions = (a: Fraction, b: Fraction): Fraction => {
  return simplify({
    n: a.n * b.d + b.n * a.d,
    d: a.d * b.d
  });
};

export const subtractFractions = (a: Fraction, b: Fraction): Fraction => {
  return simplify({
    n: a.n * b.d - b.n * a.d,
    d: a.d * b.d
  });
};

export const multiplyFractions = (a: Fraction, b: Fraction): Fraction => {
  return simplify({
    n: a.n * b.n,
    d: a.d * b.d
  });
};

export const divideFractions = (a: Fraction, b: Fraction): Fraction => {
  return simplify({
    n: a.n * b.d,
    d: a.d * b.n
  });
};

export const formatFraction = (f: Fraction): string => {
  if (f.d === 1) return f.n.toString();
  if (f.n === 0) return "0";
  return `${f.n}/${f.d}`;
};

export const parseInput = (val: string): Fraction => {
  if (val.includes('/')) {
    const [n, d] = val.split('/').map(Number);
    return { n: n || 0, d: d || 1 };
  }
  return { n: Number(val) || 0, d: 1 };
};
