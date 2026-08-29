import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthTabs from './components/AuthTabs';
import GoogleRolePicker from './components/GoogleRolePicker';
import OnboardingForm from './components/OnboardingForm';
import TeacherOnboardingForm from './components/TeacherOnboardingForm';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import { useToast } from './components/Toast';
import './App.css';

async function safeParseJson(res) {
  const text = await res.text();
  if (!text || !text.trim()) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    if (!res.ok) {
      throw new Error(text || `Server error (${res.status})`);
    }
    throw new Error(`Server returned non-JSON response (${res.status}): ${text.slice(0, 80)}`);
  }
}

function App() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('joineazy_token') || null);
  const [loading, setLoading] = useState(false);
  const [initialChecking, setInitialChecking] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [pendingGoogle, setPendingGoogle] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [navHomeTrigger, setNavHomeTrigger] = useState(0);

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleGoHome = () => {
    setIsEditingProfile(false);
    setIsNotificationsOpen(false);
    setPendingGoogle(null);
    setNavHomeTrigger((prev) => prev + 1);
  };

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
      const data = await safeParseJson(res);
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
      const data = await safeParseJson(res);
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
      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.message || (data.errors ? data.errors.join('. ') : 'Registration failed'));
      }

      setToken(data.token);
      localStorage.setItem('joineazy_token', data.token);
      setUser(data.user);
      setSuccessMessage('Registration successful! Please fill in your student details.');
      toast.success('Registration successful! Welcome to Joineazy.');
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Registration failed');
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
      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setToken(data.token);
      localStorage.setItem('joineazy_token', data.token);
      setUser(data.user);
      setSuccessMessage('Logged in successfully!');
      toast.success(`Welcome back, ${data.user?.name || data.user?.email || 'User'}!`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (idToken, role) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role })
      });
      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }

      if (data.isNewUser) {
        setPendingGoogle({
          idToken,
          email: data.profile?.email,
          name: data.profile?.name
        });
        toast.info('Please select your portal role to finish setup.');
        return;
      }

      setPendingGoogle(null);
      setToken(data.token);
      localStorage.setItem('joineazy_token', data.token);
      setUser(data.user);
      setSuccessMessage(data.message || 'Signed in with Google!');
      toast.success('Signed in with Google successfully!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Google sign in failed');
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
      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save teacher details');
      }

      setUser(data.user);
      setIsEditingProfile(false);
      setSuccessMessage('Faculty details saved! Welcome to Teacher Portal.');
      toast.success('Faculty profile details saved successfully!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to save faculty profile');
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
      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save student details');
      }

      setUser(data.user);
      setIsEditingProfile(false);
      setSuccessMessage('Profile updated! Redirecting to student page...');
      toast.success('Student profile updated successfully!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to update student details');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('joineazy_token');
    setPendingGoogle(null);
    setIsEditingProfile(false);
    setError(null);
    setSuccessMessage(null);
    setNotifications([]);
    setUnreadCount(0);
    setIsNotificationsOpen(false);
    toast.info('You have been logged out.');
  };

  const renderCurrentView = () => {
    if (initialChecking) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[55vh] gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading your portal…</p>
        </div>
      );
    }

    if (!user) {
      if (pendingGoogle) {
        return (
          <GoogleRolePicker
            profile={pendingGoogle}
            onSelectRole={(role) => handleGoogleCredential(pendingGoogle.idToken, role)}
            onBack={() => {
              setPendingGoogle(null);
              setError(null);
            }}
            loading={loading}
            error={error}
          />
        );
      }

      return (
        <AuthTabs
          onRegister={handleRegister}
          onLogin={handleLogin}
          onGoogleCredential={(idToken) => handleGoogleCredential(idToken)}
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
            onBack={isTeacherComplete ? () => setIsEditingProfile(false) : handleLogout}
            loading={loading}
            error={error}
          />
        );
      }

      return <AdminDashboard token={token} navHomeTrigger={navHomeTrigger} />;
    }

    // Student View: Check if onboarding details are complete
    const isProfileComplete = Boolean(
      user.name && user.rollNumber && user.phone
    );

    if (!isProfileComplete || isEditingProfile) {
      return (
        <OnboardingForm
          user={user}
          onSubmitDetails={handleSaveStudentDetails}
          onBack={isProfileComplete ? () => setIsEditingProfile(false) : handleLogout}
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
        navHomeTrigger={navHomeTrigger}
      />
    );
  };

  return (
    <div className="app-shell selection:bg-slate-900 selection:text-white">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onGoHome={handleGoHome}
        unreadNotificationsCount={unreadCount}
        onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        isNotificationsOpen={isNotificationsOpen}
      />

      <main className={`flex-1 w-full max-w-6xl mx-auto min-w-0 ${user ? 'app-main-app' : 'app-main-auth'}`}>
        {renderCurrentView()}
      </main>

      <footer className="app-footer">
        <p>Joineazy</p>
      </footer>
    </div>
  );
}

export default App;
