import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertOctagon,
  RotateCcw,
  Send,
  FileCheck,
  Zap,
} from 'lucide-react';
import { ALLOWED_TRANSITIONS } from '../../services/subscriptionService';

const PIPELINE_STAGES = [
  { key: 'draft', label: 'Draft', desc: 'Initial proposal & configuration' },
  { key: 'quotation', label: 'Quotation', desc: 'Sent to client for approval' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Client signed agreement' },
  { key: 'active', label: 'Active', desc: 'Service provisioned & billing' },
  { key: 'closed', label: 'Closed', desc: 'Completed or terminated' },
];

const TRANSITION_METADATA = {
  quotation: {
    label: 'Generate & Send Quotation',
    icon: Send,
    variant: 'primary',
    desc: 'Locks product configuration and prepares client review quote.',
  },
  confirmed: {
    label: 'Confirm Subscription Agreement',
    icon: FileCheck,
    variant: 'primary',
    desc: 'Validates client authorization and schedules recurring ledger generation.',
  },
  active: {
    label: 'Activate Service & Start Billing',
    icon: Zap,
    variant: 'primary',
    desc: 'Transitions cluster to live state and triggers initial recurring invoice.',
  },
  draft: {
    label: 'Revert to Draft Revision',
    icon: RotateCcw,
    variant: 'outline',
    desc: 'Unlocks line items for pricing adjustments or re-negotiation.',
  },
  closed: {
    label: 'Terminate / Close Subscription',
    icon: AlertOctagon,
    variant: 'danger',
    desc: 'Stops automated renewals and marks contract as finalized.',
  },
};

export const StatusFlowModal = ({
  isOpen,
  onClose,
  subscription,
  onTransition,
}) => {
  const [transitionNote, setTransitionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!subscription) return null;

  const currentStatus = subscription.status?.toLowerCase() || 'draft';
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
  const currentStageIndex = PIPELINE_STAGES.findIndex((s) => s.key === currentStatus);

  const handleExecuteTransition = async (targetStatus) => {
    setIsSubmitting(true);
    try {
      await onTransition(subscription.id, targetStatus, transitionNote);
      setTransitionNote('');
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to transition subscription state');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Lifecycle Pipeline: ${subscription.subscriptionNumber}`}
      subtitle={`Subscriber: ${subscription.customer} • Total: ₹${subscription.totalAmount?.toLocaleString('en-IN')}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Visual Workflow Pipeline Stepper */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block mb-3">
            Workflow Stage Progression
          </span>

          <div className="flex items-center justify-between relative">
            {/* Background connecting track */}
            <div className="absolute left-6 right-6 top-3 h-0.5 bg-slate-800 -z-0" />

            {PIPELINE_STAGES.map((stage, idx) => {
              const isCurrent = stage.key === currentStatus;
              const isPast = idx < currentStageIndex && currentStatus !== 'closed';
              const isClosed = stage.key === 'closed' && currentStatus === 'closed';

              let circleClasses = 'bg-slate-900 border-slate-700 text-slate-500';
              let textClasses = 'text-slate-500';

              if (isCurrent) {
                circleClasses = isClosed
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 ring-2 ring-rose-500/30'
                  : 'bg-indigo-600 border-indigo-400 text-white ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-600/30';
                textClasses = 'text-white font-bold';
              } else if (isPast) {
                circleClasses = 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
                textClasses = 'text-slate-300';
              }

              return (
                <div key={stage.key} className="flex flex-col items-center relative z-10 text-center flex-1">
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-mono transition-all ${circleClasses}`}
                  >
                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className={`text-[11px] font-mono uppercase mt-1.5 ${textClasses}`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current State Status Banner */}
        <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 mr-2">Current Active Status:</span>
            <Badge variant={currentStatus} dot>
              {currentStatus}
            </Badge>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            Billing Cadence: <span className="uppercase text-slate-200 font-semibold">{subscription.billingCycle}</span>
          </div>
        </div>

        {/* Transition Action Buttons */}
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-2">
            Permitted State Actions
          </span>

          {allowedNext.length === 0 ? (
            <p className="text-xs text-slate-500 p-3 bg-slate-950 rounded-lg border border-slate-800">
              No further automatic state transitions available for this subscription.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {allowedNext.map((targetKey) => {
                const meta = TRANSITION_METADATA[targetKey] || {
                  label: `Transition to ${targetKey.toUpperCase()}`,
                  variant: 'primary',
                  desc: '',
                };
                const Icon = meta.icon || ArrowRight;

                return (
                  <div
                    key={targetKey}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                        <span>{meta.label}</span>
                        <span className="font-mono text-[10px] uppercase text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                          ➔ {targetKey}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{meta.desc}</p>
                    </div>

                    <Button
                      variant={meta.variant}
                      size="sm"
                      loading={isSubmitting}
                      icon={Icon}
                      onClick={() => handleExecuteTransition(targetKey)}
                    >
                      Execute
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Operational Transition Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Audit Log / Transition Note (Optional)
          </label>
          <textarea
            rows={2}
            value={transitionNote}
            onChange={(e) => setTransitionNote(e.target.value)}
            placeholder="e.g. Authorized by client procurement officer on Oct 31, 2026..."
            className="block w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
          />
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Pipeline Controller
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default StatusFlowModal;

