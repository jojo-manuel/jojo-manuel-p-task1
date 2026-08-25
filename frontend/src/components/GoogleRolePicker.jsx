import React from 'react';
import { GraduationCap, Briefcase, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function GoogleRolePicker({ profile, onSelectRole, onBack, loading, error }) {
  return (
    <div className="w-full max-w-[420px] mx-auto animate-fade-up">
      <div className="text-center mb-6">
        <h1 className="text-[1.65rem] font-semibold tracking-tight text-slate-900">
          Choose your role
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          Signed in as {profile?.name || profile?.email}. We will open the matching registration form next.
        </p>
      </div>

      <div className="classic-card p-5 sm:p-7">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <p className="text-xs font-medium text-slate-500 mb-3">{profile?.email}</p>

        <div className="grid grid-cols-1 gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={() => onSelectRole('student')}
            className="py-3.5 px-4 rounded-xl border border-slate-200 bg-white text-left hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-900">Student</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Register with roll number and phone
                </span>
              </span>
            </div>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => onSelectRole('admin')}
            className="py-3.5 px-4 rounded-xl border border-slate-200 bg-white text-left hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-900">Faculty</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Register with employee ID and department
                </span>
              </span>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="mt-5 w-full text-sm text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Use a different account
        </button>
      </div>
    </div>
  );
}
