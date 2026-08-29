import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

function useAnchoredPosition(open, anchorRef, estimatedHeight = 220) {
  const [style, setStyle] = useState({ top: 0, left: 0, width: 0 });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return undefined;

    const update = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      const width = rect.width;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < estimatedHeight && rect.top > spaceBelow;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));

      if (openUp) {
        setStyle({
          left,
          width,
          bottom: window.innerHeight - rect.top + 6,
          top: 'auto'
        });
      } else {
        setStyle({
          left,
          width,
          top: rect.bottom + 6,
          bottom: 'auto'
        });
      }
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchorRef, estimatedHeight]);

  return style;
}

function AnchoredPanel({ open, anchorRef, onClose, estimatedHeight, children, className = '' }) {
  const style = useAnchoredPosition(open, anchorRef, estimatedHeight);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    const onPointer = (event) => {
      const anchor = anchorRef.current;
      if (anchor && (anchor === event.target || anchor.contains(event.target))) return;
      if (event.target.closest?.('.popover-panel')) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className={`popover-panel ${className}`.trim()} style={style} role="listbox">
      {children}
    </div>,
    document.body
  );
}

export function PopoverSelect({ value, onChange, options, placeholder = 'Select', className }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const selected = options.find((option) => option.value === value);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`${className} flex items-center justify-between gap-2`}
      >
        <span className={`truncate ${selected ? 'text-slate-800' : 'text-slate-400'}`}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnchoredPanel
        open={open}
        anchorRef={buttonRef}
        onClose={() => setOpen(false)}
        estimatedHeight={Math.min(260, 44 + options.length * 36)}
      >
        {options.map((option) => (
          <button
            key={option.value || 'empty'}
            type="button"
            role="option"
            aria-selected={option.value === value}
            className={`popover-option ${option.value === value ? 'is-active' : ''}`}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
          >
            {option.label}
          </button>
        ))}
      </AnchoredPanel>
    </div>
  );
}

export function DateTimeField({ value, onChange, className, minDate, allowPast = false }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const datePart = value?.slice(0, 10) || '';
  const timePart = value?.slice(11, 16) || '';

  // Get current local date & time
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const minAllowedDate = allowPast ? undefined : (minDate || todayStr);

  const label = value
    ? `${datePart} ${timePart}`.trim()
    : 'Select due date & time';

  const commit = (nextDate, nextTime) => {
    if (!nextDate && !nextTime) {
      onChange('');
      return;
    }

    let chosenDate = nextDate || datePart || todayStr;
    if (!allowPast && chosenDate < todayStr) {
      chosenDate = todayStr;
    }

    let chosenTime = nextTime || timePart || '23:59';
    if (!allowPast && chosenDate === todayStr && chosenTime < currentTimeStr) {
      chosenTime = currentTimeStr;
    }

    onChange(`${chosenDate}T${chosenTime}`);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`${className} text-left flex items-center justify-between gap-2`}
      >
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>{label}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnchoredPanel
        open={open}
        anchorRef={buttonRef}
        onClose={() => setOpen(false)}
        estimatedHeight={180}
        className="popover-panel-form"
      >
        <label className="block px-2 pt-2 pb-1 text-[11px] font-semibold text-slate-500">
          Date
          <input
            type="date"
            value={datePart}
            min={minAllowedDate}
            onChange={(event) => {
              const val = event.target.value;
              if (!allowPast && val && val < todayStr) {
                commit(todayStr, timePart);
              } else {
                commit(val, timePart);
              }
            }}
            className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </label>
        <label className="block px-2 pt-1 pb-3 text-[11px] font-semibold text-slate-500">
          Time
          <input
            type="time"
            value={timePart}
            min={(!allowPast && datePart === todayStr) ? currentTimeStr : undefined}
            onChange={(event) => commit(datePart, event.target.value)}
            className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </label>
      </AnchoredPanel>
    </div>
  );
}
