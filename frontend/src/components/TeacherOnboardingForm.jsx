import React, { useState } from 'react';
import { User, Hash, Phone, School, ArrowRight, AlertTriangle } from 'lucide-react';

export default function TeacherOnboardingForm({ user, onSubmitDetails, loading, error }) {
  const splitName = (user?.name || '').trim().split(' ');
  const initialFirstName = splitName[0] || '';
  const initialLastName = splitName.slice(1).join(' ') || '';

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [employeeId, setEmployeeId] = useState(user.employeeId || user.rollNumber || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [school, setSchool] = useState(user.school || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    onSubmitDetails({
      name: fullName,
      employeeId: employeeId.trim(),
      phone: phone.trim(),
      school: school.trim()
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto my-4 sm:my-8 animate-fade-up text-left text-slate-800">
      <div className="classic-card p-5 sm:p-8 bg-white space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-slate-500">Faculty registration</p>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
            Complete your profile
          </h2>
          <p className="text-sm text-slate-500">
            {user?.email
              ? `Signed in as ${user.email}. Add your employee ID and department to finish registration.`
              : 'Add your details to open the teaching workspace.'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                First Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none z-10" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Alan"
                  className="classic-input pl-11"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none z-10" />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Turing"
                  className="classic-input pl-11"
                />
              </div>
            </div>
          </div>

          {/* Employee ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Faculty / Employee ID <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none z-10" />
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. EMP-90210"
                className="classic-input pl-11"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Contact Phone Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none z-10" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 555 999 8888"
                className="classic-input pl-11"
              />
            </div>
          </div>

          {/* Department / Institution Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Department / Institution Name
            </label>
            <div className="relative flex items-center">
              <School className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none z-10" />
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="e.g. Department of Computer Science"
                className="classic-input pl-11"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4"
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
