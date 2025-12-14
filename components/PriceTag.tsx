
import React from 'react';
import { Currency } from '../types';

interface PriceTagProps {
  amount: number;
  currency: Currency;
}

const PriceTag: React.FC<PriceTagProps> = ({ amount, currency }) => {
  const formatValue = (val: number) => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-1">
        <span className="text-[28px] font-bold text-black tracking-tight leading-none">
          {currency === 'USD' ? `$${formatValue(amount)}` : `${formatValue(amount)}`}
        </span>
        <span className="text-base font-medium text-black/70">
          {currency === 'UZS' ? 'сум' : ''}/мес
        </span>
      </div>
    </div>
  );
};

export default PriceTag;
