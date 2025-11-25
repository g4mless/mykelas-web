"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabaseClient } from "../lib/supabase-client";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  otpEmail: string;
  setOtpEmail: (email: string) => void;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (payload: { email: string; token: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const persistOtpEmail = (email: string) => {
  if (typeof window === "undefined") return;
  if (email) {
    window.localStorage.setItem("otpEmail", email);
  } else {
    window.localStorage.removeItem("otpEmail");
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otpEmail, setOtpEmailState] = useState("");

  useEffect(() => {
    let active = true;

    supabaseClient.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("otpEmail");
    if (stored) {
      setOtpEmailState(stored);
    }
  }, []);

  const setOtpEmail = useCallback((email: string) => {
    setOtpEmailState(email);
    persistOtpEmail(email);
  }, []);

  const sendOtp: AuthContextValue["sendOtp"] = useCallback(async (email) => {
    const { error } = await supabaseClient.auth.signInWithOtp({ email });
    if (error) throw error;
    setOtpEmail(email);
  }, [setOtpEmail]);

  const verifyOtp: AuthContextValue["verifyOtp"] = useCallback(
    async ({ email, token }) => {
      const { error } = await supabaseClient.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (error) throw error;
      setOtpEmail("");
    },
    [setOtpEmail],
  );

  const signOut = useCallback(async () => {
    await supabaseClient.auth.signOut();
    setOtpEmail("");
  }, [setOtpEmail]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      otpEmail,
      setOtpEmail,
      sendOtp,
      verifyOtp,
      signOut,
    }),
    [session, isLoading, otpEmail, sendOtp, verifyOtp, signOut, setOtpEmail],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
