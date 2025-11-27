"use client";

import { useMemo } from "react";

import { useTheme } from "../providers/theme-provider";

const iconClasses = "h-4 w-4";

const SunIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.54-7.54-1.42 1.42M7.88 16.12l-1.42 1.42m0-11.3 1.42 1.42m9.18 9.18 1.42 1.42" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M21 14.5A9.5 9.5 0 0 1 9.5 3a9.5 9.5 0 1 0 11.5 11.5Z" />
  </svg>
);

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  const Icon = useMemo(() => (resolvedTheme === "dark" ? SunIcon : MoonIcon), [resolvedTheme]);
  const label = resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white/80 p-2 text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-900 ${className}`.trim()}
      aria-label={label}
    >
      <Icon className={iconClasses} />
    </button>
  );
}
