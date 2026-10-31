import React from 'react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { GitCommit, Eye, Clock, Calendar, ArrowRight } from 'lucide-react';

export const SubscriptionTable = ({
  subscriptions = [],
  onManageStatus,
  onViewDetails,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Loading subscription records...
        </span>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="p-12 border border-slate-800 bg-slate-900/40 rounded-xl text-center">
        <GitCommit className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-200">No subscriptions matching filter</h3>
        <p className="text-xs text-slate-400 mt-1">Adjust search query or create a new subscription.</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-800 rounded-xl bg-slate-900 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
            <tr>
              <th className="py-3 px-4">Subscription #</th>
              <th className="py-3 px-4">Subscriber Organization</th>
              <th className="py-3 px-4">Plan & Services</th>
              <th className="py-3 px-4">Cadence</th>
              <th className="py-3 px-4">Next Renewal</th>
              <th className="py-3 px-4">Gross Total</th>
              <th className="py-3 px-4">Lifecycle Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {subscriptions.map((sub) => {
              const primaryItem = sub.lineItems?.[0];
              const remainingCount = (sub.lineItems?.length || 1) - 1;

              return (
                <tr
                  key={sub.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Subscription Number */}
                  <td className="py-3.5 px-4 font-mono text-indigo-400 font-semibold">
                    {sub.subscriptionNumber}
                  </td>

                  {/* Customer / Organization */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-100">{sub.customer}</div>
                    <div className="text-[11px] font-mono text-slate-400">{sub.customerEmail}</div>
                  </td>

                  {/* Service Plan */}
                  <td className="py-3.5 px-4">
                    <div className="text-slate-200 font-medium">
                      {primaryItem?.productName || 'Custom Service Tier'}
                    </div>
                    {primaryItem?.variantName && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span className="truncate max-w-[160px]">{primaryItem.variantName}</span>
                        {remainingCount > 0 && (
                          <span className="font-mono text-indigo-400">+{remainingCount} more</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Billing Cadence */}
                  <td className="py-3.5 px-4">
                    <span className="capitalize font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {sub.billingCycle}
                    </span>
                  </td>

                  {/* Next Renewal Date */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-slate-200">{sub.nextBillingDate}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Terms: {sub.paymentTerms || 'Net 30'}
                    </div>
                  </td>

                  {/* Gross Total */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-100 text-sm">
                    ₹{Math.round(sub.totalAmount || 0).toLocaleString('en-IN')}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    <Badge variant={sub.status} dot>
                      {sub.status}
                    </Badge>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={GitCommit}
                        onClick={() => onManageStatus(sub)}
                      >
                        Pipeline
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={() => onViewDetails(sub)}
                      >
                        Details
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscriptionTable;

