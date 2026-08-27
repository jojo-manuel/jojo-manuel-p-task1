import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Shield,
  School,
  Phone,
  Mail,
  Hash,
  BookOpen,
  PlusCircle,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle,
  BarChart3,
  TrendingUp,
  Clock,
  X,
  FileText,
  Send,
  AlertCircle,
  Upload,
  UserCheck,
  Award
} from 'lucide-react';
import { DateTimeField } from './AnchoredPopover';

export default function AdminDashboard({ token }) {
  const [activeTab, setActiveTab] = useState('assignments');

  // Directory state
  const [students, setStudents] = useState([]);
  const [loadingDirectory, setLoadingDirectory] = useState(true);
  const [directoryError, setDirectoryError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Assignments state
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [asgnError, setAsgnError] = useState(null);

  // Groups list (for assigning work to specific groups)
  const [availableGroups, setAvailableGroups] = useState([]);

  // Assignment Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsgn, setEditingAsgn] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseName, setCourseName] = useState('Physics 101');
  const [dueDate, setDueDate] = useState('');
  const [onedriveLink, setOnedriveLink] = useState('');
  const [assignedToType, setAssignedToType] = useState('all');
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [questionPaperUrl, setQuestionPaperUrl] = useState('');
  const [questionPaperName, setQuestionPaperName] = useState('');
  const [pdfUploading, setPdfUploading] = useState(false);
  const [savingAsgn, setSavingAsgn] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Grading Modal State
  const [gradingSub, setGradingSub] = useState(null);
  const [gradeValue, setGradeValue] = useState('');
  const [feedbackValue, setFeedbackValue] = useState('');
  const [gradingLoading, setGradingLoading] = useState(false);
  const [gradeError, setGradeError] = useState(null);

  const fetchStudents = async () => {
    setLoadingDirectory(true);
    setDirectoryError(null);
    try {
      const response = await fetch('/api/admin/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStudents(data.students || []);
      } else {
        setDirectoryError(data.message || 'Failed to fetch student directory');
      }
    } catch (err) {
      console.error(err);
      setDirectoryError('Network error fetching student directory');
    } finally {
      setLoadingDirectory(false);
    }
  };

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    setAsgnError(null);
    try {
      const res = await fetch('/api/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAssignments(data.assignments || []);
      } else {
        setAsgnError(data.message || 'Failed to load assignments');
      }
    } catch (err) {
      console.error(err);
      setAsgnError('Failed to fetch assignments');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchAnalyticsAndGroups = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAnalytics(data);
        if (data.groupPerformance) {
          setAvailableGroups(data.groupPerformance);
        }
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchAnalyticsAndGroups();
    fetchStudents();
  }, [token]);

  // Open modal for new assignment
  const handleOpenCreateModal = () => {
    setEditingAsgn(null);
    setTitle('');
    setDescription('');
    setCourseName('Physics 101');
    setDueDate('');
    setOnedriveLink('');
    setAssignedToType('all');
    setSelectedGroupIds([]);
    setQuestionPaperUrl('');
    setQuestionPaperName('');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing assignment
  const handleOpenEditModal = (asgn) => {
    setEditingAsgn(asgn);
    setTitle(asgn.title || '');
    setDescription(asgn.description || '');
    setCourseName(asgn.course_name || 'General Coursework');
    setDueDate(asgn.due_date ? new Date(asgn.due_date).toISOString().slice(0, 16) : '');
    setOnedriveLink(asgn.onedrive_link || '');
    setAssignedToType(asgn.assigned_to_type || 'all');
    setQuestionPaperUrl(asgn.question_paper_url || '');
    setQuestionPaperName(asgn.question_paper_name || '');
    try {
      const gIds = typeof asgn.assigned_group_ids === 'string' ? JSON.parse(asgn.assigned_group_ids) : (asgn.assigned_group_ids || []);
      setSelectedGroupIds(gIds);
    } catch (e) {
      setSelectedGroupIds([]);
    }
    setModalError(null);
    setIsModalOpen(true);
  };

  // PDF File Selection Handler
  const handlePdfFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setModalError('Please select a valid PDF file (.pdf)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setModalError('PDF file size must be less than 15MB');
      return;
    }

    setPdfUploading(true);
    setModalError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setQuestionPaperUrl(event.target.result);
      setQuestionPaperName(file.name);
      setPdfUploading(false);
    };
    reader.onerror = () => {
      setModalError('Failed to read PDF file');
      setPdfUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePdf = () => {
    setQuestionPaperUrl('');
    setQuestionPaperName('');
  };

  // Save assignment (Create / Update)
  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (dueDate && new Date(dueDate).getTime() < Date.now() - 60000) {
      setModalError('Assignment due date cannot be set in the past');
      return;
    }

    setSavingAsgn(true);
    setModalError(null);
    try {
      const url = editingAsgn ? `/api/assignments/${editingAsgn.id}` : '/api/assignments';
      const method = editingAsgn ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          courseName: courseName.trim() || 'General Coursework',
          dueDate: dueDate || null,
          onedriveLink: onedriveLink.trim() || null,
          assignedToType,
          assignedGroupIds: selectedGroupIds,
          questionPaperUrl,
          questionPaperName
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save assignment');
      }

      setIsModalOpen(false);
      await fetchAssignments();
      await fetchAnalyticsAndGroups();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSavingAsgn(false);
    }
  };

  // Delete assignment
  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchAssignments();
        await fetchAnalyticsAndGroups();
      }
    } catch (err) {
      console.error('Error deleting assignment:', err);
    }
  };

  // Save Grade & Feedback for Submission
  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradingSub) return;
    setGradingLoading(true);
    setGradeError(null);
    try {
      const res = await fetch(`/api/assignments/submissions/${gradingSub.id}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          grade: gradeValue.trim(),
          feedback: feedbackValue.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit grade');
      }

      setGradingSub(null);
      await fetchAnalyticsAndGroups();
      await fetchAssignments();
    } catch (err) {
      setGradeError(err.message);
    } finally {
      setGradingLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.school && s.school.toLowerCase().includes(term)) ||
      (s.class && s.class.toLowerCase().includes(term)) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(term)) ||
      (s.phone && s.phone.toLowerCase().includes(term))
    );
  });

  return (
    <div className="w-full space-y-5 animate-fade-up text-left">
      <section className="mb-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">Assignments</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Post coursework, assign it to the class or a group, and track confirmations.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="btn-primary w-full sm:w-auto min-h-10"
          >
            <PlusCircle className="w-4 h-4" /> New assignment
          </button>
        </div>
      </section>

      <nav className="portal-tabs" aria-label="Faculty sections">
        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className={`portal-tab ${activeTab === 'assignments' ? 'is-active' : ''}`}
        >
          <BookOpen className="w-4 h-4" /> Assignments
          <span className="text-xs opacity-70">({assignments.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`portal-tab ${activeTab === 'analytics' ? 'is-active' : ''}`}
        >
          <BarChart3 className="w-4 h-4" /> Analytics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className={`portal-tab ${activeTab === 'directory' ? 'is-active' : ''}`}
        >
          <Users className="w-4 h-4" /> Students
          <span className="text-xs opacity-70">({students.length})</span>
        </button>
      </nav>

      {/* TAB 1: ASSIGNMENTS MANAGEMENT */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {loadingAssignments ? (
            <div className="text-center py-12 classic-card rounded-xl bg-white space-y-2">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Loading coursework records...</p>
            </div>
          ) : asgnError ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {asgnError}
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 classic-card rounded-xl bg-white border border-slate-200 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No assignments yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Assignments you post appear here. Other faculty members’ work stays in their own workspace.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignments.map((asgn) => {
                const isGroupTarget = asgn.assigned_to_type === 'groups';

                return (
                  <div
                    key={asgn.id}
                    className="classic-card rounded-2xl sm:rounded-xl p-4 sm:p-6 bg-white border border-slate-200 shadow-md space-y-4 flex flex-col justify-between hover:border-emerald-300 transition-all min-w-0"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {asgn.course_name || 'General Coursework'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                isGroupTarget
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {isGroupTarget ? 'Target: Specific Groups' : 'Target: All Students'}
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

                        <span className="badge bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-semibold shrink-0">
                          {asgn.submissionCount || 0} Submitted
                        </span>
                      </div>

                      {asgn.description && (
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {asgn.description}
                        </p>
                      )}

                      {/* OneDrive Material Link */}
                      {asgn.onedrive_link && (
                        <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              ☁
                            </div>
                            <span className="text-xs font-bold text-indigo-950 truncate">
                              OneDrive materials
                            </span>
                          </div>
                          <a
                            href={asgn.onedrive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 shrink-0 min-h-10"
                          >
                            Open <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Attached Question Paper PDF */}
                      {asgn.question_paper_url && (
                        <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-bold text-emerald-950 truncate">
                              {asgn.question_paper_name || 'Question Paper (PDF)'}
                            </span>
                          </div>
                          <a
                            href={asgn.question_paper_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={asgn.question_paper_name || 'question_paper.pdf'}
                            className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 shrink-0 min-h-10 shadow-sm"
                          >
                            View PDF <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col xs:flex-row sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 font-semibold">
                        Created {new Date(asgn.created_at).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(asgn)}
                          className="flex-1 sm:flex-none justify-center p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all text-xs font-bold flex items-center gap-1 min-h-10"
                          title="Edit Assignment"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(asgn.id)}
                          className="flex-1 sm:flex-none justify-center p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all text-xs font-bold flex items-center gap-1 min-h-10"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ANALYTICS & GROUP PERFORMANCE */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {loadingAnalytics ? (
            <div className="text-center py-12 classic-card rounded-xl bg-white space-y-2">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Calculating submission analytics...</p>
            </div>
          ) : analytics ? (
            <>
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="classic-card p-5 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                    Total Students
                  </span>
                  <span className="text-2xl font-semibold text-slate-900 block">
                    {analytics.summary?.totalStudents || 0}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Registered</span>
                </div>

                <div className="classic-card p-5 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                    Active Study Groups
                  </span>
                  <span className="text-2xl font-semibold text-indigo-700 block">
                    {analytics.summary?.totalGroups || 0}
                  </span>
                  <span className="text-[11px] text-indigo-600 font-medium">Collaborating</span>
                </div>

                <div className="classic-card p-5 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                    Total Coursework
                  </span>
                  <span className="text-2xl font-semibold text-emerald-700 block">
                    {analytics.summary?.totalAssignments || 0}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium">Published</span>
                </div>

                <div className="classic-card p-5 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                    Completion Rate
                  </span>
                  <span className="text-2xl font-semibold text-purple-700 block">
                    {analytics.summary?.overallCompletionRate || 0}%
                  </span>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{ width: `${analytics.summary?.overallCompletionRate || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Courses Taught Grid Section with Submission Statuses & Student Count */}
              <div className="classic-card p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 min-w-0">
                    <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate">Courses Taught & Submission Analytics</span>
                  </h3>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 shrink-0">
                    {analytics.coursesTaught?.length || 0} Active Courses
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.coursesTaught && analytics.coursesTaught.length > 0 ? (
                    analytics.coursesTaught.map((c) => (
                      <div key={c.courseName} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 shadow-sm hover:border-indigo-300 transition-all text-left">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-base font-bold text-slate-900 truncate">{c.courseName}</h4>
                            <span className="text-xs font-semibold text-slate-500">
                              {c.studentCount} Students Enrolled
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 shrink-0">
                            {c.assignmentCount} {c.assignmentCount === 1 ? 'Task' : 'Tasks'}
                          </span>
                        </div>

                        {/* Submission status breakdown pill grid */}
                        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/80">
                            <span className="block font-extrabold text-emerald-800 text-sm">{c.submittedCount}</span>
                            <span className="text-[10px] font-bold text-emerald-700">Submitted</span>
                          </div>
                          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/80">
                            <span className="block font-extrabold text-amber-800 text-sm">{c.pendingCount}</span>
                            <span className="text-[10px] font-bold text-amber-700">Pending</span>
                          </div>
                          <div className="p-2 rounded-xl bg-purple-50 border border-purple-200/80">
                            <span className="block font-extrabold text-purple-800 text-sm">{c.gradedCount}</span>
                            <span className="text-[10px] font-bold text-purple-700">Graded</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-500">Course Completion Rate</span>
                            <span className="text-indigo-600">{c.completionRate}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all"
                              style={{ width: `${c.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400 col-span-3">
                      No active courses published yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Faculty Projects & Assignment Group Performance Breakdown */}
              <div className="classic-card p-4 sm:p-6 bg-white rounded-xl border border-slate-200 shadow-md space-y-4">
                <div className="flex items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">Faculty Projects & Assignment Group Performance</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold shrink-0">
                    {analytics.assignmentPerformance?.length || 0} Projects
                  </span>
                </div>

                <div className="space-y-4">
                  {analytics.assignmentPerformance && analytics.assignmentPerformance.length > 0 ? (
                    analytics.assignmentPerformance.map((asgn) => (
                      <div
                        key={asgn.id}
                        className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="text-base font-extrabold text-slate-900">{asgn.title}</h4>
                            <span className="text-[11px] font-semibold text-slate-500">
                              Assigned to: {asgn.assignedToType === 'groups' ? 'Selected Study Groups' : 'All Students'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                              {asgn.overallProjectRate}% Completed
                            </span>
                          </div>
                        </div>

                        {/* Overall Progress Bar */}
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all"
                            style={{ width: `${Math.min(asgn.overallProjectRate, 100)}%` }}
                          />
                        </div>

                        {/* Group performance breakdown per assignment */}
                        {asgn.groupBreakdown && asgn.groupBreakdown.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/60 space-y-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                              Group Submission Progress
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {asgn.groupBreakdown.map((gb) => (
                                <div
                                  key={gb.groupId}
                                  className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5"
                                >
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-extrabold text-slate-800 truncate">{gb.groupName}</span>
                                    <span className="font-bold text-indigo-600">{gb.completionRate}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-600 rounded-full"
                                      style={{ width: `${gb.completionRate}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                    <span>Submissions: {gb.submissionCount}</span>
                                    <span>Members: {gb.memberCount}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No coursework projects published yet. Create an assignment to view group performance analytics.
                    </div>
                  )}
                </div>
              </div>

              {/* Overall Group Performance Summary */}
              <div className="classic-card p-4 sm:p-6 bg-white rounded-xl border border-slate-200 shadow-md space-y-4">
                <div className="flex items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 min-w-0">
                    <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate">Overall Group Performance</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold shrink-0">
                    {analytics.groupPerformance?.length || 0} Groups
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.groupPerformance && analytics.groupPerformance.length > 0 ? (
                    analytics.groupPerformance.map((group) => (
                      <div
                        key={group.id}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-900">{group.name}</h4>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                            {group.completionRate}% Done
                          </span>
                        </div>

                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all"
                            style={{ width: `${Math.min(group.completionRate, 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-1">
                          <span>Members: {group.memberCount}</span>
                          <span>Submissions: {group.submissionCount}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400 col-span-2">
                      No study group metrics logged yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Student Submissions Table */}
              <div className="classic-card p-6 bg-white rounded-xl border border-slate-200 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Student Submission Confirmations
                  </h3>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {analytics.recentSubmissions && analytics.recentSubmissions.length > 0 ? (
                    analytics.recentSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              Student Name: {sub.student_name || 'Unnamed Student'}
                            </span>
                            {sub.student_email && sub.student_email !== sub.student_name && (
                              <span className="text-xs text-slate-500 font-medium">
                                ({sub.student_email})
                              </span>
                            )}
                            {sub.roll_number && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Roll / ID #{sub.roll_number}
                              </span>
                            )}
                            {sub.group_name && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                                Group: {sub.group_name}
                              </span>
                            )}
                          </div>

                          {sub.assignment_title && (
                            <p className="text-xs font-semibold text-slate-700">
                              Assignment: "{sub.assignment_title}"
                            </p>
                          )}

                          {sub.submitted_at && (
                            <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Submitted on: {new Date(sub.submitted_at).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}

                          {sub.submission_notes && (
                            <p className="text-[11px] text-slate-500 italic">
                              Notes: {sub.submission_notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0 flex-wrap">
                          {sub.submission_link && (
                            <a
                              href={sub.submission_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              Submission Link <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setGradingSub(sub);
                              setGradeValue(sub.grade || '');
                              setFeedbackValue(sub.feedback || '');
                              setGradeError(null);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                          >
                            <Award className="w-3.5 h-3.5 text-purple-600" />
                            {sub.grade ? `Grade: ${sub.grade}` : 'Grade / Feedback'}
                          </button>
                          <span className="badge bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                            Confirmed
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No student submission confirmations recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* TAB 3: STUDENT DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="classic-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="classic-input pl-10 text-xs py-2.5"
                placeholder="Search student name, email, roll #..."
              />
            </div>

            <div className="text-xs text-slate-600 font-bold">
              Total Registered Students: <span className="text-emerald-700 font-semibold text-sm">{filteredStudents.length}</span>
            </div>
          </div>

          {loadingDirectory ? (
            <div className="text-center py-12 classic-card rounded-xl bg-white">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Loading student records...</p>
            </div>
          ) : directoryError ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center">
              {directoryError}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 classic-card rounded-xl bg-white">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-700">No Student Records Found</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="classic-card rounded-2xl p-5 flex flex-col justify-between bg-white border border-slate-200 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                        {student.name ? student.name.charAt(0).toUpperCase() : student.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {student.name || 'Unnamed Student'}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate">
                          {student.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                      <span className="flex items-center gap-1 text-[11px] font-semibold">
                        <Hash className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Roll / ID: <strong className="text-emerald-700">#{student.rollNumber || 'N/A'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 pt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-medium">{student.phone || 'Phone Not Provided'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Assignment Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="modal-sheet bg-white border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-5 text-left"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 min-w-0">
                <BookOpen className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{editingAsgn ? 'Edit assignment' : 'New assignment'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Course / Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Physics 101, Data Structures, Linear Algebra"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assignment Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Calculus Midterm Lab Project"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description & Instructions
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide instructions or homework guidelines..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Due Date & Time
                  </label>
                  <DateTimeField
                    value={dueDate}
                    onChange={setDueDate}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    OneDrive Resource Link
                  </label>
                  <input
                    type="url"
                    value={onedriveLink}
                    onChange={(e) => setOnedriveLink(e.target.value)}
                    placeholder="https://1drv.ms/f/s!..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Upload Question Paper PDF */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  Question Paper (PDF)
                </label>
                {questionPaperUrl ? (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-emerald-900 truncate">
                        {questionPaperName || 'Question Paper.pdf'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={questionPaperUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline"
                      >
                        Preview PDF
                      </a>
                      <button
                        type="button"
                        onClick={handleRemovePdf}
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors text-xs font-bold"
                        title="Remove PDF"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100/80 hover:border-emerald-400 transition-all">
                      <div className="flex flex-col items-center justify-center py-2">
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <p className="text-xs font-bold text-slate-700">
                          {pdfUploading ? 'Reading PDF...' : 'Click to Upload Question Paper (PDF)'}
                        </p>
                        <p className="text-[10px] text-slate-400">PDF documents up to 15MB</p>
                      </div>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handlePdfFileSelect}
                        disabled={pdfUploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Assign Work Target Radio */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  Assign Work To:
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer min-h-10">
                    <input
                      type="radio"
                      name="assignedToType"
                      value="all"
                      checked={assignedToType === 'all'}
                      onChange={() => setAssignedToType('all')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    All Enrolled Students
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer min-h-10">
                    <input
                      type="radio"
                      name="assignedToType"
                      value="groups"
                      checked={assignedToType === 'groups'}
                      onChange={() => setAssignedToType('groups')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    Specific Study Groups
                  </label>
                </div>

                {/* Specific Group Checkboxes */}
                {assignedToType === 'groups' && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 mt-2">
                    <span className="text-[11px] font-bold text-slate-600 block">
                      Select Target Study Groups:
                    </span>
                    {availableGroups.length > 0 ? (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {availableGroups.map((g) => {
                          const isChecked = selectedGroupIds.includes(g.id);
                          return (
                            <label
                              key={g.id}
                              className="flex items-center gap-2 text-xs text-slate-800 font-medium cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedGroupIds([...selectedGroupIds, g.id]);
                                  } else {
                                    setSelectedGroupIds(selectedGroupIds.filter((id) => id !== g.id));
                                  }
                                }}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>{g.name} ({g.memberCount} Members)</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No study groups found</p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 action-stack border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 min-h-11"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAsgn || !title.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 min-h-11"
                >
                  <Send className="w-3.5 h-3.5" />
                  {savingAsgn ? 'Publishing...' : editingAsgn ? 'Update Assignment' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade & Feedback Modal */}
      {gradingSub && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setGradingSub(null);
          }}
        >
          <div
            className="modal-sheet bg-white border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-5 text-left"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 min-w-0">
                <Award className="w-5 h-5 text-purple-600 shrink-0" />
                <span>Grade Submission for {gradingSub.student_name}</span>
              </h3>
              <button
                onClick={() => setGradingSub(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {gradeError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {gradeError}
              </div>
            )}

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Grade / Score (e.g., A+, 95/100, Passed)
                </label>
                <input
                  type="text"
                  required
                  value={gradeValue}
                  onChange={(e) => setGradeValue(e.target.value)}
                  placeholder="e.g. A+ or 92/100"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teacher Feedback & Comments
                </label>
                <textarea
                  rows={4}
                  value={feedbackValue}
                  onChange={(e) => setFeedbackValue(e.target.value)}
                  placeholder="Great work on the lab calculations! Matrix representation was clear."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                />
              </div>

              <div className="pt-3 action-stack border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGradingSub(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 min-h-11"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={gradingLoading || !gradeValue.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 min-h-11"
                >
                  <Award className="w-3.5 h-3.5" />
                  {gradingLoading ? 'Saving Grade...' : 'Save Grade & Notify Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
