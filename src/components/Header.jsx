import React from 'react';
import {
  WashingMachine,
  QrCode,
  Bell,
  Volume2,
  VolumeX,
  UserCog,
  Wifi,
  WifiOff,
} from 'lucide-react';

export function Header({
  users,
  currentUser,
  onSelectUser,
  onOpenProfile,
  onOpenQR,
  onOpenNotifications,
  unreadCount,
  isMuted,
  onToggleMute,
  isLive,
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <WashingMachine className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Hostel Laundry Tracker
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  isLive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
                title={isLive ? 'Connected to Supabase Realtime' : 'Local Demo Mode (add .env keys for live sync)'}
              >
                {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {isLive ? 'Live' : 'Demo'}
              </span>
            </div>
            <p className="text-xs text-slate-500">5 Machines • 10-Student Cohort</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <select
              aria-label="Switch Student Profile"
              value={currentUser?.id || ''}
              onChange={(e) => {
                const found = users.find((u) => u.id === e.target.value);
                if (found) onSelectUser(found);
              }}
              className="bg-transparent text-xs sm:text-sm font-medium text-slate-800 px-2 py-1 focus:outline-none max-w-[150px] sm:max-w-[190px]"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.room_number})
                </option>
              ))}
            </select>
            <button
              onClick={onOpenProfile}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-indigo-600 transition"
              title="Edit My Profile / Login"
            >
              <UserCog className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenQR}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan QR</span>
          </button>

          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            title={isMuted ? 'Unmute completion chime' : 'Mute completion chime'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
