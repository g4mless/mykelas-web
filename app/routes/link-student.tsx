"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import type { Route } from "./+types/link-student";
import { useAuth } from "../providers/auth-provider";
import { useStudent } from "../providers/student-provider";
import { fetchStudents } from "../lib/klas-api";
import type { Student } from "../types/student";

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
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const accessToken = session?.access_token ?? null;

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

  useEffect(() => {
    const loadCandidates = async () => {
      if (!accessToken) return;
      setIsLoadingList(true);
      setListError(null);
      try {
        const list = await fetchStudents(accessToken);
        setStudentList(list);
      } catch (error) {
        setListError((error as Error).message);
      } finally {
        setIsLoadingList(false);
      }
    };

    loadCandidates();
  }, [accessToken]);

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
  const normalizedQuery = fullName.trim().toLowerCase();
  const suggestions = useMemo(() => {
    if (!normalizedQuery || normalizedQuery.length < 2) return [] as Student[];
    return studentList
      .filter((candidate) => candidate.nama.toLowerCase().includes(normalizedQuery))
      .slice(0, 5);
  }, [normalizedQuery, studentList]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-black flex items-center justify-center px-4 py-10 transition-colors">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white/95 p-8 shadow-2xl shadow-zinc-200/70 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:shadow-black/40 space-y-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">Step 02</p>
          <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">Tautkan Akun Siswa</h1>
          <p className="text-zinc-600 dark:text-zinc-300">
            Kami tidak menemukan data siswa yang terhubung dengan akun {email}. Masukkan nama lengkap sesuai data sekolah untuk melanjutkan.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Nama Lengkap</span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Tuliskan sesuai ijazah"
              className="w-full rounded-2xl border border-zinc-300 bg-white/70 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 shadow-inner transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </label>

          {listError && (
            <p className="rounded-2xl border border-red-200/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:text-red-200">
              {listError}
            </p>
          )}

          {isLoadingList && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Memuat daftar siswa...</p>
          )}

          {!isLoadingList && suggestions.length > 0 && (
            <div className="rounded-3xl border border-zinc-200 bg-white/80 p-3 space-y-2 dark:border-zinc-800 dark:bg-zinc-900/40">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Saran nama</p>
              <ul className="space-y-2">
                {suggestions.map((candidate) => (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      onClick={() => setFullName(candidate.nama)}
                      className="w-full rounded-2xl border border-zinc-200 bg-white/70 px-4 py-2 text-left text-sm text-zinc-900 transition hover:border-sky-400 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-100"
                    >
                      <span className="font-semibold">{candidate.nama}</span>
                      <span className="block text-xs text-zinc-500">Kelas {candidate.class?.class_name ?? candidate.kelas}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {formError && (
            <p className="rounded-2xl border border-red-200/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:text-red-200">
              {formError}
            </p>
          )}

          {successMessage && (
            <p className="rounded-2xl border border-emerald-200/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-200">
              {successMessage}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSubmitting || studentLoading || !fullName.trim()}
              className="flex-1 rounded-2xl bg-sky-600 py-3 text-base font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              {isSubmitting ? "Menghubungkan..." : "Hubungkan Akun"}
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/login", { replace: true });
              }}
              className="rounded-2xl border border-zinc-300 px-5 py-3 text-base font-semibold text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-zinc-500"
            >
              Keluar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
