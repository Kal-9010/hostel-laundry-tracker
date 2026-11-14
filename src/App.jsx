import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  WashingMachine,
  History,
  AlertTriangle,
  MessageCircle,
  X,
  Info,
} from 'lucide-react';
import {
  supabase,
  isSupabaseConfigured,
  DEFAULT_MACHINES,
  DEFAULT_USERS,
} from './lib/supabase';
import {
  buildWaUrl,
  playChime,
  sendBrowserNotification,
} from './lib/utils';
import { Header } from './components/Header';
import { MachineCard } from './components/MachineCard';
import { QRScannerModal } from './components/QRScannerModal';
import { CycleSetupModal } from './components/CycleSetupModal';
import { ProfileModal } from './components/ProfileModal';
import { GrievanceModal } from './components/GrievanceModal';
import { GrievancesTab } from './components/GrievancesTab';
import { NotificationDrawer } from './components/NotificationDrawer';
import { WashRecordsTab } from './components/WashRecordsTab';

export function App() {
  const [machines, setMachines] = useState(DEFAULT_MACHINES);
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [sessions, setSessions] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [currentUserId, setCurrentUserId] = useState(() => {
    return localStorage.getItem('hlt_user_id') || DEFAULT_USERS[0].id;
  });

  const [activeTab, setActiveTab] = useState('machines');
  const [isMuted, setIsMuted] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [setupMachineId, setSetupMachineId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [grievanceModalMachineId, setGrievanceModalMachineId] = useState(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [, setTick] = useState(0);

  const completedTriggeredRef = useRef(new Set());
  const overdueTriggeredRef = useRef(new Set());

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) || users[0],
    [users, currentUserId]
  );

  // Request notification permission once
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Deep-link ?machine=1..5
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = parseInt(params.get('machine') || '', 10);
    if (m >= 1 && m <= 5) {
      setSetupMachineId(m);
    }
  }, []);

  // Load initial data + subscribe to Supabase Realtime
  const fetchAll = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const [mRes, uRes, sRes, gRes, nRes] = await Promise.all([
      supabase.from('machines').select('*').order('id', { ascending: true }),
      supabase.from('users').select('*').order('created_at', { ascending: true }),
      supabase.from('wash_sessions').select('*').order('start_time', { ascending: false }).limit(50),
      supabase.from('grievances').select('*').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(40),
    ]);

    if (mRes.data?.length) setMachines(mRes.data);
    if (uRes.data?.length) {
      setUsers(uRes.data);
      setCurrentUserId((prev) =>
        uRes.data.some((u) => u.id === prev) ? prev : uRes.data[0].id
      );
    }
    if (sRes.data) setSessions(sRes.data);
    if (gRes.data) setGrievances(gRes.data);
    if (nRes.data) setNotifications(nRes.data);
  }, []);

  useEffect(() => {
    fetchAll();
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('hlt-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wash_sessions' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grievances' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchAll)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  const pushNotification = useCallback(
    async ({ targetUserId, machineId, type, title, message, waUrl, waLabel }) => {
      const payload = {
        target_user_id: targetUserId || null,
        machine_id: machineId,
        type,
        title,
        message,
        wa_url: waUrl || null,
        wa_label: waLabel || null,
        read_by: [],
      };
      if (isSupabaseConfigured && supabase) {
        await supabase.from('notifications').insert(payload);
      } else {
        setNotifications((prev) => [
          { ...payload, id: `local-${Date.now()}`, created_at: new Date().toISOString() },
          ...prev,
        ]);
      }
    },
    []
  );

  // 1-second clock tick + 00:00 completion + 5-min overdue reminder
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      const now = Date.now();

      machines.forEach(async (m) => {
        if (m.status === 'IN_USE' && m.end_time) {
          const endMs = new Date(m.end_time).getTime();
          const key = `${m.id}-${m.end_time}`;
          if (now >= endMs && !completedTriggeredRef.current.has(key)) {
            completedTriggeredRef.current.add(key);
            const occupant = users.find((u) => u.id === m.current_user_id);
            const waUrl = buildWaUrl(
              occupant?.phone_number,
              `✅ *Laundry Done!*\n${m.label} (${m.cycle_type}) has finished. Please pick up your clothes!`
            );

            if (!isMuted) playChime();
            sendBrowserNotification(
              `${m.label} Finished!`,
              `${occupant?.name || 'Your'} ${m.cycle_type} is ready for pickup.`
            );
            setToast({
              title: `${m.label} Cycle Complete!`,
              message: `${occupant?.name || 'Student'}'s clothes are ready for pickup.`,
              waUrl,
            });

            if (isSupabaseConfigured && supabase) {
              await supabase.from('machines').update({ status: 'COMPLETED' }).eq('id', m.id);
              await supabase
                .from('wash_sessions')
                .update({ status: 'COMPLETED' })
                .eq('machine_id', m.id)
                .eq('status', 'IN_USE');
            } else {
              setMachines((prev) =>
                prev.map((item) => (item.id === m.id ? { ...item, status: 'COMPLETED' } : item))
              );
            }

            await pushNotification({
              targetUserId: m.current_user_id,
              machineId: m.id,
              type: 'COMPLETED',
              title: `${m.label} Finished`,
              message: `${occupant?.name || 'Your'} ${m.cycle_type} is complete. Please pick up your clothes.`,
              waUrl,
              waLabel: 'Send WhatsApp Alert',
            });
          }
        }

        if (m.status === 'COMPLETED' && m.end_time) {
          const endMs = new Date(m.end_time).getTime();
          const overdueKey = `overdue-${m.id}-${m.end_time}`;
          if (now - endMs >= 5 * 60 * 1000 && !overdueTriggeredRef.current.has(overdueKey)) {
            overdueTriggeredRef.current.add(overdueKey);
            const occupant = users.find((u) => u.id === m.current_user_id);
            const waUrl = buildWaUrl(
              occupant?.phone_number,
              `⏰ *Pickup Reminder:* Your clothes in *${m.label}* have been waiting for 5+ mins. Please collect them!`
            );
            await pushNotification({
              targetUserId: m.current_user_id,
              machineId: m.id,
              type: 'OVERDUE',
              title: `${m.label} Pickup Overdue`,
              message: `Clothes have been waiting 5+ minutes in ${m.label}.`,
              waUrl,
              waLabel: 'Send Pickup Reminder',
            });
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [machines, users, isMuted, pushNotification]);

  const handleSelectUser = (user) => {
    setCurrentUserId(user.id);
    localStorage.setItem('hlt_user_id', user.id);
  };

  const handleSaveProfile = async (updatedUser) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('users')
        .update({
          name: updatedUser.name,
          room_number: updatedUser.room_number,
          phone_number: updatedUser.phone_number,
        })
        .eq('id', updatedUser.id);
      if (error) throw error;
    } else {
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    }
  };

  const handleStartCycle = async ({ machine, cycleType, durationSeconds, durationLabel, whatsappOptIn }) => {
    const start = new Date();
    const end = new Date(start.getTime() + durationSeconds * 1000);

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('machines')
        .update({
          status: 'IN_USE',
          cycle_type: cycleType,
          current_user_id: currentUser.id,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          duration_seconds: durationSeconds,
          whatsapp_opt_in: whatsappOptIn,
          last_nudged_at: null,
          last_nudged_by: null,
        })
        .eq('id', machine.id);

      await supabase.from('wash_sessions').insert({
        machine_id: machine.id,
        user_id: currentUser.id,
        user_name: currentUser.name,
        room_number: currentUser.room_number,
        cycle_type: cycleType,
        duration_label: durationLabel,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'IN_USE',
      });
    } else {
      setMachines((prev) =>
        prev.map((m) =>
          m.id === machine.id
            ? {
                ...m,
                status: 'IN_USE',
                cycle_type: cycleType,
                current_user_id: currentUser.id,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                duration_seconds: durationSeconds,
                whatsapp_opt_in: whatsappOptIn,
                last_nudged_at: null,
                last_nudged_by: null,
              }
            : m
        )
      );
      setSessions((prev) => [
        {
          id: `local-${Date.now()}`,
          machine_id: machine.id,
          user_id: currentUser.id,
          user_name: currentUser.name,
          room_number: currentUser.room_number,
          cycle_type: cycleType,
          duration_label: durationLabel,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          status: 'IN_USE',
        },
        ...prev,
      ]);
    }
  };

  const handleEndEarly = async (machine) => {
    const occupant = users.find((u) => u.id === machine.current_user_id);
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('machines')
        .update({
          status: 'AVAILABLE',
          cycle_type: null,
          current_user_id: null,
          last_user_name: occupant?.name || currentUser?.name,
          last_used_at: new Date().toISOString(),
          start_time: null,
          end_time: null,
          duration_seconds: null,
        })
        .eq('id', machine.id);
      await supabase
        .from('wash_sessions')
        .update({ status: 'CANCELLED' })
        .eq('machine_id', machine.id)
        .eq('status', 'IN_USE');
    } else {
      setMachines((prev) =>
        prev.map((m) =>
          m.id === machine.id
            ? {
                ...m,
                status: 'AVAILABLE',
                cycle_type: null,
                current_user_id: null,
                last_user_name: occupant?.name || currentUser?.name,
                last_used_at: new Date().toISOString(),
                start_time: null,
                end_time: null,
                duration_seconds: null,
              }
            : m
        )
      );
    }
  };

  const handleFastForward5s = async (machine) => {
    const newEnd = new Date(Date.now() + 5000).toISOString();
    if (isSupabaseConfigured && supabase) {
      await supabase.from('machines').update({ end_time: newEnd }).eq('id', machine.id);
    } else {
      setMachines((prev) =>
        prev.map((m) => (m.id === machine.id ? { ...m, end_time: newEnd } : m))
      );
    }
  };

  const handleMarkPickedUp = async (machine) => {
    const occupant = users.find((u) => u.id === machine.current_user_id);
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('machines')
        .update({
          status: 'AVAILABLE',
          cycle_type: null,
          current_user_id: null,
          last_user_name: occupant?.name || 'Student',
          last_used_at: new Date().toISOString(),
          start_time: null,
          end_time: null,
          duration_seconds: null,
          last_nudged_at: null,
          last_nudged_by: null,
        })
        .eq('id', machine.id);
      await supabase
        .from('wash_sessions')
        .update({ status: 'PICKED_UP' })
        .eq('machine_id', machine.id)
        .in('status', ['IN_USE', 'COMPLETED']);
    } else {
      setMachines((prev) =>
        prev.map((m) =>
          m.id === machine.id
            ? {
                ...m,
                status: 'AVAILABLE',
                cycle_type: null,
                current_user_id: null,
                last_user_name: occupant?.name || 'Student',
                last_used_at: new Date().toISOString(),
                start_time: null,
                end_time: null,
                duration_seconds: null,
              }
            : m
        )
      );
    }
  };

  const handleSendPickupReminder = async (machine, occupant) => {
    const waUrl = buildWaUrl(
      occupant?.phone_number,
      `🔔 *Pickup Reminder:* Your clothes in ${machine.label} are ready for pickup!`
    );
    await pushNotification({
      targetUserId: occupant?.id,
      machineId: machine.id,
      type: 'REMINDER',
      title: `${machine.label} Pickup Reminder`,
      message: `Reminder sent for ${occupant?.name || 'student'} to collect clothes.`,
      waUrl,
      waLabel: 'Open WhatsApp',
    });
    window.open(waUrl, '_blank', 'noreferrer');
  };

  const handleNudgePeer = async (machine, occupant, nudgeMsg) => {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('machines')
        .update({
          last_nudged_at: now,
          last_nudged_by: currentUser?.name || 'Peer',
        })
        .eq('id', machine.id);
    } else {
      setMachines((prev) =>
        prev.map((m) =>
          m.id === machine.id
            ? { ...m, last_nudged_at: now, last_nudged_by: currentUser?.name || 'Peer' }
            : m
        )
      );
    }
    window.open(buildWaUrl(occupant.phone_number, nudgeMsg), '_blank', 'noreferrer');
  };

  const handleSubmitGrievance = async (payload) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('grievances').insert(payload);
      if (payload.severity === 'OUT_OF_ORDER') {
        await supabase
          .from('machines')
          .update({ status: 'OUT_OF_ORDER' })
          .eq('id', payload.machine_id);
      }
    } else {
      setGrievances((prev) => [
        { ...payload, id: `local-${Date.now()}`, status: 'OPEN', created_at: new Date().toISOString() },
        ...prev,
      ]);
      if (payload.severity === 'OUT_OF_ORDER') {
        setMachines((prev) =>
          prev.map((m) => (m.id === payload.machine_id ? { ...m, status: 'OUT_OF_ORDER' } : m))
        );
      }
    }
  };

  const handleResolveGrievance = async (grievance, note) => {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('grievances')
        .update({
          status: 'RESOLVED',
          resolution_note: note,
          resolved_by: currentUser?.name || 'Student',
          resolved_at: now,
        })
        .eq('id', grievance.id);

      if (grievance.severity === 'OUT_OF_ORDER') {
        await supabase
          .from('machines')
          .update({ status: 'AVAILABLE' })
          .eq('id', grievance.machine_id);
      }
    } else {
      setGrievances((prev) =>
        prev.map((g) =>
          g.id === grievance.id
            ? {
                ...g,
                status: 'RESOLVED',
                resolution_note: note,
                resolved_by: currentUser?.name || 'Student',
                resolved_at: now,
              }
            : g
        )
      );
      if (grievance.severity === 'OUT_OF_ORDER') {
        setMachines((prev) =>
          prev.map((m) => (m.id === grievance.machine_id ? { ...m, status: 'AVAILABLE' } : m))
        );
      }
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    if (isSupabaseConfigured && supabase) {
      const unread = notifications.filter(
        (n) => !Array.isArray(n.read_by) || !n.read_by.includes(currentUser.id)
      );
      await Promise.all(
        unread.map((n) =>
          supabase
            .from('notifications')
            .update({ read_by: [...(n.read_by || []), currentUser.id] })
            .eq('id', n.id)
        )
      );
    } else {
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read_by: Array.isArray(n.read_by)
            ? Array.from(new Set([...n.read_by, currentUser.id]))
            : [currentUser.id],
        }))
      );
    }
  };

  const unreadCount = notifications.filter(
    (n) => !Array.isArray(n.read_by) || !n.read_by.includes(currentUser?.id)
  ).length;

  const userActiveCount = machines.filter(
    (m) => m.status === 'IN_USE' && m.current_user_id === currentUser?.id
  ).length;

  const lastSessionByMachine = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      if (!map[s.machine_id]) map[s.machine_id] = s;
    });
    return map;
  }, [sessions]);

  const setupMachine = machines.find((m) => m.id === setupMachineId) || null;
  const openGrievancesCount = grievances.filter((g) => g.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        users={users}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenQR={() => setIsQROpen(true)}
        onOpenNotifications={() => setIsNotifOpen(true)}
        unreadCount={unreadCount}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((m) => !m)}
        isLive={isSupabaseConfigured}
      />

      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900">
          <div className="max-w-6xl mx-auto flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Local Demo Mode:</strong> Add <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
              <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to <code className="bg-amber-100 px-1 rounded">.env</code> for real-time multi-device sync.
            </span>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-xl p-4 flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <p className="text-sm font-bold">{toast.title}</p>
            <p className="text-xs text-slate-300">{toast.message}</p>
            {toast.waUrl && (
              <a
                href={toast.waUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition mt-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Send WhatsApp Alert
              </a>
            )}
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="max-w-6xl w-full mx-auto px-4 py-5 flex-1 space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('machines')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'machines'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <WashingMachine className="w-4 h-4" />
            Live Machines (5)
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'records'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            Wash Records
          </button>
          <button
            onClick={() => setActiveTab('grievances')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'grievances'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Grievances & Issues
            {openGrievancesCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {openGrievancesCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'machines' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map((machine) => {
              const machineOpenGrievances = grievances.filter(
                (g) => g.machine_id === machine.id && g.status === 'OPEN'
              );
              const advisoryGrievances = machineOpenGrievances.filter(
                (g) => g.severity === 'ADVISORY'
              );
              const outOfOrderGrievance = machineOpenGrievances.find(
                (g) => g.severity === 'OUT_OF_ORDER'
              );

              return (
                <MachineCard
                  key={machine.id}
                  machine={machine}
                  users={users}
                  currentUser={currentUser}
                  advisoryGrievances={advisoryGrievances}
                  outOfOrderGrievance={outOfOrderGrievance}
                  onStartScan={(id) => setSetupMachineId(id)}
                  onEndEarly={handleEndEarly}
                  onFastForward5s={handleFastForward5s}
                  onMarkPickedUp={handleMarkPickedUp}
                  onSendPickupReminder={handleSendPickupReminder}
                  onNudgePeer={handleNudgePeer}
                  onReportIssue={(id) => setGrievanceModalMachineId(id)}
                  onResolveIssue={() => setActiveTab('grievances')}
                />
              );
            })}
          </div>
        )}

        {activeTab === 'records' && <WashRecordsTab sessions={sessions} />}

        {activeTab === 'grievances' && (
          <GrievancesTab
            grievances={grievances}
            onOpenReportModal={(id) => setGrievanceModalMachineId(id)}
            onResolveGrievance={handleResolveGrievance}
          />
        )}
      </main>

      <QRScannerModal
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
        onSelectMachine={(id) => {
          setIsQROpen(false);
          setSetupMachineId(id);
        }}
      />

      <CycleSetupModal
        machine={setupMachine}
        occupant={users.find((u) => u.id === setupMachine?.current_user_id)}
        currentUser={currentUser}
        userActiveCount={userActiveCount}
        onClose={() => setSetupMachineId(null)}
        onStartCycle={handleStartCycle}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        user={currentUser}
        onClose={() => setIsProfileOpen(false)}
        onSave={handleSaveProfile}
      />

      <GrievanceModal
        isOpen={grievanceModalMachineId !== null}
        initialMachineId={grievanceModalMachineId}
        machines={machines}
        lastSessionByMachine={lastSessionByMachine}
        currentUser={currentUser}
        onClose={() => setGrievanceModalMachineId(null)}
        onSubmit={handleSubmitGrievance}
      />

      <NotificationDrawer
        isOpen={isNotifOpen}
        notifications={notifications}
        currentUserId={currentUser?.id}
        onClose={() => setIsNotifOpen(false)}
        onMarkAllRead={handleMarkAllRead}
      />
    </div>
  );
}

export default App;
