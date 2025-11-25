"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import type { Route } from "./+types/verify-otp";
import { useAuth } from "../providers/auth-provider";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Verifikasi OTP | Klas Student" },
    {
      name: "description",
      content: "Masukkan OTP Supabase untuk melanjutkan ke dashboard siswa.",
    },
  ];
}

interface VerifyLocationState {
  email?: string;
}

export default function VerifyOtpRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isLoading, otpEmail, verifyOtp } = useAuth();

  const emailFromState = useMemo(() => {
    const state = location.state as VerifyLocationState | null;
    return state?.email;
  }, [location.state]);

  const [email, setEmail] = useState(emailFromState ?? otpEmail ?? "");
  const [token, setToken] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && session) {
      navigate("/", { replace: true });
    }
  }, [session, isLoading, navigate]);

  useEffect(() => {
    if (emailFromState) {
      setEmail(emailFromState);
    }
  }, [emailFromState]);

  useEffect(() => {
    if (!email && otpEmail) {
      setEmail(otpEmail);
    }
  }, [email, otpEmail]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await verifyOtp({ email: email.trim(), token: token.trim() });
      navigate("/", { replace: true });
    } catch (error) {
      setFormError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-8 space-y-6">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-500">
            Verifikasi OTP
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Masukkan Kode</h1>
          <p className="mt-2 text-gray-600">
            Kami telah mengirim kode 6 digit ke email Anda. Kode berlaku selama 5 menit.
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
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">Kode OTP</span>
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={token}
              onChange={(event) => setToken(event.target.value.replace(/[^0-9]/g, ""))}
              className="tracking-[0.5em] text-center text-2xl font-semibold w-full rounded-2xl border border-gray-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
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
            className="w-full rounded-2xl bg-purple-600 py-3 text-base font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Memverifikasi..." : "Masuk"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Tidak menerima kode?
          <Link to="/login" className="ml-1 font-semibold text-purple-600 hover:underline">
            Kirim ulang
          </Link>
        </p>
      </div>
    </main>
  );
}
