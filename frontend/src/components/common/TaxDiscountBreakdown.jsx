import React from 'react';
import { Percent, Receipt, ShieldCheck } from 'lucide-react';

export const TaxDiscountBreakdown = ({
  subtotal = 0,
  discountType = 'percentage', // 'percentage' | 'fixed'
  discountValue = 0,
  taxRate = 18, // 18% standard GST
  taxName = 'GST (CGST 9% + SGST 9%)',
  currency = '₹',
  className = '',
}) => {
  const numericSubtotal = Number(subtotal) || 0;
  const numDiscountVal = Number(discountValue) || 0;

  // Calculate Discount Amount
  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = (numericSubtotal * Math.min(100, Math.max(0, numDiscountVal))) / 100;
  } else {
    discountAmount = Math.min(numericSubtotal, Math.max(0, numDiscountVal));
  }

  const taxableAmount = Math.max(0, numericSubtotal - discountAmount);
  const taxAmount = (taxableAmount * (Number(taxRate) || 0)) / 100;
  const grossTotal = taxableAmount + taxAmount;

  return (
    <div
      className={`p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs ${className}`}
    >
      <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] uppercase tracking-wider pb-2 border-b border-slate-800">
        <span className="flex items-center gap-1.5 font-semibold text-slate-300">
          <Receipt className="w-3.5 h-3.5 text-indigo-400" />
          Statutory Tax & Discount Ledger
        </span>
        <span className="text-slate-400">Rule: B2B GST 18%</span>
      </div>

      {/* Subtotal */}
      <div className="flex items-center justify-between">
        <span className="text-slate-400">Gross Line Items Subtotal</span>
        <span className="font-mono text-slate-200 font-semibold">
          {currency}{numericSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Discount */}
      {discountAmount > 0 && (
        <div className="flex items-center justify-between text-emerald-400">
          <span className="flex items-center gap-1">
            <Percent className="w-3 h-3" />
            Applied Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'})
          </span>
          <span className="font-mono font-semibold">
            -{currency}{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Net Taxable Basis */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-slate-300 font-mono text-[11px]">
        <span>Net Taxable Base</span>
        <span>{currency}{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>

      {/* Tax Component */}
      <div className="flex items-center justify-between text-slate-300">
        <span className="text-slate-400">{taxName}</span>
        <span className="font-mono text-slate-200">
          +{currency}{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Final Total */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-800 text-sm">
        <span className="font-semibold text-white">Invoice Gross Payable</span>
        <span className="font-mono text-base font-bold text-emerald-400">
          {currency}{grossTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
};

export default TaxDiscountBreakdown;

