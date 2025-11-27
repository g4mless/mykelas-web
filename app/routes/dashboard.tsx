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
  HADIR:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-400/10 dark:text-emerald-200",
  IZIN:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-400/10 dark:text-amber-200",
  SAKIT:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-400/10 dark:text-rose-200",
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
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-zinc-100 bg-white/90 p-6 shadow-lg shadow-zinc-200/50 transition dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-black/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Status terakhir</p>
              <h3 className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
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
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Terakhir diperbarui: {isTodayStatusLoading ? "Memuat status..." : formatDate(lastDate)}
          </p>
          {todayStatusError && (
            <p className="mt-3 rounded-2xl border border-rose-200/40 bg-rose-50/90 px-4 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {todayStatusError}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-zinc-100 bg-white/90 p-6 shadow-lg shadow-zinc-200/50 transition dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-black/30">
          <h3 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Presensi Hari Ini</h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Pilih status kehadiran sesuai kondisi Anda.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {attendanceOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleAttendance(option)}
                disabled={loadingStatus === option}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  option === "HADIR"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 dark:border-emerald-500/30 dark:bg-emerald-400/10 dark:text-emerald-200"
                    : option === "IZIN"
                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 dark:border-amber-500/30 dark:bg-amber-400/10 dark:text-amber-200"
                    : "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 dark:border-rose-500/30 dark:bg-rose-400/10 dark:text-rose-200"
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
                  ? "border border-emerald-200/40 bg-emerald-50/90 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-400/10 dark:text-emerald-200"
                  : "border border-rose-200/40 bg-rose-50/90 text-rose-700 dark:border-rose-500/30 dark:bg-rose-400/10 dark:text-rose-200"
              }`}
            >
              {feedback}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
