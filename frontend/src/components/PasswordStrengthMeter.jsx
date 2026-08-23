import React from 'react';
import { Check, X, ShieldCheck } from 'lucide-react';

export default function PasswordStrengthMeter({ password = '' }) {
  if (!password) return null;

  const checks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { label: 'One number (0-9)', met: /[0-9]/.test(password) },
    { label: 'One special character (!@#$%^&*)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) }
  ];

  const score = checks.filter((c) => c.met).length;

  const getStrengthInfo = () => {
    switch (score) {
      case 0:
      case 1:
      case 2:
        return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-700', width: 'w-1/4' };
      case 3:
      case 4:
        return { label: 'Moderate Security', color: 'bg-amber-500', text: 'text-amber-700', width: 'w-3/4' };
      case 5:
        return { label: 'High Security (Protected)', color: 'bg-emerald-600', text: 'text-emerald-700', width: 'w-full' };
      default:
        return { label: 'Too Weak', color: 'bg-slate-300', text: 'text-slate-500', width: 'w-0' };
    }
  };

  const strength = getStrengthInfo();

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" /> Security Evaluation
        </span>
        <span className={`text-xs font-bold ${strength.text}`}>
          {strength.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-300 ${strength.color}`}
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
        {checks.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 transition-colors ${
              item.met ? 'text-emerald-700 font-semibold' : 'text-slate-400'
            }`}
          >
            {item.met ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
