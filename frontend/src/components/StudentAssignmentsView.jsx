import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
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
  Zap
} from 'lucide-react';
import { PopoverSelect } from './AnchoredPopover';

export default function StudentAssignmentsView({ token }) {
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('active'); // 'active' | 'completed' | 'missed'

  const [selectedAsgn, setSelectedAsgn] = useState(null);
  const [submitStep, setSubmitStep] = useState(1);
  const [hasConfirmedUpload, setHasConfirmedUpload] = useState(false);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitPopoverStyle, setSubmitPopoverStyle] = useState(null);
  const submitAnchorRef = useRef(null);

  useEffect(() => {
    fetchAssignments();
    fetchGroups();
  }, [token]);

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
    submitAnchorRef.current = event?.currentTarget || null;
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

  useLayoutEffect(() => {
    if (!selectedAsgn) {
      setSubmitPopoverStyle(null);
      return undefined;
    }

    const place = () => {
      const margin = 12;
      const gap = 10;
      const width = Math.min(720, window.innerWidth - margin * 2);
      const maxHeight = Math.min(760, window.innerHeight - margin * 2);
      const anchor = submitAnchorRef.current?.getBoundingClientRect();
      const fallbackLeft = Math.max(margin, (window.innerWidth - width) / 2);

      if (!anchor) {
        setSubmitPopoverStyle({
          left: fallbackLeft,
          top: Math.max(margin, window.innerHeight * 0.08),
          width,
          maxHeight
        });
        return;
      }

      const spaceBelow = window.innerHeight - anchor.bottom - gap - margin;
      const spaceAbove = anchor.top - gap - margin;
      const openUp = spaceBelow < 420 && spaceAbove > spaceBelow;

      let left = anchor.left;
      if (left + width > window.innerWidth - margin) {
        left = anchor.right - width;
      }
      if (left < margin) left = margin;

      if (openUp) {
        setSubmitPopoverStyle({
          left,
          width,
          maxHeight: Math.min(maxHeight, Math.max(220, spaceAbove)),
          bottom: window.innerHeight - anchor.top + gap,
          top: 'auto'
        });
      } else {
        setSubmitPopoverStyle({
          left,
          width,
          maxHeight: Math.min(maxHeight, Math.max(220, spaceBelow)),
          top: anchor.bottom + gap,
          bottom: 'auto'
        });
      }
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [selectedAsgn, submitStep]);

  const handleProceedToStep2 = (e) => {
    e.preventDefault();
    if (!hasConfirmedUpload) {
      setSubmitError('Please check “Yes, I have submitted” before continuing.');
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

      setSubmitSuccess(data.message || 'Submission confirmation recorded!');
      setTimeout(() => {
        setSelectedAsgn(null);
        setSubmitSuccess(null);
        setSubmitStep(1);
      }, 1400);

      await fetchAssignments();
    } catch (err) {
      setSubmitError(err.message);
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

  const displayedAssignments =
    filterTab === 'completed'
      ? completedAssignments
      : filterTab === 'missed'
      ? missedAssignments
      : activeAssignments;

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
          <p className="text-sm text-slate-500">
            {completedCount} of {totalCount} confirmed
          </p>
        </div>
        <div className="h-1.5 w-full progress-track">
          <div
            style={{ width: `${progressPercent}%` }}
            className="progress-fill"
          />
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
        <div className="p-12 text-center classic-card rounded-xl bg-white space-y-2">
          <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Loading assignments...</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedAssignments.map((asgn) => {
            const isDone = asgn.isSubmitted;
            const isExpired = !isDone && asgn.due_date && new Date(asgn.due_date).getTime() < now;
            const isGroupTask = asgn.assigned_to_type === 'groups';
            const primaryProgress = (asgn.groupProgress && asgn.groupProgress[0]) || null;

            return (
              <div
                key={asgn.id}
                className={`classic-card rounded-2xl sm:rounded-xl p-4 sm:p-6 bg-white border shadow-md space-y-4 flex flex-col justify-between transition-all min-w-0 ${
                  isExpired
                    ? 'border-rose-300 bg-rose-50/20'
                    : isDone
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            isGroupTask
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {isGroupTask ? 'Group Task' : 'All Students'}
                        </span>

                        {/* Assigned Teacher Name */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-indigo-600" />
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
                      <span className="badge bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-semibold shrink-0 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Submitted
                      </span>
                    ) : isExpired ? (
                      <span className="badge bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold shrink-0 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Assignment Missed
                      </span>
                    ) : (
                      <span className="badge bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold shrink-0 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending
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
                            Member Submission Status:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                            {primaryProgress.members.map((m) => (
                              <div
                                key={m.userId}
                                className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white border border-slate-200/80"
                              >
                                <span className="text-slate-800 font-semibold truncate min-w-0">
                                  {m.name || m.email}
                                </span>
                                {m.submitted ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                                    ✓ Submitted
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
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

                {/* Submission Action Button */}
                {isDone ? (
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
                      className="btn-primary w-full py-2.5 text-xs min-h-10 justify-center"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit & Confirm Work
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
            className="submit-popover-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedAsgn(null);
            }}
          >
            <div
              className="submit-popover space-y-6 text-left"
              style={submitPopoverStyle || { visibility: 'hidden' }}
              onMouseDown={(event) => event.stopPropagation()}
            >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-6 h-6 text-indigo-600 shrink-0" />
                  <span>Confirm Assignment Submission</span>
                </h3>
                <p className="text-sm text-slate-500 mt-1 truncate">"{selectedAsgn.title}"</p>
              </div>
              <button
                onClick={() => setSelectedAsgn(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm font-bold text-slate-500">
              <span className={submitStep === 1 ? 'text-indigo-600 font-extrabold' : ''}>
                1. Upload Confirmation
              </span>
              <span>→</span>
              <span className={submitStep === 2 ? 'text-indigo-600 font-extrabold' : ''}>
                2. Final Details & Submit
              </span>
            </div>

            {submitStep === 1 ? (
              <div className="space-y-5">
                <p className="text-sm text-slate-600 font-medium">
                  Have you uploaded your assignment files to the teacher's OneDrive folder?
                </p>

                {selectedAsgn.onedrive_link && (
                  <a
                    href={selectedAsgn.onedrive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 min-h-11 transition-all"
                  >
                    Open OneDrive Folder <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-all">
                  <input
                    type="checkbox"
                    checked={hasConfirmedUpload}
                    onChange={(e) => setHasConfirmedUpload(e.target.checked)}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500 rounded border-slate-300"
                  />
                  <span className="text-sm font-bold text-slate-800 leading-snug">
                    Yes, I have uploaded my completed assignment files to OneDrive.
                  </span>
                </label>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    className="btn-primary w-full py-3 text-sm justify-center min-h-11"
                  >
                    Continue to Step 2 →
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    OneDrive File / Folder Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={submissionLink}
                    onChange={(e) => setSubmissionLink(e.target.value)}
                    placeholder="https://1drv.ms/u/s!..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Notes for Professor (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="e.g. Uploaded PDF in team folder under Eleanor_Project.pdf"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>

                {groups.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Associate Submission with Study Group:
                    </label>
                    <PopoverSelect
                      value={selectedGroupId}
                      onChange={setSelectedGroupId}
                      placeholder="No specific group"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                      options={[
                        { value: '', label: 'No specific group' },
                        ...groups.map((g) => ({ value: String(g.id), label: g.name }))
                      ]}
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setSubmitStep(1)}
                    className="btn-secondary w-1/3 py-3 text-sm justify-center min-h-11"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleFinalConfirmSubmission}
                    className="btn-primary w-2/3 py-3 text-sm justify-center min-h-11"
                  >
                    {submitting ? 'Confirming...' : 'Final Confirm & Publish'}
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
