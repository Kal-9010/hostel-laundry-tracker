import React, { useState } from 'react';
import { X, AlertTriangle, Wrench } from 'lucide-react';

const CATEGORIES = [
  'Dirty Drum / Lint / Detergent Residue',
  'Machine Not Working / Error Code',
  'Water Drainage / Leak Issue',
  'Improper Use by Prior Person',
  'Clothes Left Inside / Uncollected',
  'Other',
];

const QUICK_TAGS = ['Lint buildup', 'Soap residue', 'Water leak', 'Error E3', 'Door jammed', 'Foul smell'];

export function GrievanceModal({
  isOpen,
  initialMachineId,
  machines,
  lastSessionByMachine,
  currentUser,
  onClose,
  onSubmit,
}) {
  const [machineId, setMachineId] = useState(initialMachineId || 1);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [severity, setSeverity] = useState('ADVISORY');
  const [description, setDescription] = useState('');
  const [attachPriorUser, setAttachPriorUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const priorSession = lastSessionByMachine?.[machineId];

  const handleTagClick = (tag) => {
    setDescription((prev) => (prev ? `${prev}, ${tag}` : tag));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        machine_id: Number(machineId),
        reported_by_name: currentUser?.name || 'Student',
        reported_by_room: currentUser?.room_number || 'N/A',
        prior_user_name: attachPriorUser && priorSession ? priorSession.user_name : null,
        prior_user_room: attachPriorUser && priorSession ? priorSession.room_number : null,
        category,
        severity,
        description: description.trim(),
      });
      setDescription('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900">Report Machine Issue / Grievance</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Machine</label>
            <select
              value={machineId}
              onChange={(e) => setMachineId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quick Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {priorSession && (
            <label className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={attachPriorUser}
                onChange={(e) => setAttachPriorUser(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span>
                Auto-attach prior user: <strong>{priorSession.user_name} ({priorSession.room_number})</strong>
              </span>
            </label>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Severity</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('ADVISORY')}
                className={`p-3 rounded-xl border text-left transition ${
                  severity === 'ADVISORY'
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">Advisory Warning</div>
                <div className="text-[11px] opacity-80">Shows warning strip, machine stays usable</div>
              </button>
              <button
                type="button"
                onClick={() => setSeverity('OUT_OF_ORDER')}
                className={`p-3 rounded-xl border text-left transition ${
                  severity === 'OUT_OF_ORDER'
                    ? 'border-rose-500 bg-rose-50 text-rose-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" />
                  Mark Out of Order
                </div>
                <div className="text-[11px] opacity-80">Locks machine until resolved</div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Submitting...' : 'Submit Grievance'}
          </button>
        </form>
      </div>
    </div>
  );
}
