import React from 'react';
import { GraduationCap, LogOut, Shield, Bell } from 'lucide-react';

export default function Navbar({
  user,
  onLogout,
  unreadNotificationsCount = 0,
  onToggleNotifications,
  isNotificationsOpen
}) {
  const roleLabel = user?.role === 'admin' ? 'Faculty' : 'Student';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 pt-[env(safe-area-inset-top)]">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0f2744] flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 leading-none">Joineazy</p>
            <p className="hidden xs:block sm:block text-xs text-slate-500 font-medium mt-0.5">Academic portal</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {user ? (
            <>
              {user.role === 'student' && onToggleNotifications && (
                <button
                  type="button"
                  onClick={onToggleNotifications}
                  aria-label="Notifications"
                  className={`relative min-h-11 min-w-11 p-2.5 rounded-xl border transition-colors ${
                    isNotificationsOpen
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Bell className="w-[18px] h-[18px]" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white">
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                  )}
                </button>
              )}

              <div className="flex items-center gap-2 sm:gap-2.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-slate-50 border border-slate-200 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#0f2744] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left leading-tight min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-[140px] md:max-w-[180px]">
                    {user.name || user.email}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    {user.role === 'admin' && <Shield className="w-3 h-3" />}
                    {roleLabel}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="btn-secondary text-sm py-2 px-2.5 sm:px-3 min-h-11"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <p className="hidden sm:block text-sm text-slate-500">Students and faculty sign in here</p>
          )}
        </div>
      </div>
    </header>
  );
}
