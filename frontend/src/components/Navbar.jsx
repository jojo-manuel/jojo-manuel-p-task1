import React from 'react';
import { GraduationCap, LogOut, Bell } from 'lucide-react';

export default function Navbar({
  user,
  onLogout,
  unreadNotificationsCount = 0,
  onToggleNotifications,
  isNotificationsOpen
}) {
  const roleLabel = user?.role === 'admin' ? 'Faculty' : 'Student';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80 pt-[env(safe-area-inset-top)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 shadow-sm">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <p className="text-[15px] font-semibold tracking-tight text-slate-900">Joineazy</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <>
              {user.role === 'student' && onToggleNotifications && (
                <button
                  type="button"
                  onClick={onToggleNotifications}
                  aria-label="Notifications"
                  className={`relative h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                    isNotificationsOpen
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white font-semibold text-[9px] flex items-center justify-center animate-[badgePulse_1.6s_ease-in-out_infinite]">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                </button>
              )}

              <div className="hidden sm:flex items-center gap-2 min-w-0 pl-1">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs shrink-0">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="text-left leading-tight min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate max-w-[140px] md:max-w-[180px]">
                    {user.name || user.email}
                  </p>
                  <p className="text-[11px] text-slate-400">{roleLabel}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="h-9 px-2.5 sm:px-3 rounded-lg text-sm text-slate-600 hover:bg-slate-100 inline-flex items-center gap-1.5 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
