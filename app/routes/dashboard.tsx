"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Route } from "./+types/dashboard";
import { useStudent } from "../providers/student-provider";
import type { Attendance, AttendanceStatus } from "../types/student";
import { fetchTodayStatus } from "../lib/klas-api";
import { useAuth } from "../providers/auth-provider";

const statusLabels: Record<AttendanceStatus, string> = {
  HADIR: "Hadir",
  IZIN: "Izin",
  SAKIT: "Sakit",
};

const statusStyles: Record<AttendanceStatus, string> = {
  HADIR: "bg-emerald-50 text-emerald-800 border-emerald-200",
  IZIN: "bg-amber-50 text-amber-800 border-amber-200",
  SAKIT: "bg-rose-50 text-rose-800 border-rose-200",
};

const attendanceOptions: AttendanceStatus[] = ["HADIR", "IZIN", "SAKIT"];

const formatDate = (date?: string | null) => {
  if (!date) return "Belum ada catatan";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
    }).format(new Date(date));
  } catch {
    return date;
  }
};

export const meta = ({}: Route.MetaArgs) => {
  return [
    { title: "Beranda | Klas Student" },
    {
      name: "description",
      content: "Lakukan presensi harian dan lihat status terbaru Anda.",
    },
  ];
};

export default function DashboardRoute() {
  const { session } = useAuth();
  const { student, submitAttendance } = useStudent();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error">("success");
  const [loadingStatus, setLoadingStatus] = useState<AttendanceStatus | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [todayStatusError, setTodayStatusError] = useState<string | null>(null);
  const [isTodayStatusLoading, setIsTodayStatusLoading] = useState(false);

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        dateStyle: "full",
      }).format(new Date()),
    [],
  );

  const accessToken = session?.access_token ?? null;

  const loadTodayStatus = useCallback(async () => {
    if (!accessToken) {
      setTodayAttendance(null);
      setTodayStatusError(null);
      return;
    }

    setIsTodayStatusLoading(true);
    setTodayStatusError(null);

    try {
      const response = await fetchTodayStatus(accessToken);
      setTodayAttendance(response.has_attendance ? response.attendance ?? null : null);
    } catch (error) {
      setTodayAttendance(null);
      setTodayStatusError(
        error instanceof Error ? error.message : "Gagal memuat status hari ini",
      );
    } finally {
      setIsTodayStatusLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadTodayStatus();
  }, [loadTodayStatus]);

  const handleAttendance = async (status: AttendanceStatus) => {
    setFeedback(null);
    setLoadingStatus(status);

    try {
      await submitAttendance(status);
      await loadTodayStatus();
      setFeedback("Absensi berhasil direkam.");
      setFeedbackTone("success");
    } catch (error) {
      setFeedback((error as Error).message);
      setFeedbackTone("error");
    } finally {
      setLoadingStatus(null);
    }
  };

  const lastStatus = todayAttendance?.status ?? null;
  const lastDate = todayAttendance?.date ?? null;

  return (
    <section className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-sky-600 to-blue-600 p-6 text-white">
        <p className="text-sm uppercase tracking-[0.3em] text-white/70">Hari ini</p>
        <h2 className="mt-2 text-3xl font-semibold">{today}</h2>
        <p className="mt-4 text-lg text-white/90">Selamat belajar, {student?.nama}!</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Status terakhir</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                {isTodayStatusLoading
                  ? "Memuat..."
                  : lastStatus
                  ? statusLabels[lastStatus]
                  : "Belum Presensi"}
              </h3>
            </div>
            {lastStatus && !isTodayStatusLoading && (
              <span className={`rounded-full border px-4 py-2 text-sm font-medium ${statusStyles[lastStatus]}`}>
                {statusLabels[lastStatus]}
              </span>
            )}
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Terakhir diperbarui: {isTodayStatusLoading ? "Memuat status..." : formatDate(lastDate)}
          </p>
          {todayStatusError && (
            <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-700">
              {todayStatusError}
            </p>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-900">Presensi Hari Ini</h3>
          <p className="mt-1 text-sm text-slate-500">Pilih status kehadiran sesuai kondisi Anda.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {attendanceOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleAttendance(option)}
                disabled={loadingStatus === option}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  option === "HADIR"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300"
                    : option === "IZIN"
                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300"
                    : "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {loadingStatus === option ? "Menyimpan..." : statusLabels[option]}
              </button>
            ))}
          </div>

          {feedback && (
            <p
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                feedbackTone === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {feedback}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
