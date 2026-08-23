import React from 'react';
import { GraduationCap, LogOut, Shield, User, Sparkles } from 'lucide-react';

export default function Navbar({ user, onLogout, setActiveTab }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab && setActiveTab('home')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-blue-700" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
              Joineazy
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Academic v2.0
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium text-left">Smart Student Portal</p>
        </div>
      </div>

      {/* User Actions / Status */}
      <div className="flex items-center gap-3 sm:gap-4">
        {user ? (
          <>
            <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-800 font-bold text-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-slate-900 truncate max-w-[150px]">{user.name || user.email}</p>
                <div className="flex items-center gap-1">
                  <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-student'} text-[9px] py-0 px-1.5`}>
                    {user.role === 'admin' ? <Shield className="w-2.5 h-2.5 inline mr-0.5" /> : null}
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="btn-secondary text-xs sm:text-sm py-2 px-3.5 text-slate-700 hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-semibold hidden sm:inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> High Security Academic Portal
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
