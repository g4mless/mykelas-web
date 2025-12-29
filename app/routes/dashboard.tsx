"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Route } from "./+types/dashboard";
import { useStudent } from "../providers/student-provider";
import type { Attendance, AttendanceStatus } from "../types/student";
import { fetchTodayStatus } from "../lib/klas-api";
import { useAuth } from "../providers/auth-provider";
import { QrScanner } from "../components/qr-scanner";

const statusLabels: Record<AttendanceStatus, string> = {
  HADIR: "Hadir",
  IZIN: "Izin",
  SAKIT: "Sakit",
  ALFA: "Alfa",
};

const statusStyles: Record<AttendanceStatus, string> = {
  HADIR:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-400/10 dark:text-emerald-200",
  IZIN:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-400/10 dark:text-amber-200",
  SAKIT:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-400/10 dark:text-rose-200",
  ALFA:
    "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-500/30 dark:bg-zinc-400/10 dark:text-zinc-400",
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

export const meta = ({ }: Route.MetaArgs) => {
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  // Attachment Upload State
  const [pendingStatus, setPendingStatus] = useState<AttendanceStatus | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleAttendance = async (status: AttendanceStatus, attachmentPath?: string) => {
    setFeedback(null);
    setLoadingStatus(status);

    try {
      await submitAttendance(status, attachmentPath);
      await loadTodayStatus();
      setFeedbackTone("success");
      handleCloseDialog();
    } catch (error) {
      setFeedback((error as Error).message);
      setFeedbackTone("error");
    } finally {
      setLoadingStatus(null);
      setIsUploading(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setPendingStatus(null);
    setSelectedFile(null);
    setIsUploading(false);
  };

  const handleFileUploadAndSubmit = async () => {
    if (!pendingStatus || !selectedFile || !accessToken) return;

    setIsUploading(true);
    setFeedback(null);

    try {
      // 1. Get signed upload URL
      const { path, upload_url } = await import("../lib/klas-api").then((mod) =>
        mod.getAttachmentUploadUrl(selectedFile.name, accessToken),
      );

      // 2. Upload file
      await import("../lib/klas-api").then((mod) =>
        mod.uploadAttachmentFile(selectedFile, upload_url),
      );

      // 3. Submit attendance
      await handleAttendance(pendingStatus, path);
    } catch (error) {
      setFeedback((error as Error).message);
      setFeedbackTone("error");
      setIsUploading(false);
    }
  };

  const lastStatus = todayAttendance?.status ?? null;
  const lastDate = todayAttendance?.date ?? null;
  const attachmentUrl = todayAttendance?.attachment_url ?? null;

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-sm border border-zinc-100 bg-white/90 p-6 shadow-lg shadow-zinc-200/50 transition dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-black/30">
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
              <span className={`rounded-sm border px-4 py-2 text-sm font-medium ${statusStyles[lastStatus]}`}>
                {statusLabels[lastStatus]}
              </span>
            )}
          </div>
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Terakhir diperbarui: {isTodayStatusLoading ? "Memuat status..." : formatDate(lastDate)}
          </p>

          {attachmentUrl && (
            <div className="mt-4">
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 hover:underline dark:text-blue-400"
              >
                📄 Lihat Lampiran
              </a>
            </div>
          )}

          {todayStatusError && (
            <p className="mt-3 rounded-sm border border-rose-200/40 bg-rose-50/90 px-4 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {todayStatusError}
            </p>
          )}
        </div>

        <div className="rounded-sm border border-zinc-100 bg-white/90 p-6 shadow-lg shadow-zinc-200/50 transition dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-black/30">
          <h3 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Presensi Hari Ini</h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Catat kehadiran Anda untuk hari ini.</p>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              disabled={!!todayAttendance}
              className="rounded-sm bg-zinc-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
            >
              {todayAttendance ? "Sudah Absensi" : "Isi Absensi"}
            </button>
          </div>

          {feedback && (
            <p
              className={`mt-4 rounded-sm px-4 py-3 text-sm ${feedbackTone === "success"
                ? "border border-emerald-200/40 bg-emerald-50/90 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-400/10 dark:text-emerald-200"
                : "border border-rose-200/40 bg-rose-50/90 text-rose-700 dark:border-rose-500/30 dark:bg-rose-400/10 dark:text-rose-200"
                }`}
            >
              {feedback}
            </p>
          )}
        </div>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-sm border border-zinc-200 bg-white/95 p-6 shadow-2xl shadow-black/30 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                {pendingStatus ? `Upload Lampiran ${statusLabels[pendingStatus]}` : "Pilih Status Kehadiran"}
              </h3>
              <button
                type="button"
                onClick={handleCloseDialog}
                className="text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                ✕
              </button>
            </div>

            {!pendingStatus ? (
              <div className="grid gap-3">
                {attendanceOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      if (option === "HADIR") {
                        setIsDialogOpen(false);
                        setIsQrScannerOpen(true);
                      } else {
                        setPendingStatus(option);
                      }
                    }}
                    disabled={loadingStatus === option}
                    className={`flex w-full items-center justify-center rounded-sm border px-4 py-4 text-base font-semibold transition ${option === "HADIR"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 dark:border-emerald-500/30 dark:bg-emerald-400/10 dark:text-emerald-200"
                      : option === "IZIN"
                        ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 dark:border-amber-500/30 dark:bg-amber-400/10 dark:text-amber-200"
                        : "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 dark:border-rose-500/30 dark:bg-rose-400/10 dark:text-rose-200"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {loadingStatus === option
                      ? "Menyimpan..."
                      : option === "HADIR"
                        ? "Hadir"
                        : statusLabels[option]}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Lampiran Surat/Bukti (Wajib)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-sm file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPendingStatus(null)}
                    className="flex-1 rounded-sm border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleFileUploadAndSubmit}
                    disabled={!selectedFile || isUploading}
                    className="flex-1 rounded-sm bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {isUploading ? "Mengupload..." : "Kirim"}
                  </button>
                </div>
              </div>
            )}

            {!pendingStatus && (
              <button
                type="button"
                onClick={handleCloseDialog}
                className="mt-6 w-full rounded-sm border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
              >
                Batal
              </button>
            )}

          </div>
        </div>
      )}

      {isQrScannerOpen && (
        <QrScanner
          onClose={() => setIsQrScannerOpen(false)}
          onSuccess={() => {
            setIsQrScannerOpen(false);
            loadTodayStatus();
            setFeedback("Attendance Recorded! ✅");
            setFeedbackTone("success");
          }}
        />
      )}
    </>
  );
}
