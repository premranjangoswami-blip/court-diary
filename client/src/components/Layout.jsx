import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { remindersApi } from '../services/api';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',  labelHi: 'डैशबोर्ड',  icon: HomeIcon },
  { to: '/cases',     label: 'Cases',      labelHi: 'मुकदमे',     icon: BriefcaseIcon },
  { to: '/reminders', label: 'Reminders',  labelHi: 'रिमाइंडर',   icon: BellIcon, badge: true },
  { to: '/search',    label: 'Search',     labelHi: 'खोज',        icon: SearchIcon },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Load reminder badge count
  useEffect(() => {
    remindersApi.get()
      .then((res) => setReminderCount(res.data?.length ?? 0))
      .catch(() => {});
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-navy-900 text-white shadow-xl">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-navy-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚖️</span>
            <div>
              <p className="font-bold text-lg leading-tight">Court Diary</p>
              <p className="text-navy-300 text-xs">Advocate Management</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, labelHi, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gold-500 text-white'
                    : 'text-navy-200 hover:bg-navy-700 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{label} <span className="text-xs opacity-70">/ {labelHi}</span></span>
              {badge && reminderCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {reminderCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Add Case quick link */}
        <div className="px-3 pb-5">
          <NavLink
            to="/cases/new"
            className="flex items-center justify-center gap-2 w-full bg-gold-500 hover:bg-gold-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            <span className="text-lg font-bold">+</span> New Case
          </NavLink>
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ───────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-72 bg-navy-900 text-white shadow-xl z-50">
            <div className="px-6 py-5 border-b border-navy-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚖️</span>
                <div>
                  <p className="font-bold text-lg leading-tight">Court Diary</p>
                  <p className="text-navy-300 text-xs">Advocate Management</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-navy-300 hover:text-white p-1">
                ✕
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map(({ to, label, labelHi, icon: Icon, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gold-500 text-white'
                        : 'text-navy-200 hover:bg-navy-700 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{label} <span className="text-xs opacity-70">/ {labelHi}</span></span>
                  {badge && reminderCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {reminderCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="px-3 pb-5">
              <NavLink
                to="/cases/new"
                className="flex items-center justify-center gap-2 w-full bg-gold-500 hover:bg-gold-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                <span className="text-lg font-bold">+</span> New Case
              </NavLink>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="md:hidden bg-navy-900 text-white px-4 py-3 flex items-center justify-between shadow">
          <button onClick={() => setSidebarOpen(true)} className="text-white p-1" aria-label="Open menu">
            <MenuIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚖️</span>
            <span className="font-bold text-sm">Court Diary</span>
          </div>
          <NavLink to="/cases/new" className="bg-gold-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
            + New
          </NavLink>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
          {children}
        </main>

        {/* ── Mobile Bottom Nav ─────────────────────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
          <div className="flex">
            {NAV_ITEMS.map(({ to, label, icon: Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors relative ${
                    isActive ? 'text-gold-600' : 'text-gray-500 hover:text-navy-700'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-gold-600' : 'text-gray-500'}`} />
                    <span className={isActive ? 'text-gold-600' : ''}>{label}</span>
                    {badge && reminderCount > 0 && (
                      <span className="absolute top-1 right-1/4 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                        {reminderCount > 9 ? '9+' : reminderCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function BriefcaseIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function MenuIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
