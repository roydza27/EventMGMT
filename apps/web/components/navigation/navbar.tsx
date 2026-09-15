'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Compass, Ticket, LayoutDashboard, PlusCircle, LogOut, Menu, X, Sparkles, UserCircle, School } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  let navItems: { label: string; href: string; icon: React.ReactNode }[] = [];

  if (user?.role === 'ORGANIZER') {
    navItems = [
      { label: 'Overview', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'Events', href: '/events', icon: <Compass className="w-4 h-4" /> },
      { label: 'Create Event', href: '/events/new', icon: <PlusCircle className="w-4 h-4" /> },
    ];
  } else if (user?.role === 'ADMIN') {
    navItems = [
      { label: 'Overview', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'All Events', href: '/events', icon: <Compass className="w-4 h-4" /> },
    ];
  } else {
    navItems = [
      { label: 'Discover', href: '/events', icon: <Compass className="w-4 h-4" /> },
      { label: 'My Registrations', href: '/registrations', icon: <Ticket className="w-4 h-4" /> },
      { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    ];
  }

  const isActive = (href: string) => {
    if (href === '/events' && pathname === '/events') return true;
    if (href !== '/events' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-accent-soft border border-accent/30 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
            <School className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl tracking-tight font-medium text-foreground leading-none">
              AIMIT Updates
            </span>
            <span className="text-[10px] tracking-widest uppercase text-muted font-mono mt-0.5">
              Campus Events
            </span>
          </div>
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-sunken/60 border border-border/80 px-2 py-1 rounded-full">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active
                    ? 'bg-surface text-foreground shadow-sm border border-border'
                    : 'text-muted hover:text-foreground hover:bg-surface/50'
                }`}
              >
                <span className={active ? 'text-accent' : 'text-muted'}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-border">
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-foreground leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-muted truncate max-w-[120px]">
                  {user.role} • {user.college}
                </span>
              </div>

              <button
                onClick={() => logout()}
                title="Sign out"
                className="p-2 rounded-full text-muted hover:text-danger hover:bg-danger-soft transition-colors"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-full text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface border border-border"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface-elevated px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top duration-200">
          <div className="space-y-1 mb-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(item.href)
                    ? 'bg-accent-soft text-accent font-semibold'
                    : 'text-muted hover:text-foreground hover:bg-surface'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>

          {isAuthenticated && user ? (
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCircle className="w-7 h-7 text-muted" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">{user.name}</span>
                  <span className="text-[10px] text-muted">{user.role} • {user.college}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-danger font-medium hover:bg-danger-soft rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-2.5 rounded-lg bg-foreground text-background text-sm font-medium"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
