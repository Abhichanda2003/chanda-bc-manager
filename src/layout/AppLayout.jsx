import { LogOut, Menu, Search, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { navItems } from '../data/navigation.js';

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { displayName, isFirebaseConfigured, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-mist to-amber-50 text-ink dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100 transition-colors">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-emerald-100 bg-white dark:border-slate-700 dark:bg-slate-900 px-5 py-6 shadow-soft transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 rounded-lg bg-gradient-to-br from-emerald-700 to-cyan-700 dark:from-emerald-600 dark:to-cyan-600 p-4 text-white">
          <p className="text-sm font-semibold text-white/80">Santoshi Chanda</p>
          <h1 className="mt-2 text-2xl font-bold">Chanda BC Manager</h1>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  isActive 
                    ? 'bg-leaf text-white dark:bg-emerald-600 dark:text-white' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`
              }
            >
              <item.icon size={18} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {open && (
        <button
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-emerald-100 bg-white/85 dark:border-slate-700 dark:bg-slate-900/85 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-300 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex min-h-11 flex-1 items-center gap-2 rounded-md border border-emerald-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 shadow-sm">
              <Search size={18} className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
              <input
                className="w-full border-0 bg-transparent text-sm outline-none dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="Search members, groups, or payments"
                aria-label="Search"
              />
            </div>
            <div className="hidden rounded-md bg-emerald-50 dark:bg-slate-800 px-3 py-2 text-right shadow-sm sm:block">
              <p className="text-xs text-slate-500 dark:text-slate-400">Logged in as</p>
              <p className="max-w-44 truncate text-sm font-semibold dark:text-slate-200">{displayName}</p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {isFirebaseConfigured && (
              <button
                type="button"
                onClick={logout}
                className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
