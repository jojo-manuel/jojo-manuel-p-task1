import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '448067617911-7q1pc33opl9bgbafh7mggqoo4vpjqio3.apps.googleusercontent.com';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Sign-In')));
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });
}

export default function GoogleSignInButton({ onCredential, disabled = false }) {
  const buttonRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const [loadError, setLoadError] = useState(null);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        await loadGisScript();
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) {
              onCredentialRef.current(response.credential);
            }
          },
          error_callback: (err) => {
            console.warn('Google Identity Services notice:', err);
            if (!cancelled) {
              setLoadError(`Domain origin ${window.location.origin} is not allowed for Client ID (${GOOGLE_CLIENT_ID.slice(0, 16)}...). Add this origin in Google Cloud Console.`);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'popup'
        });

        buttonRef.current.innerHTML = '';
        const width = Math.max(240, Math.min(buttonRef.current.offsetWidth || 360, 400));
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width,
          logo_alignment: 'left'
        });
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message || 'Google Sign-In is unavailable');
        }
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <div className="mb-4 text-xs text-amber-800 bg-amber-50/90 p-3 rounded-xl border border-amber-200 text-left font-medium leading-relaxed shadow-sm">
        <div className="font-semibold text-amber-900 mb-1 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          Google Sign-In Setup Notice
        </div>
        <p className="text-amber-700">{loadError}</p>
        <p className="mt-1 text-[11px] text-amber-600">You can create an account or sign in with your email & password below.</p>
      </div>
    );
  }

  return (
    <div className={`google-btn-host mb-5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div ref={buttonRef} className="google-btn-slot" />
    </div>
  );
}
