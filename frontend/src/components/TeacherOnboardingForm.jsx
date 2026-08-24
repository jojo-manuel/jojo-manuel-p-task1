import React, { useState } from 'react';
import { Shield, User, Hash, Phone, School, ArrowRight, AlertTriangle } from 'lucide-react';

export default function TeacherOnboardingForm({ user, onSubmitDetails, loading, error }) {
  const [name, setName] = useState(user.name || '');
  const [employeeId, setEmployeeId] = useState(user.employeeId || user.rollNumber || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [school, setSchool] = useState(user.school || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitDetails({
      name: name.trim(),
      employeeId: employeeId.trim(),
      phone: phone.trim(),
      school: school.trim()
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto my-4 sm:my-8 animate-fade-in text-left text-slate-800">
      <div className="classic-card rounded-2xl sm:rounded-3xl p-4 sm:p-8 bg-white border border-slate-200 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <Shield className="w-3.5 h-3.5" /> Faculty setup
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Complete faculty details
          </h2>
          <p className="text-sm text-slate-500">
            Enter your faculty details to open the teaching workspace.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Name (with Title) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Prof. Alan Turing"
                className="classic-input pl-10 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Employee ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Faculty / Employee ID <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. EMP-90210"
                className="classic-input pl-10 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Contact Phone Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 555 999 8888"
                className="classic-input pl-10 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Department / Institution Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Department / Institution Name
            </label>
            <div className="relative">
              <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="e.g. Department of Computer Science"
                className="classic-input pl-10 text-xs font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span>Saving Details...</span>
            ) : (
              <>
                <span>Open faculty portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
