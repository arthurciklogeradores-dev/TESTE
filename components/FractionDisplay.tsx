
import React from 'react';
import { Fraction } from '../types';

interface Props {
  fraction: Fraction;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FractionDisplay: React.FC<Props> = ({ fraction, size = 'md', className = '' }) => {
  const isWhole = fraction.d === 1;

  if (isWhole) {
    return <span className={`${size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg'} font-bold ${className}`}>{fraction.n}</span>;
  }

  const sizes = {
    sm: 'text-xs px-1',
    md: 'text-lg px-2',
    lg: 'text-2xl px-4'
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <span className={`${sizes[size]} font-medium`}>{fraction.n}</span>
      <div className="h-[1.5px] bg-indigo-400 w-full rounded-full" />
      <span className={`${sizes[size]} font-medium`}>{fraction.d}</span>
    </div>
  );
};

export default FractionDisplay;
