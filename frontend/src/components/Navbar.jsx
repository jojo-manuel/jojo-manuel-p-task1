import React from 'react';
import { GraduationCap, LogOut, Bell, Sparkles } from 'lucide-react';

export default function Navbar({
  user,
  onLogout,
  onGoHome,
  unreadNotificationsCount = 0,
  onToggleNotifications,
  isNotificationsOpen
}) {
  const roleLabel = user?.role === 'admin' ? 'Faculty Portal' : 'Student Portal';

  return (
    <header className="sticky top-0 z-40 w-full glass-navbar pt-[env(safe-area-inset-top)]">
      <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-[4.15rem] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-3 min-w-0 hover:opacity-90 transition-all text-left cursor-pointer group focus:outline-none"
          title="Go to Home"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shrink-0 shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">Joineazy</span>
            {user && (
              <span className={`hidden xs:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                user.role === 'admin' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}>
                <Sparkles className="w-3 h-3" />
                {roleLabel}
              </span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <>
              {user.role === 'student' && onToggleNotifications && (
                <button
                  type="button"
                  onClick={onToggleNotifications}
                  aria-label="Notifications"
                  className={`relative h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                    isNotificationsOpen
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center shadow-sm animate-[badgePulse_1.6s_ease-in-out_infinite]">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                </button>
              )}

              <div className="hidden sm:flex items-center gap-2.5 min-w-0 pl-1">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="text-left leading-tight min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-[140px] md:max-w-[180px]">
                    {user.name || user.email}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">{user.school || roleLabel}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="h-9 px-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 inline-flex items-center gap-1.5 transition-colors border border-transparent hover:border-rose-100"
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
