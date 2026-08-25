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
      <p className="mb-5 text-sm text-rose-600 text-center">{loadError}</p>
    );
  }

  return (
    <div className={`google-btn-host mb-5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div ref={buttonRef} className="google-btn-slot" />
    </div>
  );
}
