"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import type { Route } from "./+types/login";
import { useAuth } from "../providers/auth-provider";
import { useTeacher } from "../providers/teacher-provider";
import { loginTeacher } from "../lib/klas-api";
import { supabaseClient } from "../lib/supabase-client";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Masuk | Klas Student" },
    {
      name: "description",
      content: "Masuk menggunakan email untuk menerima OTP Supabase.",
    },
  ];
}

export default function LoginRoute() {
  const navigate = useNavigate();
  const { sendOtp, session, isLoading } = useAuth();
  const { setTeacher } = useTeacher();

  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [email, setEmail] = useState("");
  const [nuptk, setNuptk] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && session) {
      // If we are already logged in, we might want to redirect.
      // However, if we just logged in as teacher, we handle that in handleSubmit.
      // If we are revisiting the login page while logged in, we should redirect to home.
      // But we need to know if it's a teacher or student session to redirect correctly.
      // For now, let's redirect to root and let the root/protected logic handle it.
      navigate("/", { replace: true });
    }
  }, [session, isLoading, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (isTeacherMode) {
        const data = await loginTeacher(nuptk);
        setTeacher(data.teacher);

        const { error } = await supabaseClient.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (error) throw error;

        // Navigate to teacher dashboard
        navigate("/teacher/dashboard");
      } else {
        await sendOtp(email.trim());
        navigate("/verify", { state: { email }, replace: false });
      }
    } catch (error) {
      setFormError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center px-4 py-10 transition-colors">
      <div className="w-full max-w-md rounded-sm border border-zinc-200 bg-white/90 p-8 shadow-2xl shadow-zinc-200/60 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:shadow-black/40">
        <section>
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">
            {isTeacherMode ? "Teacher Portal" : "Klas Student Portal"}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-950 dark:text-zinc-50">Masuk</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">
            {isTeacherMode
              ? "Masuk menggunakan NUPTK Anda."
              : "Gunakan email anda untuk menerima kode OTP melalui Supabase."}
          </p>
        </section>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {isTeacherMode ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">NUPTK</span>
              <input
                type="text"
                required
                value={nuptk}
                onChange={(event) => setNuptk(event.target.value)}
                placeholder="1234567890"
                className="w-full rounded-sm border border-zinc-200 bg-white/80 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 shadow-inner transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </label>
          ) : (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="halo@mail.com"
                className="w-full rounded-sm border border-zinc-200 bg-white/80 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 shadow-inner transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </label>
          )}

          {formError && (
            <p className="rounded-sm border border-red-200/40 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-sm bg-sky-600 py-3 text-base font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            {isSubmitting ? "Mengirim..." : "Login"}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          {!isTeacherMode && (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Sudah menerima kode?
              <Link to="/verify" className="ml-1 font-semibold text-sky-600 hover:underline dark:text-sky-400">
                Verifikasi di sini
              </Link>
            </p>
          )}

          <button
            type="button"
            onClick={() => setIsTeacherMode(!isTeacherMode)}
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline"
          >
            {isTeacherMode ? "Login as Student" : "Login as Teacher"}
          </button>
        </div>
      </div>
    </main>
  );
}
