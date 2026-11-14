import React from 'react';
import { X, Bell, MessageCircle, CheckCheck } from 'lucide-react';
import { formatRelativeTime } from '../lib/utils';

export function NotificationDrawer({
  isOpen,
  notifications,
  currentUserId,
  onClose,
  onMarkAllRead,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500">
              No notifications yet. Completed washes and pickup reminders will appear here.
            </div>
          ) : (
            notifications.map((n) => {
              const isRead = Array.isArray(n.read_by) && n.read_by.includes(currentUserId);
              return (
                <div
                  key={n.id}
                  className={`rounded-2xl border p-3.5 space-y-2 transition ${
                    isRead ? 'bg-white border-slate-200' : 'bg-indigo-50/50 border-indigo-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900">{n.title}</h3>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{n.message}</p>
                  {n.wa_url && (
                    <a
                      href={n.wa_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      {n.wa_label || 'Open WhatsApp'}
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
