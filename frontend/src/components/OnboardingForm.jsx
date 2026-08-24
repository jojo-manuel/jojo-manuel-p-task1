import React, { useState } from 'react';
import { Hash, UserCheck, Phone, ArrowRight } from 'lucide-react';

export default function OnboardingForm({ user, onSubmitDetails, loading, error }) {
  const splitName = (user?.name || '').trim().split(' ');
  const initialFirstName = splitName[0] || '';
  const initialLastName = splitName.slice(1).join(' ') || '';

  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    rollNumber: user?.rollNumber || '',
    phone: user?.phone || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
    onSubmitDetails({
      name: fullName,
      rollNumber: formData.rollNumber,
      phone: formData.phone
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto my-4 sm:my-8 animate-fade-in text-slate-800">
      <div className="classic-card p-5 sm:p-8 relative bg-white">
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-1">Step 2 of 2</p>
          <h2 className="text-xl font-semibold text-slate-900">Student details</h2>
          <p className="text-sm text-slate-500 mt-1">
            Complete your profile details so faculty and study group members can identify you.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                First Name <span className="text-blue-600">*</span>
              </label>
              <div className="relative flex items-center">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none z-10" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="classic-input pl-11"
                  placeholder="e.g. Eleanor"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Last Name <span className="text-blue-600">*</span>
              </label>
              <div className="relative flex items-center">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none z-10" />
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="classic-input pl-11"
                  placeholder="e.g. Vance"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Roll Number / Student ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Roll Number / Student ID <span className="text-blue-600">*</span>
              </label>
              <div className="relative flex items-center">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none z-10" />
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  className="classic-input pl-11"
                  placeholder="e.g. 10245"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Phone Number <span className="text-blue-600">*</span>
              </label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none z-10" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="classic-input pl-11"
                  placeholder="e.g. +1 555 019 2834"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm"
            >
              {loading ? (
                <span>Saving Details...</span>
              ) : (
                <>
                  <span>Save and continue</span>
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
