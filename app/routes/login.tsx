"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import type { Route } from "./+types/login";
import { useAuth } from "../providers/auth-provider";

export function meta({}: Route.MetaArgs) {
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

  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && session) {
      navigate("/", { replace: true });
    }
  }, [session, isLoading, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await sendOtp(email.trim());
      navigate("/verify", { state: { email }, replace: false });
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
            Klas Student Portal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-950 dark:text-zinc-50">Masuk</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">
            Gunakan email sekolah untuk menerima kode OTP melalui Supabase.
          </p>
        </section>

        <form className="space-y-5" onSubmit={handleSubmit}>
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

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-300">
          Sudah menerima kode?
          <Link to="/verify" className="ml-1 font-semibold text-sky-600 hover:underline dark:text-sky-400">
            Verifikasi di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
