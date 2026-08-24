import React, { useState, useEffect } from 'react';
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
  Users
} from 'lucide-react';

export default function StudentAssignmentsView({ token }) {
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedAsgn, setSelectedAsgn] = useState(null);
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

  const handleOpenSubmitModal = (asgn) => {
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

  const totalCount = assignments.length;
  const completedCount = assignments.filter((a) => a.isSubmitted).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="w-full space-y-6 text-left animate-fade-in">
      <div className="portal-hero p-4 sm:p-6 md:p-7 space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="text-sm text-indigo-100 font-medium">Your coursework</p>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">Assignments</h2>
            <p className="text-sm text-slate-200 mt-1">
              Upload to OneDrive, then confirm here so your professor can see it.
            </p>
          </div>
          <span className="bg-white/15 border border-white/20 px-3.5 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-300" />
            {progressPercent === 100 && totalCount > 0 ? 'All complete' : `${progressPercent}% complete`}
          </span>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2">
          <div className="flex items-start sm:items-center justify-between gap-2 text-xs font-bold">
            <span className="text-indigo-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> Personal completion
            </span>
            <span className="text-white font-extrabold shrink-0">
              {completedCount}/{totalCount} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              style={{ width: `${progressPercent}%` }}
              className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-700"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center classic-card rounded-3xl bg-white space-y-2">
          <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Loading assignments...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="p-12 text-center classic-card rounded-3xl bg-white border border-slate-200 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No assignments posted yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When a professor posts coursework for your class or group, it will appear here with a OneDrive link.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((asgn) => {
            const isDone = asgn.isSubmitted;
            const isGroupTask = asgn.assigned_to_type === 'groups';
            const primaryProgress = (asgn.groupProgress && asgn.groupProgress[0]) || null;

            return (
              <div
                key={asgn.id}
                className="classic-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-white border border-slate-200 shadow-md space-y-4 flex flex-col justify-between hover:border-indigo-300 transition-all min-w-0"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            isGroupTask
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {isGroupTask ? 'Group Task' : 'All Students'}
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
                      <h3 className="text-base font-extrabold text-slate-900">{asgn.title}</h3>
                    </div>
                    {isDone ? (
                      <span className="badge bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold shrink-0 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Submitted
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
                        className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shrink-0 min-h-10"
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
                        <span className={`${primaryProgress.complete ? 'text-emerald-700' : 'text-indigo-700'} shrink-0`}>
                          {primaryProgress.submittedCount}/{primaryProgress.memberCount} · {primaryProgress.percent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${primaryProgress.percent}%` }}
                          className={`h-full rounded-full ${primaryProgress.complete ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        />
                      </div>
                    </div>
                  )}

                  {isDone && asgn.submission && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-1">
                      <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> Two-step confirmation recorded
                      </span>
                      {asgn.submission.submission_link && (
                        <a
                          href={asgn.submission.submission_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 font-bold hover:underline block truncate"
                        >
                          {asgn.submission.submission_link}
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-stretch sm:justify-end">
                  <button
                    onClick={() => handleOpenSubmitModal(asgn)}
                    className={`w-full sm:w-auto justify-center font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 min-h-11 ${
                      isDone
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    {isDone ? 'Update confirmation' : 'Yes, I have submitted'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAsgn && (
        <div className="modal-overlay">
          <div className="modal-sheet bg-white border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  Step {submitStep} of 2
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {submitStep === 1 ? 'Yes, I have submitted' : 'Confirm submission'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAsgn(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitStep === 1 ? (
              <form onSubmit={handleProceedToStep2} className="space-y-4">
                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-2">
                  <p className="text-xs font-bold text-indigo-950">Assignment: {selectedAsgn.title}</p>
                  {selectedAsgn.onedrive_link && (
                    <a
                      href={selectedAsgn.onedrive_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1"
                    >
                      Open OneDrive folder <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <label className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasConfirmedUpload}
                    onChange={(e) => setHasConfirmedUpload(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 mt-0.5"
                  />
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    Yes, I have submitted — my work is uploaded to the OneDrive folder.
                  </span>
                </label>

                {groups.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Credit this group</label>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                    >
                      <option value="">Individual confirmation</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Optional OneDrive file link</label>
                  <input
                    type="url"
                    value={submissionLink}
                    onChange={(e) => setSubmissionLink(e.target.value)}
                    placeholder="https://1drv.ms/u/s!..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes for your professor</label>
                  <textarea
                    rows={2}
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="Optional comments..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                  />
                </div>

                <div className="pt-2 action-stack">
                  <button
                    type="button"
                    onClick={() => setSelectedAsgn(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 min-h-11"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl min-h-11"
                  >
                    Continue to confirm →
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-center">
                  <ShieldCheck className="w-8 h-8 text-amber-600 mx-auto" />
                  <h4 className="text-sm font-extrabold text-amber-950">Confirm submission</h4>
                  <p className="text-xs text-amber-800 font-medium">
                    This records that you submitted “{selectedAsgn.title}” and updates your group progress bar.
                  </p>
                </div>
                <div className="pt-2 action-stack">
                  <button
                    type="button"
                    onClick={() => setSubmitStep(1)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 min-h-11"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleFinalConfirmSubmission}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl flex items-center gap-1.5 min-h-11"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {submitting ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
