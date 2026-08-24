import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';

export default function GoogleModal({ isOpen, onClose, onGoogleSignIn, role = 'student' }) {
  const [googleEmail, setGoogleEmail] = useState('student.demo@gmail.com');
  const [googleName, setGoogleName] = useState('Alex Johnson');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onGoogleSignIn({
        email: googleEmail,
        name: googleName,
        googleId: `google-user-${Date.now()}`,
        role
      });
      setLoading(false);
    }, 500);
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-sheet classic-card p-5 sm:p-8 relative shadow-2xl bg-white text-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-2.5 rounded-lg hover:bg-slate-100 transition-colors min-h-11 min-w-11 flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.2.0 10.04.0 12s.47 3.8 1.29 5.42l3.99-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900">Sign in with Google</h3>
            <p className="text-sm text-slate-500 mt-1">Use a Google account to continue</p>
        </div>

        {/* Quick Account Preset */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-left">Full Name</label>
            <input
              type="text"
              value={googleName}
              onChange={(e) => setGoogleName(e.target.value)}
              className="classic-input"
              placeholder="Your Name"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-left">Google Email</label>
            <input
              type="email"
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              className="classic-input"
              placeholder="name@gmail.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Continue as {googleName.split(' ')[0]}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-4">
          Demo Google sign-in for this portal.
        </p>
      </div>
    </div>
  );
}
