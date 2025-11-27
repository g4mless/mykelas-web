"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "mykelas-theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getInitialPreference = (): ThemePreference => {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
};

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<ThemePreference>(() => getInitialPreference());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const root = window.document.documentElement;

    const applyTheme = (preference: ThemePreference) => {
      const nextTheme = preference === "system" ? (mediaQuery.matches ? "dark" : "light") : preference;
      setResolvedTheme(nextTheme);
      root.classList.remove("light", "dark");
      root.classList.add(nextTheme);
      root.dataset.theme = nextTheme;
      root.style.setProperty("color-scheme", nextTheme);
    };

    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);

    const handleChange = (event: MediaQueryListEvent) => {
      if (theme !== "system") return;
      const nextTheme = event.matches ? "dark" : "light";
      setResolvedTheme(nextTheme);
      root.classList.remove("light", "dark");
      root.classList.add(nextTheme);
      root.dataset.theme = nextTheme;
      root.style.setProperty("color-scheme", nextTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme]);

  const setThemePreference = useCallback((next: ThemePreference) => {
    setTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const base = current === "system" ? resolvedTheme : current;
      return base === "dark" ? "light" : "dark";
    });
  }, [resolvedTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: setThemePreference,
      toggleTheme,
    }),
    [theme, resolvedTheme, setThemePreference, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
