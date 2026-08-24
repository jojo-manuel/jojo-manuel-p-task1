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

  return (
    <div className="w-full space-y-5 animate-fade-in text-left">
      <section className="mb-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {(user.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 truncate">
                Hello, {firstName}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5 truncate">
                {[user.rollNumber && `Roll / ID #${user.rollNumber}`, user.phone && `Phone: ${user.phone}`]
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-5">
            <div className="classic-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
                <span className="badge badge-student">Student</span>
              </div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Name</dt>
                  <dd className="font-medium text-slate-900 mt-0.5">{user.name || '—'}</dd>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-xs text-slate-500">Roll / Student ID</dt>
                    <dd className="font-medium text-slate-900 mt-0.5">{user.rollNumber || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Phone</dt>
                    <dd className="font-medium text-slate-900 mt-0.5">{user.phone || '—'}</dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Email</dt>
                  <dd className="font-medium text-slate-700 mt-0.5 break-all">{user.email}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('assignments')}
                className="classic-card-interactive rounded-xl p-5 text-left"
              >
                <BookOpen className="w-5 h-5 text-slate-700 mb-3" />
                <h3 className="font-semibold text-slate-900">Coursework</h3>
                <p className="text-sm text-slate-500 mt-1">Open OneDrive folders and confirm submissions.</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 mt-3">
                  View assignments <ArrowRight className="w-4 h-4" />
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('groups')}
                className="classic-card-interactive rounded-xl p-5 text-left"
              >
                <Users className="w-5 h-5 text-slate-700 mb-3" />
                <h3 className="font-semibold text-slate-900">Study groups</h3>
                <p className="text-sm text-slate-500 mt-1">Create a group, invite classmates, and track progress.</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 mt-3">
                  Manage groups <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </div>

            <div className="classic-card p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Getting started</h2>
              <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
                <li>Open Coursework and upload files to the OneDrive folder.</li>
                <li>Confirm your submission so progress is recorded.</li>
                <li>Join or create a group if the work is shared.</li>
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
