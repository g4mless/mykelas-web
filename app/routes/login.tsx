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
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl p-8 space-y-6">
        <section>
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">
            Klas Student Portal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Masuk</h1>
          <p className="mt-2 text-gray-600">
            Gunakan email sekolah untuk menerima kode OTP melalui Supabase.
          </p>
        </section>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="halo@mail.com"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            />
          </label>

          {formError && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-sky-600 py-3 text-base font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Mengirim..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Sudah menerima kode?
          <Link to="/verify" className="ml-1 font-semibold text-sky-600 hover:underline">
            Verifikasi di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
