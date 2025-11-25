"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import type { Route } from "./+types/link-student";
import { useAuth } from "../providers/auth-provider";
import { useStudent } from "../providers/student-provider";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Lengkapi Data Siswa | Klas" },
    {
      name: "description",
      content: "Tautkan akun Supabase Anda ke data siswa Klas.",
    },
  ];
}

export default function LinkStudentRoute() {
  const navigate = useNavigate();
  const { session, isLoading: authLoading, signOut } = useAuth();
  const {
    student,
    isLoading: studentLoading,
    linkStudent,
  } = useStudent();

  const [fullName, setFullName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !session) {
      navigate("/login", { replace: true });
    }
  }, [session, authLoading, navigate]);

  useEffect(() => {
    if (!studentLoading && student) {
      navigate("/", { replace: true });
    }
  }, [student, studentLoading, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await linkStudent(fullName.trim());
      setSuccessMessage("Akun berhasil ditautkan. Mengarahkan ke dashboard...");
      setTimeout(() => navigate("/", { replace: true }), 1000);
    } catch (error) {
      setFormError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const email = session?.user.email ?? "";

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 space-y-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Step 02</p>
          <h1 className="text-3xl font-semibold">Tautkan Akun Siswa</h1>
          <p className="text-slate-300">
            Kami tidak menemukan data siswa yang terhubung dengan akun {email}. Masukkan nama lengkap sesuai data sekolah untuk melanjutkan.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-200">Nama Lengkap</span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Tuliskan sesuai ijazah"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
            />
          </label>

          {formError && (
            <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {formError}
            </p>
          )}

          {successMessage && (
            <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {successMessage}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSubmitting || studentLoading || !fullName.trim()}
              className="flex-1 rounded-2xl bg-sky-500 py-3 text-base font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
                {isSubmitting ? "Menghubungkan..." : "Hubungkan Akun"}
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/login", { replace: true });
              }}
              className="rounded-2xl border border-slate-700 px-5 py-3 text-base font-semibold text-slate-200 hover:border-slate-500"
            >
              Keluar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
