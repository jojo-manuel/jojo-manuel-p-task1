import React, { useState } from 'react';
import { School, Hash, UserCheck, Phone, BookOpen, ArrowRight, Sparkles } from 'lucide-react';

export default function OnboardingForm({ user, onSubmitDetails, loading, error }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    school: user?.school || '',
    class: user?.class || '',
    rollNumber: user?.rollNumber || '',
    phone: user?.phone || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitDetails(formData);
  };

  return (
    <div className="w-full max-w-xl mx-auto my-4 sm:my-8 animate-fade-in text-slate-800">
      <div className="classic-card p-5 sm:p-8 relative bg-white">
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-1">Step 2 of 2</p>
          <h2 className="text-xl font-semibold text-slate-900">Student details</h2>
          <p className="text-sm text-slate-500 mt-1">
            Add your school details so faculty can identify you.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Name <span className="text-blue-600">*</span>
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="classic-input pl-10"
                placeholder="e.g. Eleanor Vance"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* School */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                School Name <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                  className="classic-input pl-10"
                  placeholder="e.g. St. Jude High School"
                  required
                />
              </div>
            </div>

            {/* Class */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Class / Grade <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className="classic-input pl-10"
                  placeholder="e.g. Class 10 - Section A"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Roll Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Roll Number <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  className="classic-input pl-10"
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
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="classic-input pl-10"
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
