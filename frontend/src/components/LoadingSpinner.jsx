import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

/**
 * Reusable Micro Button Spinner
 */
export function ButtonSpinner({ className = 'w-4 h-4' }) {
  return (
    <Loader2 className={`animate-spin-smooth shrink-0 ${className}`} />
  );
}

/**
 * Modern Orbital Ring Spinner with customizable size and message
 */
export function LoadingSpinner({
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  text = 'Loading...',
  subtext,
  fullHeight = false,
  className = ''
}) {
  const sizeMap = {
    sm: { ring: 'w-6 h-6 border-2', icon: 'w-3 h-3', text: 'text-xs' },
    md: { ring: 'w-10 h-10 border-[3px]', icon: 'w-4 h-4', text: 'text-sm' },
    lg: { ring: 'w-14 h-14 border-4', icon: 'w-6 h-6', text: 'text-base' },
    xl: { ring: 'w-20 h-20 border-[5px]', icon: 'w-8 h-8', text: 'text-lg font-bold' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3.5 p-6 animate-fade-in ${
        fullHeight ? 'min-h-[50vh]' : ''
      } ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer Pulsing Glow */}
        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-md animate-pulse-glow" />

        {/* Orbit Ring */}
        <div
          className={`${currentSize.ring} rounded-full border-slate-200 border-t-indigo-600 border-r-emerald-500 animate-spin-smooth shadow-sm`}
        />

        {/* Inner Accent Dot */}
        <div className="absolute w-2 h-2 rounded-full bg-indigo-600 animate-ping opacity-75" />
      </div>

      {text && (
        <div className="text-center space-y-1">
          <p className={`${currentSize.text} font-bold text-slate-800 tracking-tight flex items-center justify-center gap-1.5`}>
            <span>{text}</span>
            <span className="inline-flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </p>
          {subtext && <p className="text-xs text-slate-500 font-medium">{subtext}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * Full Page / App Splash Loader
 */
export function FullPageLoader({ message = 'Loading your portal...' }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-5 animate-fade-in text-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-slate-900 p-0.5 shadow-xl shadow-indigo-500/25 animate-pulse-glow flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-slate-900 bg-clip-text text-transparent">
              J
            </span>
          </div>
        </div>
        <div className="absolute -inset-2 border-2 border-dashed border-indigo-400/40 rounded-3xl animate-spin-smooth" style={{ animationDuration: '6s' }} />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Joineazy Portal</span>
        </h3>
        <p className="text-xs text-slate-500 font-semibold">{message}</p>
      </div>

      {/* Progress Line */}
      <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full animate-shimmer-bar" />
      </div>
    </div>
  );
}

/**
 * Shimmering Card Skeletons for Coursework Grid
 */
export function SkeletonCardGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="classic-card rounded-2xl p-4 sm:p-5 bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="w-20 h-4 rounded-md skeleton" />
              <div className="w-16 h-4 rounded-md skeleton" />
            </div>
            <div className="w-3/4 h-5 rounded-md skeleton" />
            <div className="w-full h-3 rounded skeleton" />
            <div className="w-2/3 h-3 rounded skeleton" />
          </div>

          <div className="space-y-3 pt-2">
            <div className="w-full h-8 rounded-xl skeleton" />
            <div className="w-full h-9 rounded-xl skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmering Course Cards Skeleton
 */
export function SkeletonCourses({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="classic-card rounded-2xl p-5 sm:p-6 border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-24 h-5 rounded-lg skeleton" />
            <div className="w-16 h-4 rounded-md skeleton" />
          </div>
          <div className="w-3/4 h-6 rounded-md skeleton" />
          <div className="w-1/2 h-4 rounded-md skeleton" />
          <div className="w-full h-2 rounded-full skeleton mt-4" />
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmering Row Skeleton for Lists and Tables
 */
export function SkeletonList({ rows = 4 }) {
  return (
    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white animate-fade-in">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full skeleton shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="w-1/3 h-4 rounded skeleton" />
              <div className="w-1/2 h-3 rounded skeleton" />
            </div>
          </div>
          <div className="w-20 h-7 rounded-xl skeleton shrink-0" />
        </div>
      ))}
    </div>
  );
}
