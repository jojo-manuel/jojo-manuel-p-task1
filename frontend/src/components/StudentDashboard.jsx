import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Bell,
  Pencil,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FolderGit2,
  UserCheck,
  ChevronRight,
  Clock,
  Award,
  ArrowLeft
} from 'lucide-react';
import StudentGroupManager from './StudentGroupManager';
import NotificationCenter from './NotificationCenter';
import StudentAssignmentsView from './StudentAssignmentsView';
import { SkeletonCourses, LoadingSpinner } from './LoadingSpinner';

export default function StudentDashboard({
  user,
  token,
  notifications = [],
  unreadNotificationsCount = 0,
  onRefreshNotifications,
  isNotificationsOpen,
  onCloseNotifications,
  onEditDetails,
  navHomeTrigger
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');

  const firstName = (user.name || 'Student').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // React to top Navbar Joineazy click -> navigate back to overview / home
  useEffect(() => {
    if (navHomeTrigger) {
      setActiveTab('overview');
      setSelectedCourseFilter('');
    }
  }, [navHomeTrigger]);

  useEffect(() => {
    if (token) {
      fetch('/api/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.assignments) {
            setAssignments(data.assignments);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingAssignments(false));
    }
  }, [token]);

  // Derive enrolled courses list & per-course analytics
  const coursesMap = {};
  assignments.forEach((asgn) => {
    const cName = asgn.course_name || 'General Coursework';
    if (!coursesMap[cName]) {
      coursesMap[cName] = {
        name: cName,
        teacher: asgn.teacher_name || 'Faculty Instructor',
        totalAssignments: 0,
        completedAssignments: 0,
        pendingAssignments: 0
      };
    }
    coursesMap[cName].totalAssignments += 1;
    if (asgn.isSubmitted) {
      coursesMap[cName].completedAssignments += 1;
    } else {
      coursesMap[cName].pendingAssignments += 1;
    }
  });

  const enrolledCourses = Object.values(coursesMap).map((c) => ({
    ...c,
    completionRate: c.totalAssignments > 0 ? Math.round((c.completedAssignments / c.totalAssignments) * 100) : 0
  }));

  const completedCount = assignments.filter((a) => a.isSubmitted).length;
  const pendingCount = assignments.filter((a) => !a.isSubmitted).length;

  const handleOpenCourse = (courseName) => {
    setSelectedCourseFilter(courseName);
    setActiveTab('assignments');
  };

  return (
    <div className="w-full space-y-6 animate-fade-up text-left">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-indigo-950/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center justify-center text-xl font-bold shrink-0 shadow-inner">
              {(user.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  {greeting}
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
                {user.name || firstName}
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200 mt-1 truncate">
                {[user.rollNumber && `Roll #${user.rollNumber}`, user.school && user.school]
                  .filter(Boolean)
                  .join(' · ') || 'Complete your student profile'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="flex gap-2">
              <div className="hero-stat text-center">
                <p className="text-lg font-extrabold leading-none">{enrolledCourses.length}</p>
                <p className="text-[10px] uppercase tracking-wide text-indigo-200 mt-1">Courses</p>
              </div>
              <div className="hero-stat text-center">
                <p className="text-lg font-extrabold leading-none">{pendingCount}</p>
                <p className="text-[10px] uppercase tracking-wide text-indigo-200 mt-1">Pending</p>
              </div>
              <div className="hero-stat text-center">
                <p className="text-lg font-extrabold leading-none">{completedCount}</p>
                <p className="text-[10px] uppercase tracking-wide text-indigo-200 mt-1">Done</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onEditDetails}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold backdrop-blur-md border border-white/20 inline-flex items-center gap-2 transition-all shadow-sm"
            >
              <Pencil className="w-4 h-4" /> Edit Profile
            </button>
          </div>
        </div>
      </section>

      {/* Primary Section Navigation Tabs */}
      <nav className="portal-tabs" aria-label="Student sections">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`portal-tab ${activeTab === 'overview' ? 'is-active' : ''}`}
        >
          <GraduationCap className="w-4 h-4" /> Overview & Courses
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className={`portal-tab ${activeTab === 'assignments' ? 'is-active' : ''}`}
        >
          <BookOpen className="w-4 h-4" /> Coursework
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('groups')}
          className={`portal-tab ${activeTab === 'groups' ? 'is-active' : ''}`}
        >
          <Users className="w-4 h-4" /> Study Groups
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`portal-tab ${activeTab === 'notifications' ? 'is-active' : ''}`}
        >
          <Bell className="w-4 h-4" /> Inbox & Requests
          {unreadNotificationsCount > 0 && (
            <span className="count-chip">{unreadNotificationsCount}</span>
          )}
        </button>
      </nav>

      {/* Back to Overview Banner when in sub-tabs */}
      {activeTab !== 'overview' && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('overview');
              setSelectedCourseFilter('');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Overview & Courses</span>
          </button>

          {selectedCourseFilter && activeTab === 'assignments' && (
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
              Filtered: <strong>{selectedCourseFilter}</strong>
            </span>
          )}
        </div>
      )}

      {isNotificationsOpen && (
        <NotificationCenter
          notifications={notifications}
          token={token}
          onRefresh={onRefreshNotifications}
          onClose={onCloseNotifications}
        />
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8 stagger">
          {/* Enrolled Courses Responsive Grid Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" /> Enrolled Courses
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any course card to open its respective coursework page and submit assignments.
                </p>
              </div>
              <span className="badge badge-student text-xs">
                {enrolledCourses.length} {enrolledCourses.length === 1 ? 'Course' : 'Courses'} Active
              </span>
            </div>

            {loadingAssignments ? (
              <div className="space-y-4">
                <LoadingSpinner
                  size="md"
                  text="Loading your enrolled courses..."
                  subtext="Fetching syllabus modules and completion progress"
                />
                <SkeletonCourses count={3} />
              </div>
            ) : enrolledCourses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No courses yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  When faculty post coursework for your class, those courses will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {enrolledCourses.map((course) => {
                  const isFullLength = enrolledCourses.length === 1 || course.name === 'General Coursework';
                  return (
                    <div
                      key={course.name}
                      onClick={() => handleOpenCourse(course.name)}
                      className={`classic-card-interactive rounded-2xl p-5 sm:p-6 border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer group ${
                        isFullLength ? 'col-span-full' : 'flex flex-col justify-between'
                      }`}
                    >
                      {isFullLength ? (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base shrink-0 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm border border-indigo-100">
                              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
                            </div>
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {course.name}
                                </h3>
                                <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                  {course.teacher}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">
                                {course.totalAssignments} {course.totalAssignments === 1 ? 'Assignment' : 'Assignments'} Total
                              </p>
                              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 pt-0.5 flex-wrap">
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-bold">
                                  ✓ {course.completedAssignments} Done
                                </span>
                                {course.pendingAssignments > 0 && (
                                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/80 text-[11px] font-bold">
                                    ⏳ {course.pendingAssignments} Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center md:items-end lg:items-center gap-4 shrink-0 md:min-w-[280px]">
                            <div className="space-y-1.5 flex-1 w-full sm:w-48">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-500">Completion</span>
                                <span className="text-indigo-600 font-semibold">{course.completionRate}%</span>
                              </div>
                              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all"
                                  style={{ width: `${course.completionRate}%` }}
                                />
                              </div>
                            </div>
                            <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white font-bold text-xs transition-all shadow-sm shrink-0">
                              Open Coursework <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                <BookOpen className="w-5 h-5" />
                              </div>
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                {course.teacher}
                              </span>
                            </div>

                            <div>
                              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                {course.name}
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {course.totalAssignments} {course.totalAssignments === 1 ? 'Assignment' : 'Assignments'} Total
                              </p>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 pt-1 flex-wrap">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-bold">
                                ✓ {course.completedAssignments} Done
                              </span>
                              {course.pendingAssignments > 0 && (
                                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/80 text-[11px] font-bold">
                                  ⏳ {course.pendingAssignments} Pending
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-5 pt-3.5 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-500">Completion Progress</span>
                              <span className="text-indigo-600">{course.completionRate}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all"
                                style={{ width: `${course.completionRate}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-end gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform pt-1">
                              Open Coursework <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Profile & Workflow Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Quick Details Card */}
            <div className="classic-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Student Profile</h2>
                    <p className="text-xs text-slate-500">Account overview</p>
                  </div>
                  <span className="badge badge-student">Student Portal</span>
                </div>

                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{user.name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</dt>
                    <dd className="font-medium text-slate-800 mt-0.5 break-all">{user.email || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Roll Number / Student ID</dt>
                    <dd className="font-mono font-semibold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md inline-block mt-0.5 text-xs">
                      {user.rollNumber || 'Not set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">School / College</dt>
                    <dd className="font-medium text-slate-800 mt-0.5">{user.school || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact Phone</dt>
                    <dd className="font-medium text-slate-800 mt-0.5">{user.phone || '—'}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onEditDetails}
                  className="w-full btn-secondary text-xs"
                >
                  <Pencil className="w-3.5 h-3.5" /> Update Details
                </button>
              </div>
            </div>

            {/* Quick Action Navigation Grid & Workflow Steps */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCourseFilter('');
                    setActiveTab('assignments');
                  }}
                  className="classic-card-interactive rounded-2xl p-6 text-left group transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    All Coursework & OneDrive
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Access shared OneDrive question papers, complete tasks, and log two-step submission confirmations.
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 mt-4 group-hover:translate-x-1 transition-transform">
                    Explore all assignments <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('groups')}
                  className="classic-card-interactive rounded-2xl p-6 text-left group transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Study Group Hub
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Collaborate with classmates, invite members by roll number, and track group completion progress.
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 mt-4 group-hover:translate-x-1 transition-transform">
                    Manage groups <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>

              {/* Quick Workflow Guide */}
              <div className="classic-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-bold text-slate-900">Platform Workflow Guide</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      step: '1',
                      title: 'Open OneDrive',
                      desc: 'Review question papers & open shared materials link.'
                    },
                    {
                      step: '2',
                      title: 'Confirm Submission',
                      desc: 'Paste completed link & add notes for faculty.'
                    },
                    {
                      step: '3',
                      title: 'Group Progress',
                      desc: 'Join study group to update collective completion rates.'
                    }
                  ].map((item) => (
                    <div key={item.step} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                        {item.step}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COURSEWORK TAB */}
      {activeTab === 'assignments' && (
        <StudentAssignmentsView token={token} initialCourseFilter={selectedCourseFilter} />
      )}

      {/* GROUPS TAB */}
      {activeTab === 'groups' && (
        <StudentGroupManager user={user} token={token} onGroupUpdated={onRefreshNotifications} />
      )}

      {/* INBOX TAB */}
      {activeTab === 'notifications' && (
        <NotificationCenter notifications={notifications} token={token} onRefresh={onRefreshNotifications} />
      )}
    </div>
  );
}
