"use client";

import { Outlet, NavLink, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";

import type { Route } from "./+types/protected";
import { useAuth } from "../providers/auth-provider";
import { useStudent } from "../providers/student-provider";

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
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => Promise<void> | void }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
    <div className="max-w-md space-y-4 rounded-3xl bg-white p-8 text-center shadow">
      <p className="text-lg font-semibold text-rose-600">Gagal memuat data siswa</p>
      <p className="text-sm text-slate-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white"
      >
        Coba lagi
      </button>
    </div>
  </div>
);

export default function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isLoading: authLoading, signOut } = useAuth();
  const {
    student,
    isLoading: studentLoading,
    error: studentError,
    refresh,
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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      isActive ? "bg-sky-600 text-white" : "text-slate-500 hover:text-slate-900"
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm text-slate-500">Selamat datang kembali</p>
            <h1 className="text-xl font-semibold text-slate-900">{student.nama}</h1>
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-2 bg-slate-100 rounded-full p-1">
              <NavLink to="." end className={navLinkClass}>
                Beranda
              </NavLink>
              <NavLink to="profile" className={navLinkClass}>
                Profil
              </NavLink>
            </nav>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/login", { replace: true });
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
