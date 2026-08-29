import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, CheckCircle2, AlertTriangle, GraduationCap, Briefcase } from 'lucide-react';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import GoogleSignInButton from './GoogleSignInButton';

export default function AuthTabs({ onRegister, onLogin, onGoogleCredential, loading, error, successMessage }) {
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
    <div className="w-full max-w-[440px] mx-auto animate-fade-up">
      <div className="text-center mb-6">
        <p className="section-kicker mb-2 lg:hidden">Joineazy</p>
        <h1 className="text-[1.75rem] font-extrabold tracking-tight text-slate-900">
          {activeTab === 'login' ? 'Sign in' : 'Create account'}
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          {activeTab === 'login'
            ? 'Use your school email to continue.'
            : registerRole === 'student'
              ? 'For students viewing coursework and groups.'
              : 'For faculty posting assignments.'}
        </p>
      </div>

      <div className="classic-card p-5 sm:p-8 shadow-lg shadow-slate-200/60">
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
            Register
          </button>
        </div>

        <GoogleSignInButton onCredential={onGoogleCredential} disabled={loading} />

        <div className="relative mb-5">
          <div className="border-t border-slate-200" />
          <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-2 text-[11px] text-slate-400">
            or email
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          {activeTab === 'register' && (
            <div>
              <span className="field-label">I am a</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegisterRole('student')}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-1.5 ${
                    registerRole === 'student'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" /> Student
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterRole('admin')}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-1.5 ${
                    registerRole === 'admin'
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
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
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none z-10" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="classic-input pl-11"
                placeholder="you@school.edu"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="auth-password">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none z-10" />
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="classic-input pl-11"
                placeholder={activeTab === 'register' ? 'Create a password' : 'Your password'}
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
                {activeTab === 'login' ? 'Sign in' : 'Create account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Quick Demo Sign-In */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
            Or Quick Demo Sign-In
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => onLogin({ email: 'student@school.edu', password: 'Password123!' })}
              className="py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center justify-center gap-1 transition-all"
            >
              <GraduationCap className="w-3.5 h-3.5" /> Demo Student
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onLogin({ email: 'professor@school.edu', password: 'Password123!' })}
              className="py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 flex items-center justify-center gap-1 transition-all"
            >
              <Briefcase className="w-3.5 h-3.5" /> Demo Faculty
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
