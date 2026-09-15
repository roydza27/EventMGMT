'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from './theme-provider';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Toggle theme"
        className="p-2 rounded-full border border-border bg-surface text-muted hover:text-foreground hover:border-border-strong transition-all duration-150 flex items-center justify-center"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-accent" />
        ) : (
          <Sun className="w-4 h-4 text-accent" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-32 rounded-lg border border-border bg-surface-elevated py-1 shadow-surface-dark z-50 animate-in fade-in duration-100">
          <button
            onClick={() => {
              setTheme('light');
              setOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition-colors ${
              theme === 'light' ? 'text-accent font-semibold bg-accent-soft' : 'text-muted hover:text-foreground hover:bg-surface'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Light
          </button>
          <button
            onClick={() => {
              setTheme('dark');
              setOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition-colors ${
              theme === 'dark' ? 'text-accent font-semibold bg-accent-soft' : 'text-muted hover:text-foreground hover:bg-surface'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            Dark
          </button>
          <button
            onClick={() => {
              setTheme('system');
              setOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition-colors ${
              theme === 'system' ? 'text-accent font-semibold bg-accent-soft' : 'text-muted hover:text-foreground hover:bg-surface'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            System
          </button>
        </div>
      )}
    </div>
  );
}
