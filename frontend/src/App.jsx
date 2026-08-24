import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthTabs from './components/AuthTabs';
import GoogleModal from './components/GoogleModal';
import OnboardingForm from './components/OnboardingForm';
import TeacherOnboardingForm from './components/TeacherOnboardingForm';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('joineazy_token') || null);
  const [loading, setLoading] = useState(false);
  const [initialChecking, setInitialChecking] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleRole, setGoogleRole] = useState('student');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Restore user session on mount
  useEffect(() => {
    if (token) {
      fetchUserProfile(token);
    } else {
      setInitialChecking(false);
    }
  }, [token]);

  // Poll notifications for logged in student
  useEffect(() => {
    if (token && user && user.role === 'student') {
      fetchNotifications(token);
      const interval = setInterval(() => {
        fetchNotifications(token);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [token, user]);

  const fetchNotifications = async (authToken) => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const fetchUserProfile = async (authToken) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Error restoring session:', err);
    } finally {
      setInitialChecking(false);
    }
  };

  const handleRegister = async ({ email, password, role }) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || (data.errors ? data.errors.join('. ') : 'Registration failed'));
      }

      setToken(data.token);
      localStorage.setItem('joineazy_token', data.token);
      setUser(data.user);
      setSuccessMessage('Registration successful! Please fill in your student details.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setToken(data.token);
      localStorage.setItem('joineazy_token', data.token);
      setUser(data.user);
      setSuccessMessage('Logged in successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async ({ email, name, googleId, role }) => {
    setIsGoogleModalOpen(false);
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, googleId, role })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }

      setToken(data.token);
      localStorage.setItem('joineazy_token', data.token);
      setUser(data.user);
      setSuccessMessage('Signed in with Google!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTeacherDetails = async (details) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/teacher/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(details)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save teacher details');
      }

      setUser(data.user);
      setIsEditingProfile(false);
      setSuccessMessage('Faculty details saved! Welcome to Teacher Portal.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStudentDetails = async (details) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(details)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save student details');
      }

      setUser(data.user);
      setIsEditingProfile(false);
      setSuccessMessage('Profile updated! Redirecting to student page...');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('joineazy_token');
    setIsEditingProfile(false);
    setError(null);
    setSuccessMessage(null);
    setNotifications([]);
    setUnreadCount(0);
    setIsNotificationsOpen(false);
  };

  const renderCurrentView = () => {
    if (initialChecking) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[55vh] gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-700 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading your portal…</p>
        </div>
      );
    }

    if (!user) {
      return (
        <AuthTabs
          onRegister={handleRegister}
          onLogin={handleLogin}
          onOpenGoogleModal={(r) => {
            setGoogleRole(r);
            setIsGoogleModalOpen(true);
          }}
          loading={loading}
          error={error}
          successMessage={successMessage}
        />
      );
    }

    // Teacher / Admin View
    if (user.role === 'admin') {
      const isTeacherComplete = Boolean(
        user.name && (user.employeeId || user.rollNumber) && user.phone
      );

      if (!isTeacherComplete || isEditingProfile) {
        return (
          <TeacherOnboardingForm
            user={user}
            onSubmitDetails={handleSaveTeacherDetails}
            loading={loading}
            error={error}
          />
        );
      }

      return <AdminDashboard token={token} />;
    }

    // Student View: Check if onboarding details are complete
    const isProfileComplete = Boolean(
      user.school && user.class && user.rollNumber && user.name && user.phone
    );

    if (!isProfileComplete || isEditingProfile) {
      return (
        <OnboardingForm
          user={user}
          onSubmitDetails={handleSaveStudentDetails}
          loading={loading}
          error={error}
        />
      );
    }

    // Students Page
    return (
      <StudentDashboard
        user={user}
        token={token}
        notifications={notifications}
        unreadNotificationsCount={unreadCount}
        onRefreshNotifications={() => fetchNotifications(token)}
        isNotificationsOpen={isNotificationsOpen}
        onCloseNotifications={() => setIsNotificationsOpen(false)}
        onEditDetails={() => setIsEditingProfile(true)}
      />
    );
  };

  return (
    <div className="app-shell selection:bg-blue-700 selection:text-white">
      <Navbar
        user={user}
        onLogout={handleLogout}
        unreadNotificationsCount={unreadCount}
        onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        isNotificationsOpen={isNotificationsOpen}
      />

      <main className={`flex-1 w-full max-w-6xl mx-auto min-w-0 ${user ? 'app-main-app' : 'app-main-auth'}`}>
        {renderCurrentView()}
      </main>

      <GoogleModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        role={googleRole}
      />

      <footer className="app-footer">
        <p>Joineazy</p>
      </footer>
    </div>
  );
}

export default App;
