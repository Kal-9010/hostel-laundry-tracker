import React from 'react';
import { History } from 'lucide-react';
import { formatClockTime, formatRelativeTime } from '../lib/utils';

export function WashRecordsTab({ sessions }) {
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
        No wash records yet. Start a cycle on any machine to log it here.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
        <History className="w-4 h-4 text-indigo-600" />
        <h2 className="text-sm font-bold text-slate-900">Recent Wash Records</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {sessions.map((s) => (
          <div key={s.id} className="p-4 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <div className="font-bold text-slate-900">
                Machine {s.machine_id} • {s.cycle_type}
              </div>
              <div className="text-slate-500 mt-0.5">
                {s.user_name} ({s.room_number}) • {s.duration_label}
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  s.status === 'IN_USE'
                    ? 'bg-amber-100 text-amber-800'
                    : s.status === 'COMPLETED'
                    ? 'bg-blue-100 text-blue-800'
                    : s.status === 'PICKED_UP'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {s.status}
              </span>
              <div className="text-[11px] text-slate-400 mt-1">
                {formatClockTime(s.start_time)} • {formatRelativeTime(s.start_time)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
