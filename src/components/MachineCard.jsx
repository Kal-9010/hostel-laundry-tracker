import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wrench,
  QrCode,
  Phone,
  MessageCircle,
  FastForward,
  StopCircle,
  PackageCheck,
  BellRing,
  Flag,
  CalendarPlus,
} from 'lucide-react';
import { formatTimeLeft, formatClockTime, formatRelativeTime, buildWaUrl, cleanPhone10, downloadReminderIcs } from '../lib/utils';

export function MachineCard({
  machine,
  users,
  currentUser,
  advisoryGrievances,
  outOfOrderGrievance,
  onStartScan,
  onEndEarly,
  onFastForward5s,
  onMarkPickedUp,
  onSendPickupReminder,
  onNudgePeer,
  onReportIssue,
  onResolveIssue,
}) {
  const occupant = users.find((u) => u.id === machine.current_user_id);
  const isOwner = currentUser && machine.current_user_id === currentUser.id;

  const totalSec = machine.duration_seconds || 1;
  const remainingMs = machine.end_time ? Math.max(0, new Date(machine.end_time).getTime() - Date.now()) : 0;
  const remainingSec = Math.floor(remainingMs / 1000);
  const progressPct = Math.min(100, Math.max(0, ((totalSec - remainingSec) / totalSec) * 100));

  const statusStyles = {
    AVAILABLE: {
      border: 'border-emerald-200',
      bg: 'bg-white',
      badge: 'bg-emerald-100 text-emerald-800',
      label: 'Ready to Use',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    },
    IN_USE: {
      border: 'border-amber-300',
      bg: 'bg-amber-50/30',
      badge: 'bg-amber-100 text-amber-800',
      label: machine.cycle_type || 'In Use',
      icon: <Clock className="w-4 h-4 text-amber-600 animate-pulse" />,
    },
    COMPLETED: {
      border: 'border-blue-400 ring-2 ring-blue-200',
      bg: 'bg-blue-50/40',
      badge: 'bg-blue-100 text-blue-800 animate-pulse',
      label: 'Pickup Ready',
      icon: <BellRing className="w-4 h-4 text-blue-600" />,
    },
    OUT_OF_ORDER: {
      border: 'border-rose-300',
      bg: 'bg-rose-50/40',
      badge: 'bg-rose-100 text-rose-800',
      label: 'Out of Order',
      icon: <Wrench className="w-4 h-4 text-rose-600" />,
    },
  };

  const style = statusStyles[machine.status] || statusStyles.AVAILABLE;

  const receiptMsg = `🧺 *Hostel Laundry Receipt*\nMachine: ${machine.label}\nCycle: ${machine.cycle_type}\nEnds at: ${formatClockTime(machine.end_time)}\nStudent: ${occupant?.name || currentUser?.name} (${occupant?.room_number || currentUser?.room_number})`;

  const completionMsg = `✅ *Laundry Done!*\n${machine.label} (${machine.cycle_type}) has finished. Please pick up your clothes from the laundry room.`;

  const nudgeMsg = `👋 Hi ${occupant?.name || 'there'}, your laundry in *${machine.label}* is finished and waiting for pickup! Could you please collect it so others can use the machine?`;

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} p-4 shadow-sm flex flex-col justify-between gap-3 transition`}>
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900">{machine.label}</span>
            {isOwner && (machine.status === 'IN_USE' || machine.status === 'COMPLETED') && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-semibold">
                Your Wash
              </span>
            )}
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${style.badge}`}>
            {style.icon}
            {style.label}
          </span>
        </div>

        {/* Advisory Warning Strip */}
        {advisoryGrievances.length > 0 && machine.status !== 'OUT_OF_ORDER' && (
          <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Advisory: </span>
              {advisoryGrievances[0].category}
              {advisoryGrievances[0].description ? ` — ${advisoryGrievances[0].description}` : ''}
            </div>
          </div>
        )}

        {/* AVAILABLE STATE */}
        {machine.status === 'AVAILABLE' && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-slate-600">
              Machine is clean and ready for the next load.
            </p>
            {machine.last_user_name && (
              <p className="text-xs text-slate-500">
                Last used by <span className="font-medium text-slate-700">{machine.last_user_name}</span>{' '}
                {machine.last_used_at ? `(${formatRelativeTime(machine.last_used_at)})` : ''}
              </p>
            )}
            <button
              onClick={() => onStartScan(machine.id)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition shadow-sm"
            >
              <QrCode className="w-4 h-4" />
              Scan QR to Start Wash
            </button>
          </div>
        )}

        {/* IN_USE STATE */}
        {machine.status === 'IN_USE' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-amber-200">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Time Remaining
                </p>
                <p className="text-2xl font-mono font-bold text-slate-900">
                  {formatTimeLeft(machine.end_time)}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-semibold">
                  Available Again At {formatClockTime(machine.end_time)}
                </span>
              </div>
            </div>

            <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="text-xs text-slate-600 flex items-center justify-between">
              <span>
                Occupant:{' '}
                <strong className="text-slate-900">
                  {occupant ? `${occupant.name} (${occupant.room_number})` : 'Student'}
                </strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {isOwner && (
                <>
                  <button
                    onClick={() => onEndEarly(machine)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition"
                  >
                    <StopCircle className="w-3.5 h-3.5" />
                    End Cycle Early
                  </button>
                  <a
                    href={buildWaUrl(occupant?.phone_number || currentUser?.phone_number, receiptMsg)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Wash Receipt
                  </a>
                </>
              )}

              {!isOwner && occupant && (
                <>
                  <a
                    href={`tel:+91${cleanPhone10(occupant.phone_number)}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>
                  <a
                    href={buildWaUrl(occupant.phone_number, `Hi ${occupant.name}, checking on ${machine.label} in the hostel laundry room.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                </>
              )}

              <button
                onClick={() => downloadReminderIcs(machine.label, machine.cycle_type, machine.end_time)}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                title="Add to Phone Calendar / Reminders"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                Remind Me
              </button>

              <button
                onClick={() => onFastForward5s(machine)}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition"
                title="Fast-forward timer to 5 seconds for quick demo"
              >
                <FastForward className="w-3.5 h-3.5" />
                5s Demo
              </button>
            </div>
          </div>
        )}

        {/* COMPLETED STATE */}
        {machine.status === 'COMPLETED' && (
          <div className="space-y-3">
            <div className="bg-blue-100/70 border border-blue-200 rounded-xl p-3">
              <p className="text-sm font-bold text-blue-900">
                {machine.cycle_type?.includes('Dry')
                  ? 'Clothes Dried & Ready!'
                  : 'Clothes Washed & Ready!'}
              </p>
              <p className="text-xs text-blue-800 mt-0.5">
                Owner:{' '}
                <strong>
                  {occupant ? `${occupant.name} (${occupant.room_number})` : 'Student'}
                </strong>
              </p>
              {machine.last_nudged_at && (
                <p className="text-[11px] text-blue-700 mt-1">
                  Last nudged by {machine.last_nudged_by} ({formatRelativeTime(machine.last_nudged_at)})
                </p>
              )}
            </div>

            <button
              onClick={() => onMarkPickedUp(machine)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              <PackageCheck className="w-4 h-4" />
              Mark Clothes Picked Up
            </button>

            <div className="flex flex-wrap gap-2">
              {isOwner ? (
                <>
                  <button
                    onClick={() => onSendPickupReminder(machine, occupant)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-50 transition"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    Pickup Reminder
                  </button>
                  <a
                    href={buildWaUrl(occupant?.phone_number || currentUser?.phone_number, completionMsg)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WA Alert
                  </a>
                </>
              ) : (
                occupant && (
                  <>
                    <a
                      href={`tel:+91${cleanPhone10(occupant.phone_number)}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                    <button
                      onClick={() => onNudgePeer(machine, occupant, nudgeMsg)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp Nudge
                    </button>
                  </>
                )
              )}
            </div>
          </div>
        )}

        {/* OUT_OF_ORDER STATE */}
        {machine.status === 'OUT_OF_ORDER' && (
          <div className="space-y-3">
            <div className="bg-rose-100/70 border border-rose-200 rounded-xl p-3 text-xs text-rose-900">
              <p className="font-bold text-sm mb-1">
                {outOfOrderGrievance?.category || 'Machine Out of Order'}
              </p>
              {outOfOrderGrievance?.description && (
                <p className="mb-1.5">{outOfOrderGrievance.description}</p>
              )}
              {outOfOrderGrievance && (
                <p className="text-[11px] text-rose-700">
                  Reported by {outOfOrderGrievance.reported_by_name} ({outOfOrderGrievance.reported_by_room})
                </p>
              )}
            </div>
            {outOfOrderGrievance && (
              <button
                onClick={() => onResolveIssue(outOfOrderGrievance)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition"
              >
                <Wrench className="w-4 h-4" />
                Review & Resolve Issue
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer: Report Issue */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={() => onReportIssue(machine.id)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 transition"
        >
          <Flag className="w-3.5 h-3.5" />
          Report Dirty / Broken / Issue
        </button>
        <span className="text-[11px] text-slate-400">#{machine.id}</span>
      </div>
    </div>
  );
}
