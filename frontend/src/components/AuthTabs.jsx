import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, CheckCircle2, AlertTriangle, GraduationCap, Briefcase } from 'lucide-react';
import PasswordStrengthMeter from './PasswordStrengthMeter';

export default function AuthTabs({ onRegister, onLogin, onOpenGoogleModal, loading, error, successMessage }) {
  const [activeTab, setActiveTab] = useState('login');
  const [registerRole, setRegisterRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'register') {
      onRegister({ email, password, role: registerRole });
    } else {
      onLogin({ email, password });
    }
  };

  return (
    <div className="w-full max-w-[440px] mx-auto animate-fade-in px-0">
      <div className="text-center mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-[1.75rem] font-extrabold tracking-tight text-slate-900">
          Welcome to Joineazy
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          {activeTab === 'login'
            ? 'Sign in with your school email to continue.'
            : registerRole === 'student'
              ? 'Create a student account to view coursework and groups.'
              : 'Create a faculty account to post assignments and track submissions.'}
        </p>
      </div>

      <div className="classic-card p-4 sm:p-8">
        <div className="portal-tabs mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`portal-tab flex-1 justify-center ${activeTab === 'login' ? 'is-active' : ''}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`portal-tab flex-1 justify-center ${activeTab === 'register' ? 'is-active' : ''}`}
          >
            Create account
          </button>
        </div>

        <button type="button" onClick={() => onOpenGoogleModal(registerRole)} className="btn-google mb-5">
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.6c-.29 1.48-1.14 2.73-2.4 3.58v2.99h3.88c2.27-2.09 3.665-5.17 3.665-8.81z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-2.99c-1.08.72-2.45 1.15-4.05 1.15-3.12 0-5.77-2.11-6.72-4.94H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
            <path fill="#FBBC05" d="M5.28 14.31c-.25-.72-.38-1.49-.38-2.31s.13-1.59.38-2.31V6.6H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.4l3.99-3.09z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8L20.02 3.1C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.6l3.99 3.09C6.23 6.86 8.88 4.75 12 4.75z" />
          </svg>
          Continue with Google
        </button>

        <div className="relative mb-5">
          <div className="border-t border-slate-200" />
          <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            or email
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {activeTab === 'register' && (
            <div>
              <span className="field-label">I am a</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegisterRole('student')}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-1.5 ${
                    registerRole === 'student'
                      ? 'bg-blue-50 border-blue-500 text-blue-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" /> Student
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterRole('admin')}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-1.5 ${
                    registerRole === 'admin'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Briefcase className="w-4 h-4" /> Faculty
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="field-label" htmlFor="auth-email">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="classic-input pl-10"
                placeholder="you@school.edu"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="auth-password">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="classic-input pl-10"
                placeholder={activeTab === 'register' ? 'Create a strong password' : 'Enter your password'}
                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </div>
            {activeTab === 'register' && <PasswordStrengthMeter password={password} />}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
            {loading ? (
              'Please wait…'
            ) : (
              <>
                {activeTab === 'login' ? 'Sign in' : registerRole === 'admin' ? 'Create faculty account' : 'Create student account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
