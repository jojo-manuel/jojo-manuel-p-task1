import React, { useState } from 'react';
import {
  GraduationCap,
  School,
  BookOpen,
  Award,
  Bell,
  Pencil,
  Users,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import StudentGroupManager from './StudentGroupManager';
import NotificationCenter from './NotificationCenter';
import StudentAssignmentsView from './StudentAssignmentsView';

export default function StudentDashboard({
  user,
  token,
  notifications = [],
  unreadNotificationsCount = 0,
  onRefreshNotifications,
  isNotificationsOpen,
  onCloseNotifications,
  onEditDetails
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const firstName = (user.name || 'Student').split(' ')[0];

  return (
    <div className="w-full space-y-5 animate-fade-in text-left">
      <section className="portal-hero p-4 sm:p-6 md:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white text-[#0f2744] flex items-center justify-center text-lg sm:text-xl font-extrabold shrink-0">
              {(user.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-blue-100 text-xs sm:text-sm font-medium mb-0.5">Student dashboard</p>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">Hello, {firstName}</h1>
              <p className="text-xs sm:text-sm text-blue-100/90 mt-1 flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <School className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate max-w-[180px] sm:max-w-none">{user.school || 'School not set'}</span>
                </span>
                <span className="opacity-50 hidden sm:inline">·</span>
                <span>Class {user.class || '—'}</span>
                <span className="opacity-50">·</span>
                <span>Roll #{user.rollNumber || '—'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onEditDetails}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl px-4 py-2.5 min-h-11"
          >
            <Pencil className="w-4 h-4" /> Edit profile
          </button>
        </div>
      </section>

      <nav className="portal-tabs" aria-label="Student sections">
        <button type="button" onClick={() => setActiveTab('overview')} className={`portal-tab ${activeTab === 'overview' ? 'is-active' : ''}`}>
          <GraduationCap className="w-4 h-4" /> Home
        </button>
        <button type="button" onClick={() => setActiveTab('assignments')} className={`portal-tab ${activeTab === 'assignments' ? 'is-active' : ''}`}>
          <BookOpen className="w-4 h-4" /> Coursework
        </button>
        <button type="button" onClick={() => setActiveTab('groups')} className={`portal-tab ${activeTab === 'groups' ? 'is-active' : ''}`}>
          <Users className="w-4 h-4" /> Groups
        </button>
        <button type="button" onClick={() => setActiveTab('notifications')} className={`portal-tab ${activeTab === 'notifications' ? 'is-active' : ''}`}>
          <Bell className="w-4 h-4" /> Inbox
          {unreadNotificationsCount > 0 && <span className="count-chip">{unreadNotificationsCount}</span>}
        </button>
      </nav>

      {isNotificationsOpen && (
        <NotificationCenter
          notifications={notifications}
          token={token}
          onRefresh={onRefreshNotifications}
          onClose={onCloseNotifications}
        />
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-5">
            <div className="classic-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-800">Your profile</h2>
                <span className="badge badge-student">Active</span>
              </div>
              <dl className="space-y-3 text-sm">
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">{user.name || '—'}</dd>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3">
                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Class</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">{user.class || '—'}</dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3">
                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Roll no.</dt>
                    <dd className="font-semibold text-slate-900 mt-0.5">{user.rollNumber || '—'}</dd>
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3">
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</dt>
                  <dd className="font-medium text-slate-800 mt-0.5 break-all">{user.email}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('assignments')}
                className="classic-card-interactive rounded-2xl p-5 text-left"
              >
                <BookOpen className="w-5 h-5 text-blue-700 mb-3" />
                <h3 className="font-bold text-slate-900">Coursework</h3>
                <p className="text-sm text-slate-500 mt-1">Open OneDrive folders and confirm submissions.</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 mt-3">
                  View assignments <ArrowRight className="w-4 h-4" />
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('groups')}
                className="classic-card-interactive rounded-2xl p-5 text-left"
              >
                <Users className="w-5 h-5 text-blue-700 mb-3" />
                <h3 className="font-bold text-slate-900">Study groups</h3>
                <p className="text-sm text-slate-500 mt-1">Create a group, invite classmates, and track progress.</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 mt-3">
                  Manage groups <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </div>

            <div className="classic-card p-5">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Getting started
              </h2>
              <ul className="space-y-2.5 text-sm text-slate-600">
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">1.</span>
                  Open Coursework and upload files to the professor’s OneDrive folder.
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">2.</span>
                  Confirm your submission so your progress is recorded.
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">3.</span>
                  Join or create a study group if the assignment is shared.
                </li>
              </ul>
            </div>

            <div className="classic-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" /> Notices
                </h2>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-950">
                Use <strong>Inbox</strong> for group invites and new assignment alerts. Confirm work as soon as you upload it so faculty can see completion.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && <StudentAssignmentsView token={token} />}

      {activeTab === 'groups' && (
        <StudentGroupManager user={user} token={token} onGroupUpdated={onRefreshNotifications} />
      )}

      {activeTab === 'notifications' && (
        <NotificationCenter notifications={notifications} token={token} onRefresh={onRefreshNotifications} />
      )}
    </div>
  );
}
