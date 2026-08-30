import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  AlertTriangle,
  Upload,
  UserCheck,
  UserX,
  Award,
  GraduationCap,
  FolderPlus,
  Plus,
  ArrowLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { DateTimeField } from './AnchoredPopover';
import { useToast } from './Toast';
import { LoadingSpinner, ButtonSpinner, SkeletonList, SkeletonCourses } from './LoadingSpinner';

export default function AdminDashboard({ token, navHomeTrigger }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('assignments');

  // React to top Navbar Joineazy click -> navigate back to assignments home
  useEffect(() => {
    if (navHomeTrigger) {
      setActiveTab('assignments');
      setIsModalOpen(false);
      setIsCourseModalOpen(false);
      setGradingSub(null);
    }
  }, [navHomeTrigger]);

  // Directory state
  const [students, setStudents] = useState([]);
  const [loadingDirectory, setLoadingDirectory] = useState(true);
  const [directoryError, setDirectoryError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Assignments state
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [asgnError, setAsgnError] = useState(null);

  // Courses state
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseError, setCourseError] = useState(null);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');

  // Course Modal State (Create / Edit)
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseAnchorRect, setCourseAnchorRect] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseFormName, setCourseFormName] = useState('');
  const [courseFormCode, setCourseFormCode] = useState('');
  const [courseFormDesc, setCourseFormDesc] = useState('');
  const [savingCourse, setSavingCourse] = useState(false);
  const [courseModalError, setCourseModalError] = useState(null);

  // Groups list (for assigning work to specific groups)
  const [availableGroups, setAvailableGroups] = useState([]);

  // Assignment Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [asgnAnchorRect, setAsgnAnchorRect] = useState(null);
  const [editingAsgn, setEditingAsgn] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseName, setCourseName] = useState('Physics 101');
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [customCourseCode, setCustomCourseCode] = useState('');
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
  const [selectedAnalyticsAsgnId, setSelectedAnalyticsAsgnId] = useState(null);
  const [analyticsSubTab, setAnalyticsSubTab] = useState('submitted');
  const [studentAnalyticsSearch, setStudentAnalyticsSearch] = useState('');
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');

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

  const fetchCourses = async () => {
    setLoadingCourses(true);
    setCourseError(null);
    try {
      const res = await fetch('/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.courses) {
        setCourses(data.courses);
      } else {
        setCourseError(data.message || 'Failed to load courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourseError('Network error fetching courses');
    } finally {
      setLoadingCourses(false);
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
        if (data.assignmentPerformance && data.assignmentPerformance.length > 0) {
          setSelectedAnalyticsAsgnId((prev) => {
            if (prev && data.assignmentPerformance.some((a) => String(a.id) === String(prev))) {
              return prev;
            }
            return data.assignmentPerformance[0].id;
          });
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
    fetchCourses();
    fetchAnalyticsAndGroups();
    fetchStudents();
  }, [token]);

  // Bulletproof Scroll Lock when any modal/popup is open
  useEffect(() => {
    const isAnyModalOpen = isModalOpen || isCourseModalOpen || Boolean(gradingSub);
    if (isAnyModalOpen) {
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
  }, [isModalOpen, isCourseModalOpen, gradingSub]);

  // Compute dynamic anchored position for popups near trigger button
  const getAnchoredStyle = (rect, targetWidth = 540) => {
    if (typeof window === 'undefined') return {};
    const width = Math.min(targetWidth, window.innerWidth - 24);
    const maxModalHeight = Math.min(window.innerHeight - 36, 680);
    
    if (!rect) {
      return {
        top: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${width}px`,
        maxHeight: `${maxModalHeight}px`,
        position: 'fixed'
      };
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < 400 && spaceAbove > spaceBelow;
    
    // Anchor aligned horizontally near button, clamped within viewport bounds
    let left = rect.left;
    if (left + width > window.innerWidth - 16) {
      left = Math.max(12, window.innerWidth - width - 16);
    }
    if (left < 12) left = 12;

    if (openUp) {
      return {
        left: `${left}px`,
        bottom: `${Math.max(12, window.innerHeight - rect.top + 8)}px`,
        maxHeight: `${Math.min(maxModalHeight, rect.top - 16)}px`,
        width: `${width}px`,
        position: 'fixed'
      };
    }

    return {
      left: `${left}px`,
      top: `${Math.min(window.innerHeight - maxModalHeight - 16, Math.max(12, rect.bottom + 8))}px`,
      maxHeight: `${maxModalHeight}px`,
      width: `${width}px`,
      position: 'fixed'
    };
  };

  // Course Modal Handlers
  const handleOpenCreateCourseModal = (event) => {
    if (event?.currentTarget) {
      setCourseAnchorRect(event.currentTarget.getBoundingClientRect());
    } else {
      setCourseAnchorRect(null);
    }
    setEditingCourse(null);
    setCourseFormName('');
    setCourseFormCode('');
    setCourseFormDesc('');
    setCourseModalError(null);
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourseModal = (course, event) => {
    if (event?.currentTarget) {
      setCourseAnchorRect(event.currentTarget.getBoundingClientRect());
    } else {
      setCourseAnchorRect(null);
    }
    setEditingCourse(course);
    setCourseFormName(course.course_name || '');
    setCourseFormCode(course.course_code || '');
    setCourseFormDesc(course.description || '');
    setCourseModalError(null);
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!courseFormName.trim()) {
      setCourseModalError('Please enter a valid course name');
      return;
    }

    setSavingCourse(true);
    setCourseModalError(null);
    try {
      const url = editingCourse ? `/api/courses/${editingCourse.id}` : '/api/courses';
      const method = editingCourse ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseName: courseFormName.trim(),
          courseCode: courseFormCode.trim() || undefined,
          description: courseFormDesc.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save course');
      }

      setIsCourseModalOpen(false);
      await fetchCourses();
      await fetchAnalyticsAndGroups();
      toast.success(editingCourse ? 'Course details updated!' : `Course "${courseFormName.trim()}" created successfully!`);
    } catch (err) {
      console.error('Save course error:', err);
      setCourseModalError(err.message || 'Error occurred while saving course');
      toast.error(err.message || 'Failed to save course');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchCourses();
        await fetchAnalyticsAndGroups();
        toast.success('Course removed successfully');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to delete course');
      }
    } catch (err) {
      console.error('Delete course error:', err);
      toast.error('Network error deleting course');
    }
  };

  // Open modal for new assignment
  const handleOpenCreateModal = (prefillCourseName, event) => {
    if (event?.currentTarget) {
      setAsgnAnchorRect(event.currentTarget.getBoundingClientRect());
    } else {
      setAsgnAnchorRect(null);
    }
    setEditingAsgn(null);
    setTitle('');
    setDescription('');
    const defaultCourse = typeof prefillCourseName === 'string' && prefillCourseName
      ? prefillCourseName
      : (courses[0]?.course_name || 'Physics 101');
    setCourseName(defaultCourse);
    setIsCustomCourse(false);
    setCustomCourseCode('');
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
  const handleOpenEditModal = (asgn, event) => {
    if (event?.currentTarget) {
      setAsgnAnchorRect(event.currentTarget.getBoundingClientRect());
    } else {
      setAsgnAnchorRect(null);
    }
    setEditingAsgn(asgn);
    setTitle(asgn.title || '');
    setDescription(asgn.description || '');
    const cName = asgn.course_name || 'General Coursework';
    setCourseName(cName);
    const exists = courses.some((c) => c.course_name === cName);
    setIsCustomCourse(!exists);
    setCustomCourseCode('');
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
      toast.error('Invalid file format. Please choose a .pdf document.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setModalError('PDF file size must be less than 15MB');
      toast.error('File too large. Maximum PDF size is 15MB.');
      return;
    }

    setPdfUploading(true);
    setModalError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setQuestionPaperUrl(event.target.result);
      setQuestionPaperName(file.name);
      setPdfUploading(false);
      toast.success(`Attached "${file.name}"`);
    };
    reader.onerror = () => {
      setModalError('Failed to read PDF file');
      setPdfUploading(false);
      toast.error('Failed to read PDF file');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePdf = () => {
    setQuestionPaperUrl('');
    setQuestionPaperName('');
    toast.info('Attached PDF document removed');
  };

  const handlePdfUpload = handlePdfFileSelect;

  // Save assignment (Create / Update)
  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setModalError('Assignment title is required');
      toast.warning('Please enter an assignment title');
      return;
    }

    if (dueDate && new Date(dueDate).getTime() < Date.now() - 60000) {
      setModalError('Assignment due date cannot be set in the past');
      toast.error('Assignment due date cannot be set in the past');
      return;
    }

    const resolvedCourse = courseName.trim() || 'General Coursework';

    setSavingAsgn(true);
    setModalError(null);
    try {
      // Auto-register course if custom and doesn't exist yet
      if (isCustomCourse && resolvedCourse && !courses.some(c => c.course_name.toLowerCase() === resolvedCourse.toLowerCase())) {
        try {
          await fetch('/api/courses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              courseName: resolvedCourse,
              courseCode: customCourseCode.trim() || undefined,
              description: `Curriculum for ${resolvedCourse}`
            })
          });
        } catch (cErr) {
          console.warn('Auto-course creation note:', cErr.message);
        }
      }

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
          courseName: resolvedCourse,
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
      await fetchCourses();
      await fetchAnalyticsAndGroups();
      toast.success(editingAsgn ? `Assignment "${title.trim()}" updated!` : `Assignment "${title.trim()}" published successfully!`);
    } catch (err) {
      setModalError(err.message || 'Network error saving assignment');
      toast.error(err.message || 'Failed to save assignment');
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
        toast.success('Assignment deleted successfully');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to delete assignment');
      }
    } catch (err) {
      console.error('Error deleting assignment:', err);
      toast.error('Network error deleting assignment');
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

      const studentName = gradingSub.student_name || 'Student';
      setGradingSub(null);
      await fetchAnalyticsAndGroups();
      await fetchAssignments();
      toast.success(`Grade "${gradeValue.trim()}" saved for ${studentName}!`);
    } catch (err) {
      setGradeError(err.message);
      toast.error(err.message || 'Failed to save grade');
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

  const filteredCourses = courses.filter((c) => {
    const term = courseSearchTerm.toLowerCase();
    return (
      (c.course_name && c.course_name.toLowerCase().includes(term)) ||
      (c.course_code && c.course_code.toLowerCase().includes(term)) ||
      (c.description && c.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="w-full space-y-5 animate-fade-up text-left">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 text-white p-6 sm:p-8 shadow-xl shadow-slate-900/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-300">Faculty workspace</p>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mt-1">
              {activeTab === 'assignments' && 'Assignments & coursework'}
              {activeTab === 'courses' && 'Courses & curriculum'}
              {activeTab === 'analytics' && 'Analytics & performance'}
              {activeTab === 'directory' && 'Student directory'}
            </h1>
            <p className="text-sm text-indigo-100/80 mt-1.5 max-w-xl">
              {activeTab === 'assignments' && 'Post work, assign it to the class or a group, and track confirmations.'}
              {activeTab === 'courses' && 'Create subjects and keep syllabus items organized.'}
              {activeTab === 'analytics' && 'Review completion, trends, and grade submissions.'}
              {activeTab === 'directory' && 'Browse enrolled students and contact details.'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-2">
              <div className="hero-stat text-center">
                <p className="text-lg font-extrabold leading-none">{assignments.length}</p>
                <p className="text-[10px] uppercase tracking-wide text-indigo-200 mt-1">Tasks</p>
              </div>
              <div className="hero-stat text-center">
                <p className="text-lg font-extrabold leading-none">{courses.length}</p>
                <p className="text-[10px] uppercase tracking-wide text-indigo-200 mt-1">Courses</p>
              </div>
              <div className="hero-stat text-center">
                <p className="text-lg font-extrabold leading-none">{students.length}</p>
                <p className="text-[10px] uppercase tracking-wide text-indigo-200 mt-1">Students</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateCourseModal}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all flex items-center justify-center gap-1.5 min-h-10"
            >
              <FolderPlus className="w-4 h-4" /> Add course
            </button>
            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="btn-primary min-h-10 shadow-none"
            >
              <PlusCircle className="w-4 h-4" /> New assignment
            </button>
          </div>
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
          onClick={() => setActiveTab('courses')}
          className={`portal-tab ${activeTab === 'courses' ? 'is-active' : ''}`}
        >
          <GraduationCap className="w-4 h-4" /> Courses
          <span className="text-xs opacity-70">({courses.length})</span>
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

      {/* Back to Assignments button when viewing other tabs */}
      {activeTab !== 'assignments' && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Assignments</span>
          </button>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
            Section: <strong className="text-slate-800 capitalize">{activeTab}</strong>
          </span>
        </div>
      )}

      {/* TAB 1: ASSIGNMENTS MANAGEMENT */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {loadingAssignments ? (
            <SkeletonList rows={4} />
          ) : asgnError ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              {asgnError}
            </div>
          ) : assignments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No assignments yet</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                Assignments you post appear here. Other faculty members’ work stays in their own workspace.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {assignments.map((asgn) => {
                const isGroupTarget = asgn.assigned_to_type === 'groups';

                return (
                  <div
                    key={asgn.id}
                    className="classic-card rounded-2xl p-5 sm:p-6 bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {asgn.course_name || 'General Coursework'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${
                            isGroupTarget
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {isGroupTarget ? 'Target: Specific Groups' : 'Target: All Students'}
                        </span>
                        {asgn.due_date && (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" /> Due:{' '}
                            {new Date(asgn.due_date).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                        <span className="badge bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                          {asgn.submissionCount || 0} Submitted
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">{asgn.title}</h3>
                        {asgn.description && (
                          <p className="text-xs text-slate-600 leading-relaxed font-medium mt-1">
                            {asgn.description}
                          </p>
                        )}
                      </div>

                      {/* Material & PDF attachment links row */}
                      <div className="flex items-center gap-3 flex-wrap pt-1">
                        {asgn.onedrive_link && (
                          <a
                            href={asgn.onedrive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all shadow-sm"
                          >
                            <span>☁ OneDrive Materials</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {asgn.question_paper_url && (
                          <a
                            href={asgn.question_paper_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={asgn.question_paper_name || 'question_paper.pdf'}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-all shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{asgn.question_paper_name || 'Question Paper (PDF)'}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions & timestamp column */}
                    <div className="flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-5 shrink-0">
                      <span className="text-[11px] text-slate-400 font-semibold">
                        Posted {new Date(asgn.created_at).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(asgn)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all text-xs font-bold flex items-center gap-1.5 min-h-9"
                          title="Edit Assignment"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAssignment(asgn.id)}
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all text-xs font-bold flex items-center gap-1.5 min-h-9"
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

      {/* TAB 2: COURSES & CURRICULUM MANAGEMENT */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="classic-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={courseSearchTerm}
                onChange={(e) => setCourseSearchTerm(e.target.value)}
                className="classic-input pl-10 text-xs py-2.5"
                placeholder="Search course code, subject name..."
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs text-slate-600 font-bold">
                Total Courses: <strong className="text-indigo-700">{filteredCourses.length}</strong>
              </span>
              <button
                type="button"
                onClick={handleOpenCreateCourseModal}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5" /> + New Course
              </button>
            </div>
          </div>

          {loadingCourses ? (
            <SkeletonCourses count={3} />
          ) : courseError ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {courseError}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 classic-card rounded-xl bg-white border border-slate-200 space-y-3">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No courses found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Create your first course to organize coursework, question papers, and assignments.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateCourseModal}
                className="btn-primary inline-flex items-center gap-1.5 text-xs mt-2"
              >
                <PlusCircle className="w-4 h-4" /> Create First Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCourses.map((c) => {
                const asgnCount = assignments.filter((a) => (a.course_name || 'General Coursework') === c.course_name).length;
                return (
                  <div
                    key={c.id || c.course_code || c.course_name}
                    className="classic-card rounded-2xl p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-indigo-100">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block">
                              {c.course_code || 'COURSE'}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-1 truncate">
                              {c.course_name}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCourseModal(c)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            title="Edit Course"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(c.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                            title="Delete Course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {c.description ? (
                        <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-2">
                          {c.description}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No description added yet.</p>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="font-semibold text-slate-700">Coursework Tasks:</span>
                        <span className="badge badge-student text-xs font-bold">{asgnCount} {asgnCount === 1 ? 'Assignment' : 'Assignments'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenCreateModal(c.course_name);
                          setActiveTab('assignments');
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Post Assignment in this Course
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ANALYTICS & GROUP PERFORMANCE */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {loadingAnalytics ? (
            <LoadingSpinner
              size="lg"
              text="Calculating submission & group analytics..."
              subtext="Aggregating performance metrics, grades, and deadlines"
            />
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

              {/* Interactive Assignment / Project Analytics Explorer */}
              {(() => {
                const asgns = analytics.assignmentPerformance || [];
                const filteredAsgns = asgns.filter((a) =>
                  !assignmentSearchTerm.trim() ||
                  a.title?.toLowerCase().includes(assignmentSearchTerm.toLowerCase()) ||
                  a.courseName?.toLowerCase().includes(assignmentSearchTerm.toLowerCase())
                );

                const currentSelectedId = selectedAnalyticsAsgnId || (asgns[0] ? asgns[0].id : null);
                const selectedAsgn = asgns.find((a) => String(a.id) === String(currentSelectedId)) || asgns[0] || null;

                const submittedList = selectedAsgn?.submittedStudents || [];
                const notSubmittedList = selectedAsgn?.notSubmittedStudents || [];
                const groupBreakdown = selectedAsgn?.groupBreakdown || [];

                const filteredSubmitted = submittedList.filter((s) =>
                  !studentAnalyticsSearch.trim() ||
                  s.studentName?.toLowerCase().includes(studentAnalyticsSearch.toLowerCase()) ||
                  s.studentEmail?.toLowerCase().includes(studentAnalyticsSearch.toLowerCase()) ||
                  s.rollNumber?.toLowerCase().includes(studentAnalyticsSearch.toLowerCase()) ||
                  s.groupName?.toLowerCase().includes(studentAnalyticsSearch.toLowerCase())
                );

                const filteredNotSubmitted = notSubmittedList.filter((s) =>
                  !studentAnalyticsSearch.trim() ||
                  s.studentName?.toLowerCase().includes(studentAnalyticsSearch.toLowerCase()) ||
                  s.studentEmail?.toLowerCase().includes(studentAnalyticsSearch.toLowerCase()) ||
                  s.rollNumber?.toLowerCase().includes(studentAnalyticsSearch.toLowerCase()) ||
                  s.groupName?.toLowerCase().includes(studentAnalyticsSearch.toLowerCase())
                );

                return (
                  <div className="space-y-6">
                    {/* ASSIGNMENT DROPDOWN LIST SELECTOR */}
                    <div className="classic-card p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-md space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div>
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                            <span>Project & Assignment Analytics</span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Select an assignment from the dropdown list to inspect total analytics, submitted students, pending students, and group progress.
                          </p>
                        </div>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 self-start sm:self-auto">
                          {asgns.length} Total Projects
                        </span>
                      </div>

                      {asgns.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                          No assignments posted yet. Create an assignment to view analytics.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Select Assignment / Coursework Project:
                          </label>

                          <div className="relative">
                            <select
                              value={selectedAsgn ? String(selectedAsgn.id) : ''}
                              onChange={(e) => {
                                setSelectedAnalyticsAsgnId(e.target.value);
                                setStudentAnalyticsSearch('');
                              }}
                              className="w-full bg-slate-50 border-2 border-indigo-100 hover:border-indigo-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl px-4 py-3.5 text-xs sm:text-sm font-bold text-slate-800 transition-all cursor-pointer appearance-none shadow-sm pr-10"
                            >
                              {asgns.map((a) => (
                                <option key={a.id} value={String(a.id)}>
                                  {a.courseName ? `[${a.courseName}] ` : ''}{a.title} — ({a.totalSubmitted} / {a.totalTargetStudents} Submitted · {a.overallProjectRate}% Done)
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-600">
                              <ChevronDown className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* DETAILED ANALYTICS FOR SELECTED PROJECT */}
                    {selectedAsgn && (
                      <div className="classic-card p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-md space-y-6 animate-fade-up">
                        {/* Selected Assignment Header & Resources */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {selectedAsgn.courseName}
                              </span>
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                {selectedAsgn.assignedToType === 'groups' ? 'Assigned to Specific Groups' : 'Assigned to All Students'}
                              </span>
                              {selectedAsgn.dueDate && (
                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-500" /> Due:{' '}
                                  {new Date(selectedAsgn.dueDate).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                              {selectedAsgn.title}
                            </h3>
                            {selectedAsgn.description && (
                              <p className="text-xs text-slate-600 max-w-2xl">{selectedAsgn.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                            {selectedAsgn.onedriveLink && (
                              <a
                                href={selectedAsgn.onedriveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all shadow-sm"
                              >
                                <span>☁ OneDrive Material</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {selectedAsgn.questionPaperUrl && (
                              <a
                                href={selectedAsgn.questionPaperUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={selectedAsgn.questionPaperName || 'question_paper.pdf'}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-all shadow-sm"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{selectedAsgn.questionPaperName || 'Question Paper'}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* 3 Metric Cards for this Assignment */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
                              Target Students
                            </span>
                            <span className="text-2xl font-bold text-slate-900 block">
                              {selectedAsgn.totalTargetStudents || 0}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">Expected Submissions</span>
                          </div>

                          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                            <span className="text-[10px] text-emerald-700 uppercase tracking-wider font-bold block">
                              Submitted Students
                            </span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-emerald-950">
                                {selectedAsgn.totalSubmitted || 0}
                              </span>
                              <span className="text-xs font-extrabold text-emerald-700">
                                ({selectedAsgn.overallProjectRate}%)
                              </span>
                            </div>
                            <span className="text-xs text-emerald-800 font-medium">Completed & Confirmed</span>
                          </div>

                          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                            <span className="text-[10px] text-rose-700 uppercase tracking-wider font-bold block">
                              Pending / Not Submitted
                            </span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-rose-950">
                                {selectedAsgn.totalNotSubmitted || 0}
                              </span>
                              <span className="text-xs font-extrabold text-rose-700">
                                ({100 - (selectedAsgn.overallProjectRate || 0)}%)
                              </span>
                            </div>
                            <span className="text-xs text-rose-800 font-medium">Awaiting Submission</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span>Total Project Completion</span>
                            <span className="text-indigo-600">{selectedAsgn.overallProjectRate}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all"
                              style={{ width: `${selectedAsgn.overallProjectRate}%` }}
                            />
                          </div>
                        </div>

                        {/* SUB-TABS: Submitted vs Not Submitted vs Group Progress */}
                        <div className="border-t border-slate-100 pt-5 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                              <button
                                type="button"
                                onClick={() => setAnalyticsSubTab('submitted')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                                  analyticsSubTab === 'submitted'
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                <UserCheck className="w-4 h-4" />
                                <span>Submitted Students</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  analyticsSubTab === 'submitted' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-800'
                                }`}>
                                  {submittedList.length}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setAnalyticsSubTab('not_submitted')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                                  analyticsSubTab === 'not_submitted'
                                    ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                <UserX className="w-4 h-4" />
                                <span>Not Submitted / Pending</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  analyticsSubTab === 'not_submitted' ? 'bg-rose-700 text-white' : 'bg-slate-200 text-slate-800'
                                }`}>
                                  {notSubmittedList.length}
                                </span>
                              </button>

                              {groupBreakdown.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setAnalyticsSubTab('groups')}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                                    analyticsSubTab === 'groups'
                                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  <Users className="w-4 h-4" />
                                  <span>Group Progress</span>
                                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    analyticsSubTab === 'groups' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-800'
                                  }`}>
                                    {groupBreakdown.length} Groups
                                  </span>
                                </button>
                              )}
                            </div>

                            {/* Search Filter for Student list */}
                            {analyticsSubTab !== 'groups' && (
                              <div className="relative w-full sm:w-64">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                <input
                                  type="text"
                                  value={studentAnalyticsSearch}
                                  onChange={(e) => setStudentAnalyticsSearch(e.target.value)}
                                  className="classic-input pl-9 text-xs py-2 w-full"
                                  placeholder="Filter students by name, roll..."
                                />
                              </div>
                            )}
                          </div>

                          {/* SUB-TAB 1: SUBMITTED STUDENTS LIST */}
                          {analyticsSubTab === 'submitted' && (
                            <div className="space-y-3">
                              {filteredSubmitted.length === 0 ? (
                                <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-semibold space-y-1">
                                  <CheckCircle className="w-8 h-8 text-slate-300 mx-auto" />
                                  <p>No submitted students found matching the criteria.</p>
                                </div>
                              ) : (
                                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                                  {filteredSubmitted.map((sub) => (
                                    <div
                                      key={sub.id || sub.submissionId || sub.studentId}
                                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                                    >
                                      <div className="space-y-1.5 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                                            {(sub.studentName || 'S').charAt(0).toUpperCase()}
                                          </div>
                                          <span className="font-extrabold text-sm text-slate-900">
                                            {sub.studentName}
                                          </span>
                                          {sub.studentEmail && (
                                            <span className="text-xs text-slate-500 font-medium">
                                              ({sub.studentEmail})
                                            </span>
                                          )}
                                          {sub.rollNumber && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                              Roll #{sub.rollNumber}
                                            </span>
                                          )}
                                          {sub.groupName ? (
                                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                                              <Users className="w-3 h-3 text-purple-600" />
                                              Group: {sub.groupName}
                                            </span>
                                          ) : (
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                                              Individual Submission
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                                          {sub.submittedAt && (
                                            <span className="flex items-center gap-1 font-medium">
                                              <Clock className="w-3 h-3 text-slate-400" /> Submitted on:{' '}
                                              {new Date(sub.submittedAt).toLocaleString([], {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </span>
                                          )}
                                          {sub.phone && <span>Phone: {sub.phone}</span>}
                                        </div>

                                        {sub.submissionNotes && (
                                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 italic">
                                            "{sub.submissionNotes}"
                                          </p>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                                        {sub.submissionLink && (
                                          <a
                                            href={sub.submissionLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all flex items-center gap-1"
                                          >
                                            <span>Open Submission Link</span>
                                            <ExternalLink className="w-3 h-3" />
                                          </a>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setGradingSub({
                                              ...sub,
                                              assignment_title: selectedAsgn.title,
                                              student_name: sub.studentName,
                                              student_email: sub.studentEmail
                                            });
                                            setGradeValue(sub.grade || '');
                                            setFeedbackValue(sub.feedback || '');
                                            setGradeError(null);
                                          }}
                                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all flex items-center gap-1"
                                        >
                                          <Award className="w-3.5 h-3.5 text-purple-600" />
                                          {sub.grade ? `Grade: ${sub.grade}` : '+ Grade & Feedback'}
                                        </button>

                                        <span className="badge bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                                          ✓ Submitted
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* SUB-TAB 2: NOT SUBMITTED STUDENTS LIST */}
                          {analyticsSubTab === 'not_submitted' && (() => {
                            const isAssignmentOverdue = selectedAsgn?.dueDate ? (new Date(selectedAsgn.dueDate).getTime() < Date.now()) : false;

                            return (
                              <div className="space-y-4">
                                {isAssignmentOverdue && filteredNotSubmitted.length > 0 && (
                                  <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-fade-up">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-rose-200">
                                        <AlertTriangle className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-extrabold text-rose-950">Assignment Deadline Expired</h4>
                                        <p className="text-xs font-semibold text-rose-700 mt-0.5">
                                          Deadline was {new Date(selectedAsgn.dueDate).toLocaleString([], {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}. All {filteredNotSubmitted.length} students listed below have not submitted after the deadline.
                                        </p>
                                      </div>
                                    </div>
                                    <span className="badge bg-rose-600 text-white border-0 text-xs font-extrabold px-3.5 py-1.5 rounded-xl self-start sm:self-auto shadow-sm">
                                      {filteredNotSubmitted.length} Overdue Students
                                    </span>
                                  </div>
                                )}

                                {filteredNotSubmitted.length === 0 ? (
                                  <div className="p-8 text-center rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold space-y-1">
                                    <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                                    <p>🎉 All target students have submitted this assignment!</p>
                                  </div>
                                ) : (
                                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                                    {filteredNotSubmitted.map((st) => {
                                      const isStudentOverdue = st.isOverdue || isAssignmentOverdue;
                                      return (
                                        <div
                                          key={st.studentId}
                                          className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                                            isStudentOverdue ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'hover:bg-slate-50'
                                          }`}
                                        >
                                          <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                                isStudentOverdue ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                                              }`}>
                                                {(st.studentName || 'S').charAt(0).toUpperCase()}
                                              </div>
                                              <span className="font-extrabold text-sm text-slate-900">
                                                {st.studentName}
                                              </span>
                                              {st.studentEmail && (
                                                <span className="text-xs text-slate-500 font-medium">
                                                  ({st.studentEmail})
                                                </span>
                                              )}
                                              {st.rollNumber && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                                  Roll #{st.rollNumber}
                                                </span>
                                              )}
                                              {st.groupName ? (
                                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                                                  <Users className="w-3 h-3 text-purple-600" />
                                                  Group: {st.groupName}
                                                </span>
                                              ) : (
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                                                  Individual Assignment
                                                </span>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                              {st.phone && <span>Phone: {st.phone}</span>}
                                              {st.school && <span>· School: {st.school}</span>}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                                            {isStudentOverdue ? (
                                              <span className="badge bg-rose-100 text-rose-900 border border-rose-300 text-xs font-extrabold px-3 py-1 flex items-center gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                                Overdue (Missed Deadline)
                                              </span>
                                            ) : (
                                              <span className="badge bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-3 py-1 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                                Pending Submission
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* SUB-TAB 3: GROUP PROGRESS BREAKDOWN */}
                          {analyticsSubTab === 'groups' && (() => {
                            const isAssignmentOverdue = selectedAsgn?.dueDate ? (new Date(selectedAsgn.dueDate).getTime() < Date.now()) : false;

                            return (
                              <div className="space-y-4">
                                {groupBreakdown.length === 0 ? (
                                  <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                                    This assignment was not targeted to specific study groups.
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-5">
                                    {groupBreakdown.map((gb) => {
                                      const members = gb.members || [];
                                      const submittedMembers = members.filter((m) => m.submitted);
                                      const pendingMembers = members.filter((m) => !m.submitted);

                                      return (
                                        <div
                                          key={gb.groupId}
                                          className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 shadow-sm"
                                        >
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                                  <Users className="w-5 h-5 text-indigo-600" />
                                                  {gb.groupName}
                                                </h4>
                                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                                                  {gb.memberCount} {gb.memberCount === 1 ? 'Student' : 'Students'}
                                                </span>
                                              </div>
                                              <p className="text-xs text-slate-500">
                                                {gb.submissionCount} submitted · {pendingMembers.length} pending
                                              </p>
                                            </div>

                                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                              <span className="badge bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-extrabold px-3 py-1">
                                                {gb.completionRate}% Completed
                                              </span>
                                            </div>
                                          </div>

                                          {/* Group Progress Bar */}
                                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all"
                                              style={{ width: `${gb.completionRate}%` }}
                                            />
                                          </div>

                                          <div className="space-y-4 pt-1">
                                            {/* 1. SUBMITTED STUDENTS IN THIS GROUP */}
                                            <div className="space-y-2">
                                              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                Submitted Students in {gb.groupName} ({submittedMembers.length})
                                              </span>

                                              {submittedMembers.length === 0 ? (
                                                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-400 italic">
                                                  No members in this group have submitted yet.
                                                </div>
                                              ) : (
                                                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                                                  {submittedMembers.map((m) => (
                                                    <div
                                                      key={m.userId}
                                                      className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                                                    >
                                                      <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                                                          {(m.name || m.email || 'S').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0 space-y-0.5">
                                                          <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-xs sm:text-sm text-slate-900">
                                                              {m.name || m.email}
                                                            </span>
                                                            {m.role === 'creator' && (
                                                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                                                Leader / Creator
                                                              </span>
                                                            )}
                                                            {m.rollNumber && (
                                                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                                                Roll #{m.rollNumber}
                                                              </span>
                                                            )}
                                                          </div>
                                                          <p className="text-xs text-slate-500 truncate">{m.email}</p>
                                                        </div>
                                                      </div>

                                                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                                                        {m.submittedAt && (
                                                          <span className="text-[11px] text-slate-500 hidden md:inline">
                                                            {new Date(m.submittedAt).toLocaleDateString([], {
                                                              month: 'short',
                                                              day: 'numeric'
                                                            })}
                                                          </span>
                                                        )}
                                                        {m.submissionLink && (
                                                          <a
                                                            href={m.submissionLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all flex items-center gap-1"
                                                          >
                                                            <span>Link</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                          </a>
                                                        )}
                                                        <span className="badge bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1">
                                                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                          Submitted
                                                        </span>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>

                                            {/* 2. PENDING / NOT SUBMITTED STUDENTS IN THIS GROUP */}
                                            <div className="space-y-2">
                                              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-amber-600" />
                                                Pending / Not Submitted in {gb.groupName} ({pendingMembers.length})
                                              </span>

                                              {pendingMembers.length === 0 ? (
                                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
                                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                  🎉 All {members.length} members in this group have submitted!
                                                </div>
                                              ) : (
                                                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                                                  {pendingMembers.map((m) => (
                                                    <div
                                                      key={m.userId}
                                                      className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                                                    >
                                                      <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0">
                                                          {(m.name || m.email || 'S').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0 space-y-0.5">
                                                          <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-xs sm:text-sm text-slate-900">
                                                              {m.name || m.email}
                                                            </span>
                                                            {m.role === 'creator' && (
                                                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                                                Leader / Creator
                                                              </span>
                                                            )}
                                                            {m.rollNumber && (
                                                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                                                Roll #{m.rollNumber}
                                                              </span>
                                                            )}
                                                          </div>
                                                          <p className="text-xs text-slate-500 truncate">{m.email}</p>
                                                        </div>
                                                      </div>

                                                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                                                        {isAssignmentOverdue ? (
                                                          <span className="badge bg-rose-100 text-rose-900 border border-rose-300 text-xs font-extrabold flex items-center gap-1">
                                                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                                            Overdue (Missed Deadline)
                                                          </span>
                                                        ) : (
                                                          <span className="badge bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                                            Pending Submission
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
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
            <SkeletonList rows={6} />
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

      {/* Create / Edit Assignment Modal - Anchored Near Trigger Button */}
      {isModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-[3px] animate-fade-in"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsModalOpen(false);
            }}
          >
            <div
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl shadow-slate-900/25 flex flex-col overflow-hidden text-left animate-pop-in"
              style={getAnchoredStyle(asgnAnchorRect, 540)}
              onMouseDown={(event) => event.stopPropagation()}
            >
              {/* Sticky Fixed Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Go Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 min-w-0">
                    <BookOpen className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{editingAsgn ? 'Edit assignment' : 'New assignment'}</span>
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSaveAssignment} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain p-5 sm:p-6 space-y-4">
                  {modalError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                      {modalError}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Course / Subject <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomCourse(!isCustomCourse)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                      >
                        {isCustomCourse ? '← Select existing course' : '+ Enter custom course'}
                      </button>
                    </div>

                    {!isCustomCourse ? (
                      <select
                        value={courseName}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomCourse(true);
                            setCourseName('');
                          } else {
                            setCourseName(e.target.value);
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                      >
                        {courses.map((c) => (
                          <option key={c.id || c.course_name} value={c.course_name}>
                            {c.course_code ? `[${c.course_code}] ` : ''}{c.course_name}
                          </option>
                        ))}
                        {courses.length === 0 && (
                          <option value="General Coursework">General Coursework</option>
                        )}
                        <option value="__custom__">➕ Add new custom course...</option>
                      </select>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          required
                          value={courseName}
                          onChange={(e) => setCourseName(e.target.value)}
                          placeholder="e.g. Advanced Physics 201"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
                        />
                        <input
                          type="text"
                          value={customCourseCode}
                          onChange={(e) => setCustomCourseCode(e.target.value)}
                          placeholder="Course Code (Optional, e.g. PHY-201)"
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    )}
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Submission Due Date & Time
                    </label>
                    <DateTimeField
                      value={dueDate}
                      onChange={setDueDate}
                      placeholder="Pick due date and time"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets:</span>
                      {[
                        { label: '+3 Days', days: 3 },
                        { label: '+1 Week', days: 7 },
                        { label: '+2 Weeks', days: 14 },
                        { label: '+1 Month', days: 30 }
                      ].map((preset) => (
                        <button
                          type="button"
                          key={preset.label}
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + preset.days);
                            d.setHours(23, 59, 0, 0);
                            setDueDate(d.toISOString());
                          }}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 text-[10px] font-bold transition-all cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Teacher's OneDrive Folder / Resource Link
                    </label>
                    <input
                      type="url"
                      value={onedriveLink}
                      onChange={(e) => setOnedriveLink(e.target.value)}
                      placeholder="https://1drv.ms/... (OneDrive sharing link)"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Question Paper (PDF Upload)
                    </label>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <input
                        type="file"
                        accept="application/pdf"
                        id="pdf-upload-input"
                        onChange={handlePdfFileSelect}
                        disabled={pdfUploading}
                        className="hidden"
                      />
                      <label
                        htmlFor="pdf-upload-input"
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm transition-all"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        {pdfUploading ? 'Uploading PDF...' : 'Choose Question Paper PDF'}
                      </label>

                      {questionPaperName && (
                        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                          <span className="truncate font-semibold">{questionPaperName}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setQuestionPaperUrl('');
                              setQuestionPaperName('');
                            }}
                            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Target Audience: All vs Groups */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target Assignment Audience:
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
                </div>

                {/* Floating Sticky Footer */}
                <div className="p-4 sm:p-5 bg-slate-50/95 backdrop-blur-sm border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white min-h-11 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back / Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAsgn || !title.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 min-h-11 cursor-pointer"
                  >
                    {savingAsgn ? (
                      <>
                        <ButtonSpinner className="w-3.5 h-3.5" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{editingAsgn ? 'Update Assignment' : 'Publish Assignment'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Grade & Feedback Modal - Floating Top Card */}
      {gradingSub &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-[3px] flex items-start justify-center pt-6 px-4 animate-fade-in"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setGradingSub(null);
            }}
          >
            <div
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl shadow-slate-900/25 flex flex-col overflow-hidden text-left w-full max-w-lg max-h-[calc(100vh-3rem)] animate-pop-in"
              onMouseDown={(event) => event.stopPropagation()}
            >
              {/* Sticky Fixed Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setGradingSub(null)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Go Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 min-w-0">
                    <Award className="w-5 h-5 text-purple-600 shrink-0" />
                    <span>Grade Submission for {gradingSub.student_name}</span>
                  </h3>
                </div>
                <button
                  onClick={() => setGradingSub(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSaveGrade} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                  {gradeError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                      {gradeError}
                    </div>
                  )}

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
                    <div className="flex items-center gap-1.5 flex-wrap pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets:</span>
                      {['A+ (95/100)', 'A (88/100)', 'B+ (78/100)', 'Pass (100/100)'].map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => setGradeValue(preset)}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold transition-all cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Feedback & Comments for Student
                    </label>
                    <textarea
                      rows={4}
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      placeholder="Write constructive feedback on the assignment submission..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
                    />
                  </div>
                </div>

                {/* Floating Sticky Footer */}
                <div className="p-4 sm:p-5 bg-slate-50/95 backdrop-blur-sm border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setGradingSub(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white min-h-11 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back / Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={gradingLoading || !gradeValue.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 min-h-11 cursor-pointer"
                  >
                    {gradingLoading ? (
                      <>
                        <ButtonSpinner className="w-3.5 h-3.5" />
                        <span>Saving Grade...</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-3.5 h-3.5" />
                        <span>Save Grade & Notify Student</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Create / Edit Course Modal - Anchored Near Trigger Button */}
      {isCourseModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-[3px] animate-fade-in"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsCourseModalOpen(false);
            }}
          >
            <div
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl shadow-slate-900/25 flex flex-col overflow-hidden text-left animate-pop-in"
              style={getAnchoredStyle(courseAnchorRect, 480)}
              onMouseDown={(event) => event.stopPropagation()}
            >
              {/* Header with gradient icon */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setIsCourseModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Go Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0">
                    <FolderPlus className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                      {editingCourse ? 'Edit Course Details' : 'Create New Course'}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      {editingCourse ? 'Update syllabus & identifiers' : 'Add new subject to curriculum'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCourseModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Scrollable Form Body with Refined Inputs */}
              <form onSubmit={handleSaveCourse} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain p-4 sm:p-5 space-y-3.5">
                  {courseModalError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{courseModalError}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Course Title / Subject Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={courseFormName}
                      onChange={(e) => setCourseFormName(e.target.value)}
                      placeholder="e.g. Organic Chemistry II, Data Structures"
                      className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs font-semibold text-slate-900 transition-all placeholder:text-slate-400"
                    />
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quick:</span>
                      {[
                        { title: 'Computer Science', code: 'CS-101' },
                        { title: 'Data Structures', code: 'CS-201' },
                        { title: 'Organic Chemistry', code: 'CHEM-202' },
                        { title: 'Calculus III', code: 'MATH-301' },
                        { title: 'Applied Physics', code: 'PHY-101' }
                      ].map((subj) => (
                        <button
                          type="button"
                          key={subj.title}
                          onClick={() => {
                            setCourseFormName(subj.title);
                            setCourseFormCode(subj.code);
                          }}
                          className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold transition-all cursor-pointer"
                        >
                          {subj.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">
                        Course Code
                      </label>
                      <span className="text-[10px] text-slate-400">Optional</span>
                    </div>
                    <input
                      type="text"
                      value={courseFormCode}
                      onChange={(e) => setCourseFormCode(e.target.value)}
                      placeholder="e.g. PHY-101, CS-201"
                      className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs font-mono font-semibold text-slate-900 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Course Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={courseFormDesc}
                      onChange={(e) => setCourseFormDesc(e.target.value)}
                      placeholder="Syllabus highlights, prerequisites..."
                      className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs font-medium text-slate-900 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Floating Sticky Action Footer */}
                <div className="p-3.5 bg-slate-50/95 backdrop-blur-sm border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCourseModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCourse || !courseFormName.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {savingCourse ? (
                      <>
                        <ButtonSpinner className="w-3.5 h-3.5" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>{editingCourse ? 'Update Course' : 'Create Course'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
