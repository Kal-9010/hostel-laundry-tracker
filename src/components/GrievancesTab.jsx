import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, Plus, Wrench } from 'lucide-react';
import { buildWaUrl, formatRelativeTime } from '../lib/utils';

export function GrievancesTab({
  grievances,
  onOpenReportModal,
  onResolveGrievance,
}) {
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [machineFilter, setMachineFilter] = useState('ALL');
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const filtered = grievances.filter((g) => {
    if (statusFilter !== 'ALL' && g.status !== statusFilter) return false;
    if (machineFilter !== 'ALL' && String(g.machine_id) !== machineFilter) return false;
    return true;
  });

  const handleConfirmResolve = async (g) => {
    await onResolveGrievance(g, resolutionNote.trim() || 'Resolved by student/caretaker');
    setResolvingId(null);
    setResolutionNote('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {['OPEN', 'RESOLVED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'OPEN' ? 'Open' : 'Resolved'}
            </button>
          ))}

          <select
            value={machineFilter}
            onChange={(e) => setMachineFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Machines</option>
            {[1, 2, 3, 4, 5].map((id) => (
              <option key={id} value={String(id)}>
                Machine {id}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onOpenReportModal(1)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
        >
          <Plus className="w-4 h-4" />
          Report Issue
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          No {statusFilter.toLowerCase()} grievances found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((g) => {
            const waText = `🛠️ *Hostel Laundry Issue*\nMachine: Machine ${g.machine_id}\nCategory: ${g.category}\nSeverity: ${g.severity}\nDetails: ${g.description || 'N/A'}\nReported by: ${g.reported_by_name} (${g.reported_by_room})`;
            return (
              <div
                key={g.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                      Machine {g.machine_id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        g.severity === 'OUT_OF_ORDER'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {g.severity === 'OUT_OF_ORDER' ? 'Out of Order' : 'Advisory'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        g.status === 'OPEN'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {g.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{formatRelativeTime(g.created_at)}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{g.category}</h3>
                  {g.description && <p className="text-xs text-slate-600 mt-0.5">{g.description}</p>}
                </div>

                <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    Reported by: <strong>{g.reported_by_name} ({g.reported_by_room})</strong>
                  </span>
                  {g.prior_user_name && (
                    <span>
                      Prior user: <strong>{g.prior_user_name} ({g.prior_user_room})</strong>
                    </span>
                  )}
                </div>

                {g.status === 'RESOLVED' && g.resolution_note && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900">
                    <strong>Resolved by {g.resolved_by}:</strong> {g.resolution_note}
                  </div>
                )}

                {g.status === 'OPEN' && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    {resolvingId === g.id ? (
                      <div className="w-full flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="Resolution note (e.g. Drum cleaned / Technician fixed)"
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                        />
                        <button
                          onClick={() => handleConfirmResolve(g)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                        >
                          Confirm Resolve
                        </button>
                        <button
                          onClick={() => setResolvingId(null)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setResolvingId(g.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Resolved
                        </button>
                        <a
                          href={buildWaUrl('', waText)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Share on WhatsApp
                        </a>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
