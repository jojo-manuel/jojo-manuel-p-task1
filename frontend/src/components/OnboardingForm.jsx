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
      <div className="classic-card rounded-2xl sm:rounded-3xl p-4 sm:p-10 relative bg-white">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
              2
            </span>
            <span className="text-sm font-semibold text-slate-700">Step 2 of 2 · Student details</span>
          </div>
          <span className="badge badge-student hidden sm:inline-flex">
            <Sparkles className="w-3 h-3 mr-1" /> Student Setup
          </span>
        </div>

        {/* Header */}
        <div className="text-left mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Complete Student Profile</h2>
          <p className="text-sm text-slate-500">
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
