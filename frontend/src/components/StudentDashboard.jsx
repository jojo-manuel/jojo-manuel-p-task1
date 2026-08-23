import React from 'react';
import {
  GraduationCap,
  School,
  BookOpen,
  Calendar,
  Award,
  Bell,
  Edit3,
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function StudentDashboard({ user, onEditDetails }) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fade-in text-left text-slate-800">
      {/* Student Welcome Banner */}
      <div className="classic-card rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-md p-1 border border-white/20 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-xl flex items-center justify-center text-blue-900 text-2xl font-extrabold shadow-inner">
                {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Welcome back, {user.name || 'Student'}!
                </h1>
                <span className="badge bg-white/20 text-white border border-white/30 text-[10px]">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-300" /> Verified Student
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100/90 flex items-center gap-2 flex-wrap font-medium">
                <span className="flex items-center gap-1"><School className="w-4 h-4 text-blue-300" /> {user.school || 'School Not Set'}</span>
                <span className="text-blue-300/40">•</span>
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4 text-indigo-300" /> {user.class || 'Class N/A'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onEditDetails}
              className="bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4 text-blue-200" /> Edit Details
            </button>
          </div>
        </div>
      </div>

      {/* Main Student Page Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Identity Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="classic-card rounded-3xl p-6 relative shadow-md bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4.5 h-4.5 text-blue-700" /> Student Identity Card
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Full Name</span>
                <span className="font-extrabold text-slate-900 text-sm">{user.name || 'Not Provided'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">School Name</span>
                <span className="font-bold text-slate-800 text-sm">{user.school || 'Not Provided'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Class / Grade</span>
                  <span className="font-bold text-blue-700 text-sm">{user.class || 'N/A'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Roll Number</span>
                  <span className="font-bold text-blue-700 text-sm">#{user.rollNumber || 'N/A'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Phone Number</span>
                <span className="font-semibold text-slate-800">{user.phone || 'N/A'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Registered Email</span>
                <span className="font-semibold text-slate-800 truncate block">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Quick Performance Metrics */}
          <div className="classic-card rounded-3xl p-6 space-y-4 bg-white border border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 text-center">
                <Award className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <span className="text-xl font-extrabold text-blue-900 block">96.4%</span>
                <span className="text-[11px] text-blue-700 font-semibold">Attendance</span>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-center">
                <BookOpen className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
                <span className="text-xl font-extrabold text-indigo-900 block">5</span>
                <span className="text-[11px] text-indigo-700 font-semibold">Enrolled Courses</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Portal Schedule & Notices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Class Schedule / Timetable */}
          <div className="classic-card rounded-3xl p-6 bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-700" /> Today's Academic Schedule
              </h3>
              <span className="text-xs text-slate-500 font-semibold">Academic Term 2026</span>
            </div>

            <div className="space-y-3">
              {[
                { time: '09:00 AM - 10:30 AM', subject: 'Advanced Computer Science', room: 'Lab 3', teacher: 'Dr. Alan Turing' },
                { time: '10:45 AM - 12:15 PM', subject: 'Mathematics & Calculus', room: 'Hall B', teacher: 'Prof. Ada Lovelace' },
                { time: '01:30 PM - 03:00 PM', subject: 'Physics & Electromagnetism', room: 'Physics Lab', teacher: 'Dr. Nikola Tesla' }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between hover:border-blue-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.subject}</h4>
                      <p className="text-xs text-slate-500">{item.teacher} • {item.room}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-blue-800 border border-slate-200 shadow-xs">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* School Notices */}
          <div className="classic-card rounded-3xl p-6 bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-600" /> School Announcements
              </h3>
              <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Notice Board
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                  Semester Examination Schedule
                </h4>
                <p className="text-xs text-amber-950">
                  Semester examinations start next month. Ensure your roll number <strong>#{user.rollNumber}</strong> is registered on all subject forms.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 mb-1">Joineazy Registration Complete</h4>
                <p className="text-xs text-slate-600">
                  Student details for <strong>{user.school}</strong> (Class: {user.class}) have been verified and saved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
