import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Bell,
  Pencil,
  Users,
  ArrowRight
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
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="w-full space-y-5 animate-fade-up text-left">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-base font-semibold shrink-0 shadow-sm">
              {(user.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{greeting}</p>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 truncate">
                {firstName}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5 truncate">
                {[user.rollNumber && `Roll / ID #${user.rollNumber}`, user.phone && user.phone]
                  .filter(Boolean)
                  .join(' · ') || 'Complete your profile'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onEditDetails}
            className="btn-secondary w-full sm:w-auto min-h-10"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 stagger">
          <div className="classic-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
              <span className="badge badge-student">Student</span>
            </div>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs text-slate-500">First name</dt>
                <dd className="font-medium text-slate-900 mt-0.5">{(user.name || '').trim().split(/\s+/)[0] || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Last name</dt>
                <dd className="font-medium text-slate-900 mt-0.5">{(user.name || '').trim().split(/\s+/).slice(1).join(' ') || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Roll number / Student ID</dt>
                <dd className="font-medium text-slate-900 mt-0.5">{user.rollNumber || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Phone</dt>
                <dd className="font-medium text-slate-900 mt-0.5">{user.phone || '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('assignments')}
                className="classic-card-interactive rounded-xl p-5 text-left"
              >
                <span className="icon-tile bg-indigo-50 text-indigo-700 mb-3">
                  <BookOpen className="w-5 h-5" />
                </span>
                <h3 className="font-semibold text-slate-900">Coursework</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Open OneDrive folders and confirm submissions.
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-800 mt-4">
                  View assignments <ArrowRight className="w-4 h-4" />
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('groups')}
                className="classic-card-interactive rounded-xl p-5 text-left"
              >
                <span className="icon-tile bg-sky-50 text-sky-700 mb-3">
                  <Users className="w-5 h-5" />
                </span>
                <h3 className="font-semibold text-slate-900">Study groups</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Create a group, invite classmates, and track progress.
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-800 mt-4">
                  Manage groups <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </div>

            <div className="classic-card p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Getting started</h2>
              <ol className="space-y-3">
                {[
                  'Open Coursework and upload files to the OneDrive folder.',
                  'Confirm your submission so progress is recorded.',
                  'Join or create a group if the work is shared.'
                ].map((step, index) => (
                  <li key={step} className="flex items-start gap-3 text-sm text-slate-600">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
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
