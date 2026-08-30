import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  ExternalLink,
  CheckCircle,
  Clock,
  Send,
  AlertCircle,
  BookOpen,
  X,
  Check,
  Award,
  ShieldCheck,
  CheckSquare,
  Users,
  AlertTriangle,
  UserCheck,
  Zap,
  ChevronDown,
  ArrowLeft,
  Search
} from 'lucide-react';
import { PopoverSelect, getAnchoredStyle } from './AnchoredPopover';
import { useToast } from './Toast';
import { SkeletonCardGrid, ButtonSpinner, LoadingSpinner } from './LoadingSpinner';

export default function StudentAssignmentsView({ token, initialCourseFilter = '' }) {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('active'); // 'active' | 'completed' | 'missed'
  const [selectedCourse, setSelectedCourse] = useState(initialCourseFilter || '');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedAsgn, setSelectedAsgn] = useState(null);
  const [submitAnchorRect, setSubmitAnchorRect] = useState(null);
  const [submitStep, setSubmitStep] = useState(1);
  const [hasConfirmedUpload, setHasConfirmedUpload] = useState(false);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    fetchAssignments();
    fetchGroups();
  }, [token]);

  // Bulletproof Lock background body scroll when submission modal is open
  useEffect(() => {
    if (selectedAsgn) {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        window.scrollTo(0, scrollY);
      };
    }
  }, [selectedAsgn]);

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.groups) {
        setGroups(
          data.groups.filter((g) => g.user_status === 'accepted' || g.user_role === 'creator')
        );
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.assignments) {
        setAssignments(data.assignments);
      } else {
        setError(data.message || 'Failed to load assignments');
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError('Failed to connect to coursework service');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmitModal = (asgn, event) => {
    if (event?.currentTarget) {
      setSubmitAnchorRect(event.currentTarget.getBoundingClientRect());
    } else {
      setSubmitAnchorRect(null);
    }
    setSelectedAsgn(asgn);
    setSubmitStep(1);
    setHasConfirmedUpload(false);
    setSubmissionLink(asgn.submission?.submission_link || asgn.onedrive_link || '');
    setSubmissionNotes(asgn.submission?.submission_notes || '');
    const firstGroup = (asgn.groupProgress && asgn.groupProgress[0]) || groups[0];
    setSelectedGroupId(firstGroup ? String(firstGroup.groupId || firstGroup.id) : '');
    setSubmitSuccess(null);
    setSubmitError(null);
  };

  const handleProceedToStep2 = (e) => {
    e.preventDefault();
    if (!hasConfirmedUpload) {
      setSubmitError('Please check “Yes, I have submitted” before continuing.');
      toast.warning('Please confirm upload on OneDrive before continuing.');
      return;
    }
    setSubmitError(null);
    setSubmitStep(2);
  };

  const handleFinalConfirmSubmission = async () => {
    if (!selectedAsgn) return;

    setSubmitting(true);
    setSubmitSuccess(null);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/assignments/${encodeURIComponent(selectedAsgn.id)}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          submissionLink,
          submissionNotes,
          groupId: selectedGroupId || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to confirm submission');
      }

      const asgnTitle = selectedAsgn.title || 'Coursework';
      setSubmitSuccess(data.message || 'Submission confirmation recorded!');
      toast.success(`Submission recorded for "${asgnTitle}"! Faculty notified.`);
      setTimeout(() => {
        setSelectedAsgn(null);
        setSubmitSuccess(null);
        setSubmitStep(1);
      }, 1400);

      await fetchAssignments();
    } catch (err) {
      setSubmitError(err.message);
      toast.error(err.message || 'Failed to submit assignment');
      setSubmitStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  const now = Date.now();
  const todayStr = new Date().toISOString().slice(0, 10);

  const completedAssignments = assignments.filter((a) => a.isSubmitted);
  const missedAssignments = assignments.filter(
    (a) => !a.isSubmitted && a.due_date && new Date(a.due_date).getTime() < now
  );
  const activeAssignments = assignments.filter(
    (a) => !a.isSubmitted && (!a.due_date || new Date(a.due_date).getTime() >= now)
  );

  // Due Today Alert Calculation
  const dueTodayAssignments = assignments.filter((a) => {
    if (a.isSubmitted || !a.due_date) return false;
    const dateStr = new Date(a.due_date).toISOString().slice(0, 10);
    return dateStr === todayStr;
  });

  const totalCount = assignments.length;
  const completedCount = completedAssignments.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const availableCourses = Array.from(
    new Set(assignments.map((a) => a.course_name || 'General Coursework'))
  );

  const baseAssignments =
    filterTab === 'completed'
      ? completedAssignments
      : filterTab === 'missed'
      ? missedAssignments
      : activeAssignments;

  const courseFiltered = selectedCourse && selectedCourse !== 'ALL'
    ? baseAssignments.filter((a) => (a.course_name || 'General Coursework') === selectedCourse)
    : baseAssignments;

  const displayedAssignments = searchTerm.trim()
    ? courseFiltered.filter((a) => {
        const query = searchTerm.toLowerCase().trim();
        return (
          (a.title && a.title.toLowerCase().includes(query)) ||
          (a.course_name && a.course_name.toLowerCase().includes(query)) ||
          (a.teacher_name && a.teacher_name.toLowerCase().includes(query)) ||
          (a.description && a.description.toLowerCase().includes(query))
        );
      })
    : courseFiltered;

  return (
    <div className="w-full space-y-6 text-left animate-fade-up">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Coursework</h2>
            <p className="text-sm text-slate-500 mt-1">
              View official question papers, submit on OneDrive, and track deadlines.
            </p>
          </div>
          <p className="text-sm text-slate-500 font-semibold">
            {completedCount} of {totalCount} confirmed ({progressPercent}%)
          </p>
        </div>
        <div className="h-1.5 w-full progress-track">
          <div
            style={{ width: `${progressPercent}%` }}
            className="progress-fill"
          />
        </div>
      </div>

      {/* Quick Search & Course Filter Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search coursework, topic, or instructor..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs font-medium text-slate-800 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Enrolled Course Dropdown */}
          {availableCourses.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative min-w-[200px]">
                <select
                  id="course-filter-select"
                  value={selectedCourse || 'ALL'}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs font-bold text-slate-800 appearance-none cursor-pointer transition-all shadow-sm"
                >
                  <option value="ALL">All Courses ({assignments.length})</option>
                  {availableCourses.map((cName) => {
                    const count = assignments.filter((a) => (a.course_name || 'General Coursework') === cName).length;
                    return (
                      <option key={cName} value={cName}>
                        {cName} ({count})
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {selectedCourse && selectedCourse !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedCourse('ALL')}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold shrink-0 transition-colors border border-slate-200"
                  title="Show all courses"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Due Today Alert Box */}
      {dueTodayAssignments.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-sm space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500 text-white font-extrabold text-xs shrink-0 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> DUE TODAY ALERT
              </span>
              <h4 className="text-sm font-extrabold text-amber-950">
                {dueTodayAssignments.length} {dueTodayAssignments.length === 1 ? 'Assignment' : 'Assignments'} Due Today!
              </h4>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-200/80 px-3 py-1 rounded-full border border-amber-300">
              Action Required
            </span>
          </div>
          <div className="space-y-1.5 pt-1 pl-1">
            {dueTodayAssignments.map((a) => (
              <div key={a.id} className="text-xs font-semibold text-amber-900 flex items-center justify-between gap-3 bg-amber-100/60 p-2 rounded-xl border border-amber-200/60">
                <span className="truncate">• {a.title} (Assigned by {a.teacher_name || 'Teacher'})</span>
                <span className="text-[11px] font-bold text-amber-800 shrink-0">
                  Due at {new Date(a.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs: Active / Completed / Missed */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilterTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            filterTab === 'active'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Active Coursework</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-200 font-bold">
            {activeAssignments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            filterTab === 'completed'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Completed Section</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-800 text-emerald-100 font-bold">
            {completedAssignments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('missed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            filterTab === 'missed'
              ? 'bg-rose-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Missed Section</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-800 text-rose-100 font-bold">
            {missedAssignments.length}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <LoadingSpinner
            size="lg"
            text="Loading coursework & assignments..."
            subtext="Syncing course deadlines, questions papers & submission records"
          />
          <SkeletonCardGrid count={4} />
        </div>
      ) : displayedAssignments.length === 0 ? (
        <div className="p-12 text-center classic-card rounded-xl bg-white border border-slate-200 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {filterTab === 'completed'
              ? 'No Completed Assignments Yet'
              : filterTab === 'missed'
              ? 'No Missed Assignments! Great Job!'
              : 'No Active Assignments Posted'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filterTab === 'completed'
              ? 'When you complete and confirm an assignment, it will appear here.'
              : filterTab === 'missed'
              ? 'You have submitted all past assignments on time.'
              : 'When a teacher posts coursework for your class or group, it will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {displayedAssignments.map((asgn) => {
            const isDone = asgn.isSubmitted;
            const isExpired = !isDone && asgn.due_date && new Date(asgn.due_date).getTime() < now;
            const isGroupTask = asgn.assigned_to_type === 'groups';
            const primaryProgress = (asgn.groupProgress && asgn.groupProgress[0]) || null;

            return (
              <div
                key={asgn.id}
                className={`classic-card rounded-2xl p-4 sm:p-5 bg-white border shadow-md space-y-3.5 flex flex-col justify-between transition-all hover:shadow-lg min-w-0 ${
                  isExpired
                    ? 'border-rose-300 bg-rose-50/20 hover:border-rose-400'
                    : isDone
                    ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-white'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {/* Submission Type Badge (Individual vs Group) */}
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                            isGroupTask
                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}
                        >
                          {isGroupTask ? <Users className="w-3 h-3 text-purple-600" /> : <UserCheck className="w-3 h-3 text-blue-600" />}
                          {asgn.submissionType || (isGroupTask ? 'Group Assignment' : 'Individual Assignment')}
                        </span>

                        {/* Course Name Tag */}
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {asgn.course_name || 'General Coursework'}
                        </span>

                        {/* Assigned Teacher Name */}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                          Teacher: {asgn.teacher_name || 'Faculty Member'}
                        </span>

                        {asgn.due_date && (
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> Due:{' '}
                            {new Date(asgn.due_date).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">{asgn.title}</h3>
                    </div>
                    {isDone ? (
                      <span className="badge bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold shrink-0 flex items-center gap-1.5 animate-fade-in shadow-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-600 animate-check-bounce" /> Confirmed Submitted
                      </span>
                    ) : isExpired ? (
                      <span className="badge bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold shrink-0 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Assignment Missed
                      </span>
                    ) : (
                      <span className="badge bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold shrink-0 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Pending Submission
                      </span>
                    )}
                  </div>

                  {asgn.description && (
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{asgn.description}</p>
                  )}

                  {/* Official Question Paper PDF */}
                  {asgn.question_paper_url && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          📄
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold text-emerald-950 block truncate">
                            {asgn.question_paper_name || 'Question Paper (PDF)'}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            Official Question Paper PDF
                          </span>
                        </div>
                      </div>
                      <a
                        href={asgn.question_paper_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={asgn.question_paper_name || 'question_paper.pdf'}
                        className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shrink-0 min-h-10 transition-all shadow-sm"
                      >
                        <FileText className="w-4 h-4" /> View / Download PDF <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {asgn.onedrive_link && (
                    <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-indigo-950 block truncate">OneDrive folder</span>
                        <span className="text-[10px] text-indigo-600 font-medium">Upload, then confirm below</span>
                      </div>
                      <a
                        href={asgn.onedrive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shrink-0 min-h-10"
                      >
                        Open OneDrive <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {primaryProgress && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-start justify-between gap-2 text-[11px] font-bold">
                        <span className="text-slate-700 flex items-center gap-1 min-w-0">
                          <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{primaryProgress.groupName} progress</span>
                        </span>
                        <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shrink-0">
                          {primaryProgress.submittedCount} of {primaryProgress.memberCount} done ({primaryProgress.percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${primaryProgress.percent}%` }}
                          className="h-full bg-indigo-600 rounded-full transition-all"
                        />
                      </div>

                      {primaryProgress.members && primaryProgress.members.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/80 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Group Members Submission Status:
                          </span>
                          <div className="flex flex-col gap-1.5 text-[11px]">
                            {primaryProgress.members.map((m) => (
                              <div
                                key={m.userId}
                                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200/80"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                    {(m.name || m.email || 'S').charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-slate-800 font-bold truncate">
                                    {m.name || m.email}
                                  </span>
                                </div>
                                {m.submitted ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                    ✓ Submitted
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                                    Pending
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                  {/* Teacher Grade & Feedback Display */}
                  {asgn.submission?.grade && (
                    <div className="p-3.5 rounded-2xl bg-purple-50/90 border border-purple-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-purple-600" /> Grade Assigned: {asgn.submission.grade}
                        </span>
                        {asgn.submission.graded_at && (
                          <span className="text-[10px] text-purple-600 font-bold">
                            {new Date(asgn.submission.graded_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {asgn.submission.feedback && (
                        <p className="text-xs text-purple-900 font-medium italic bg-white/70 p-2 rounded-xl border border-purple-100">
                          Teacher Feedback: "{asgn.submission.feedback}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submission Action Button & Group Leader Acknowledgment Rules */}
                  {isGroupTask && asgn.userGroupRole === 'member' ? (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      {isDone ? (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 min-w-0 truncate">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            Confirmed by Group Leader ({asgn.groupLeaderName || 'Leader'})
                          </span>
                          <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                            Group Confirmed
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-amber-950">
                            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                            Awaiting Group Leader Confirmation
                          </div>
                          <p className="text-[11px] text-amber-800 leading-snug">
                            Only your Group Leader (<strong>{asgn.groupLeaderName || 'Leader'}</strong>) can confirm submission for {asgn.groupName || 'your group'}.
                          </p>
                          <button
                            type="button"
                            disabled
                            className="w-full py-2 px-3 rounded-xl bg-amber-200/60 text-amber-900 text-xs font-bold cursor-not-allowed opacity-80 mt-1"
                            title={`Only ${asgn.groupLeaderName || 'Group Leader'} can submit on behalf of ${asgn.groupName || 'the group'}`}
                          >
                            🔒 Group Leader Confirmation Required
                          </button>
                        </div>
                      )}
                    </div>
                  ) : isDone ? (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Confirmed on{' '}
                        {new Date(asgn.submission.created_at).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => handleOpenSubmitModal(asgn, event)}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 underline min-h-10 px-2"
                      >
                        Update submission
                      </button>
                    </div>
                  ) : isExpired ? (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-xs text-rose-700 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-rose-600" /> Deadline Passed
                      </span>
                      <button
                        type="button"
                        onClick={(event) => handleOpenSubmitModal(asgn, event)}
                        className="btn-secondary py-2 px-3 text-xs min-h-10"
                      >
                        Late Submit
                      </button>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(event) => handleOpenSubmitModal(asgn, event)}
                        className={`w-full py-2.5 text-xs min-h-10 justify-center btn-primary ${
                          isGroupTask ? 'bg-purple-600 hover:bg-purple-700' : ''
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        {isGroupTask
                          ? `👑 Submit Group Work (${asgn.groupName || 'Leader Authority'})`
                          : 'Submit & Confirm Work'}
                      </button>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}

      {selectedAsgn &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-[3px] animate-fade-in"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedAsgn(null);
            }}
          >
            <div
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl shadow-slate-900/25 flex flex-col overflow-hidden text-left animate-pop-in"
              style={getAnchoredStyle(submitAnchorRect, 580, 680)}
              onMouseDown={(event) => event.stopPropagation()}
            >
              {/* Fixed Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedAsgn(null)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Go Back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" />
                      <span>Confirm Assignment Submission</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">"{selectedAsgn.title}"</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAsgn(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                {submitSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 text-xs sm:text-sm font-bold flex items-center gap-3 animate-fade-up shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm shrink-0 animate-check-bounce">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-emerald-950">Submission Confirmed!</h4>
                      <p className="text-xs font-semibold text-emerald-700 mt-0.5">{submitSuccess}</p>
                    </div>
                  </div>
                )}

                {submitError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs sm:text-sm font-bold text-slate-500">
                  <span className={submitStep === 1 ? 'text-indigo-600 font-extrabold' : ''}>
                    1. Upload Confirmation
                  </span>
                  <span>→</span>
                  <span className={submitStep === 2 ? 'text-indigo-600 font-extrabold' : ''}>
                    2. Final Details & Submit
                  </span>
                </div>

                {selectedAsgn.assigned_to_type === 'groups' && (
                  <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 text-xs font-semibold flex items-start gap-2.5 shadow-sm">
                    <span className="text-base shrink-0">👑</span>
                    <div>
                      <strong className="block text-purple-900 font-extrabold">
                        Group Leader Submission Authority ({selectedAsgn.groupName || 'Study Group'})
                      </strong>
                      <span className="text-slate-600 text-[11px] leading-relaxed">
                        As Group Leader, confirming this submission will automatically mark the project as completed for all members in your group and notify your professor.
                      </span>
                    </div>
                  </div>
                )}

                {submitStep === 1 ? (
                  <div className="space-y-4">
                    <p className="text-xs sm:text-sm text-slate-600 font-medium">
                      Have you uploaded your assignment files to the teacher's OneDrive folder?
                    </p>

                    {selectedAsgn.onedrive_link && (
                      <a
                        href={selectedAsgn.onedrive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 min-h-11 transition-all shadow-sm"
                      >
                        Open OneDrive Folder <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    <label className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-all">
                      <input
                        type="checkbox"
                        checked={hasConfirmedUpload}
                        onChange={(e) => setHasConfirmedUpload(e.target.checked)}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300"
                      />
                      <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                        Yes, I have uploaded my completed assignment files to OneDrive.
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                        OneDrive File / Folder Link (Optional)
                      </label>
                      <input
                        type="url"
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                        placeholder="https://1drv.ms/u/s!..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                        Notes for Professor (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={submissionNotes}
                        onChange={(e) => setSubmissionNotes(e.target.value)}
                        placeholder="e.g. Uploaded PDF in team folder under Eleanor_Project.pdf"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                      />
                    </div>

                    {groups.length > 0 && (
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                          Associate Submission with Study Group:
                        </label>
                        <PopoverSelect
                          value={selectedGroupId}
                          onChange={setSelectedGroupId}
                          placeholder="No specific group"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800"
                          options={[
                            { value: '', label: 'No specific group' },
                            ...groups.map((g) => ({ value: String(g.id), label: g.name }))
                          ]}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Floating Sticky Footer */}
              <div className="p-4 sm:p-5 bg-slate-50/95 backdrop-blur-sm border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                {submitStep === 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedAsgn(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white min-h-11 flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToStep2}
                      className="btn-primary py-2.5 px-5 text-xs font-bold min-h-11 cursor-pointer"
                    >
                      Continue to Step 2 →
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setSubmitStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white min-h-11 flex items-center justify-center gap-1.5"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleFinalConfirmSubmission}
                      className="btn-primary py-2.5 px-5 text-xs font-bold min-h-11 flex items-center gap-2 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <ButtonSpinner className="w-3.5 h-3.5" />
                          <span>Confirming...</span>
                        </>
                      ) : (
                        'Final Confirm & Publish'
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
