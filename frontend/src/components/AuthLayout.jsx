import React from 'react';
import { BookOpen, Users, ShieldCheck, Sparkles } from 'lucide-react';

const highlights = [
  { icon: BookOpen, title: 'Coursework in one place', text: 'Open materials, submit work, and track what is due.' },
  { icon: Users, title: 'Study groups', text: 'Collaborate and see group completion at a glance.' },
  { icon: ShieldCheck, title: 'Faculty workspace', text: 'Post assignments, grade submissions, and view analytics.' }
];

export default function AuthLayout({ children }) {
  return (
    <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-[1.08fr_0.92fr] gap-10 lg:gap-14 items-center">
      <aside className="hidden lg:flex flex-col justify-between min-h-[520px] rounded-3xl p-8 xl:p-10 text-white relative overflow-hidden auth-brand-panel">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-emerald-400/15 blur-3xl" />
        </div>
        <div className="relative z-10">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-200 mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Academic portal
          </p>
          <h2 className="text-3xl xl:text-[2.05rem] font-bold tracking-tight leading-tight">
            Coursework, groups, and grading — without the clutter.
          </h2>
          <p className="mt-3 text-sm text-indigo-100/85 leading-relaxed max-w-md">
            Joineazy keeps students and faculty on the same page: assignments, OneDrive materials, and progress in a calm workspace.
          </p>
        </div>
        <ul className="relative z-10 space-y-4 mt-10">
          {highlights.map((item) => (
            <li key={item.title} className="flex gap-3 items-start">
              <span className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{item.title}</span>
                <span className="block text-xs text-indigo-100/75 mt-0.5 leading-relaxed">{item.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </aside>
      <div className="w-full">{children}</div>
    </div>
  );
}
