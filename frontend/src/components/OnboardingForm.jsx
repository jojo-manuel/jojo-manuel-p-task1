import React, { useState } from 'react';
import { Hash, User, Phone, ArrowRight, ArrowLeft } from 'lucide-react';

export default function OnboardingForm({ user, onSubmitDetails, onBack, loading, error }) {
  const parts = (user?.name || '').trim().split(/\s+/).filter(Boolean);
  const [firstName, setFirstName] = useState(parts[0] || '');
  const [lastName, setLastName] = useState(parts.slice(1).join(' ') || '');
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    onSubmitDetails({
      name,
      rollNumber: rollNumber.trim(),
      phone: phone.trim()
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto my-4 sm:my-8 animate-fade-up text-slate-800">
      <div className="classic-card p-5 sm:p-8 bg-white">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all group mb-4"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
        )}
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-1">Student registration</p>
          <h2 className="text-xl font-semibold text-slate-900">Complete your details</h2>
          <p className="text-sm text-slate-500 mt-1">
            {user?.email
              ? `Signed in as ${user.email}. Add your roll number and phone to finish registration.`
              : 'Complete your profile details so faculty and study group members can identify you.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="field-label" htmlFor="student-first-name">
              First Name <span className="text-slate-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="student-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="classic-input pl-10"
                placeholder="First name"
                autoComplete="given-name"
                required
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="student-last-name">
              Last Name <span className="text-slate-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="student-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="classic-input pl-10"
                placeholder="Last name"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="student-roll">
              Roll Number / Student ID <span className="text-slate-400">*</span>
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="student-roll"
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="classic-input pl-10"
                placeholder="Roll number or student ID"
                required
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="student-phone">
              Phone Number <span className="text-slate-400">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="student-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="classic-input pl-10"
                placeholder="Phone number"
                autoComplete="tel"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
              {loading ? (
                'Saving…'
              ) : (
                <>
                  Save and continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
