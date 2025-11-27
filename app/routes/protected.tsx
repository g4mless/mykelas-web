"use client";

import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";

import type { Route } from "./+types/protected";
import { useAuth } from "../providers/auth-provider";
import { useStudent } from "../providers/student-provider";
import { Avatar } from "../components/avatar";

export const meta = ({}: Route.MetaArgs) => {
  return [
    { title: "Dashboard | Klas Student" },
    {
      name: "description",
      content: "Pantau absensi harian dan profil siswa.",
    },
  ];
};

const FullPageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-sky-500 dark:border-zinc-800" />
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => Promise<void> | void }) => (
  <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 dark:bg-zinc-950">
    <div className="max-w-md space-y-4 rounded-3xl border border-zinc-200 bg-white/95 p-8 text-center shadow-lg shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-black/40">
      <p className="text-lg font-semibold text-rose-600">Gagal memuat data siswa</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
      >
        Coba lagi
      </button>
    </div>
  </div>
);

export default function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isLoading: authLoading } = useAuth();
  const {
    student,
    isLoading: studentLoading,
    error: studentError,
    refresh,
    avatarUrl,
  } = useStudent();

  useEffect(() => {
    if (!authLoading && !session) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [session, authLoading, navigate, location.pathname]);

  useEffect(() => {
    if (!studentLoading && session && !student && location.pathname !== "/link-student") {
      navigate("/link-student", { replace: true });
    }
  }, [student, studentLoading, session, navigate, location.pathname]);

  if (authLoading || studentLoading) {
    return <FullPageLoader />;
  }

  if (!session) {
    return <FullPageLoader />;
  }

  if (!student) {
    if (studentError) {
      return <ErrorState message={studentError} onRetry={refresh} />;
    }
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm text-zinc-500">MyKelas</p>
            <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">{student.nama}</h1>
          </div>
          <div className="flex flex-1 items-center justify-end">
            <Link
              to="/profile"
              className="flex items-center gap-3 rounded-full border border-transparent px-2 py-1 transition hover:border-zinc-200 dark:hover:border-zinc-700"
            >
              <Avatar name={student.nama} src={avatarUrl} />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

