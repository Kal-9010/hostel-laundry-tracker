import React, { useState } from 'react';
import { X, AlertTriangle, Play, WashingMachine } from 'lucide-react';

const CYCLE_TYPES = ['Wash Cycle', 'Dry / Spin Cycle', 'Wash + Dry'];
const PRESETS = [
  { label: '10 sec (Quick Demo)', seconds: 10 },
  { label: '30 mins', seconds: 30 * 60 },
  { label: '45 mins', seconds: 45 * 60 },
  { label: '60 mins', seconds: 60 * 60 },
];

export function CycleSetupModal({
  machine,
  occupant,
  currentUser,
  userActiveCount,
  onClose,
  onStartCycle,
}) {
  const [cycleType, setCycleType] = useState('Wash Cycle');
  const [selectedPreset, setSelectedPreset] = useState(45 * 60);
  const [customMins, setCustomMins] = useState('');
  const [overrideChecked, setOverrideChecked] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!machine) return null;

  const isBusy = machine.status === 'IN_USE' || machine.status === 'COMPLETED';
  const isOutOfOrder = machine.status === 'OUT_OF_ORDER';
  const hitsConcurrentLimit = userActiveCount >= 2 && (!isBusy || machine.current_user_id !== currentUser?.id);

  const durationSeconds =
    customMins.trim() !== ''
      ? Math.min(180, Math.max(1, parseInt(customMins, 10) || 1)) * 60
      : selectedPreset;

  const durationLabel =
    customMins.trim() !== ''
      ? `${Math.min(180, Math.max(1, parseInt(customMins, 10) || 1))} mins`
      : PRESETS.find((p) => p.seconds === selectedPreset)?.label || '45 mins';

  const canSubmit =
    !isOutOfOrder &&
    !hitsConcurrentLimit &&
    (!isBusy || overrideChecked) &&
    !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onStartCycle({
        machine,
        cycleType,
        durationSeconds,
        durationLabel,
        whatsappOptIn,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <WashingMachine className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Start {machine.label}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {isOutOfOrder && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                This machine is currently marked <strong>Out of Order</strong>. Resolve the open grievance before starting a cycle.
              </span>
            </div>
          )}

          {hitsConcurrentLimit && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                Concurrent limit reached: You already have <strong>2 machines IN_USE</strong>. Please wait for one to finish.
              </span>
            </div>
          )}

          {isBusy && !isOutOfOrder && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>{machine.label}</strong> is currently {machine.status === 'COMPLETED' ? 'waiting for pickup' : 'in use'} by{' '}
                  <strong>{occupant ? `${occupant.name} (${occupant.room_number})` : 'another student'}</strong>.
                </span>
              </div>
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={overrideChecked}
                  onChange={(e) => setOverrideChecked(e.target.checked)}
                  className="rounded border-amber-400 text-indigo-600"
                />
                Yes, override existing session
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Cycle Type</label>
            <div className="grid grid-cols-3 gap-2">
              {CYCLE_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setCycleType(type)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition ${
                    cycleType === type
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Duration</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => {
                    setSelectedPreset(preset.seconds);
                    setCustomMins('');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    customMins === '' && selectedPreset === preset.seconds
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              max="180"
              placeholder="Or enter custom minutes (1–180)"
              value={customMins}
              onChange={(e) => setCustomMins(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappOptIn}
              onChange={(e) => setWhatsappOptIn(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600"
            />
            Enable WhatsApp wash receipt & completion alerts
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Play className="w-4 h-4" />
            {submitting ? 'Starting...' : `Start ${cycleType}`}
          </button>
        </form>
      </div>
    </div>
  );
}
