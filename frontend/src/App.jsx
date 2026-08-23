import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthTabs from './components/AuthTabs';
import GoogleModal from './components/GoogleModal';
import OnboardingForm from './components/OnboardingForm';
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

  // Restore user session on mount
  useEffect(() => {
    if (token) {
      fetchUserProfile(token);
    } else {
      setInitialChecking(false);
    }
  }, [token]);

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
  };

  const renderCurrentView = () => {
    if (initialChecking) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-xs text-slate-500 font-semibold">Loading Joineazy Academic Portal...</p>
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

    // Admin View
    if (user.role === 'admin') {
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
        onEditDetails={() => setIsEditingProfile(true)}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white font-sans">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {renderCurrentView()}
      </main>

      <GoogleModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onGoogleSignIn={handleGoogleSignIn}
        role={googleRole}
      />

      <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p>© 2026 Joineazy Academic Portal. High Security Student & School Portal.</p>
      </footer>
    </div>
  );
}

export default App;
