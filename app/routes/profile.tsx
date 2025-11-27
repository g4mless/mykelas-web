"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import type { Route } from "./+types/profile";
import { useStudent } from "../providers/student-provider";
import { useAuth } from "../providers/auth-provider";
import { Avatar } from "../components/avatar";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

const formatBirthInfo = (tempat?: string | null, tanggal?: string | null) => {
  if (!tempat && !tanggal) return "-";
  const formattedDate = (() => {
    if (!tanggal) return null;
    try {
      return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(tanggal));
    } catch {
      return tanggal;
    }
  })();
  if (tempat && formattedDate) return `${tempat}, ${formattedDate}`;
  return formattedDate ?? tempat ?? "-";
};

export const meta = ({}: Route.MetaArgs) => {
  return [
    { title: "Profil Siswa | Klas" },
    { name: "description", content: "Detail biodata siswa Klas." },
  ];
};

export default function ProfileRoute() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const {
    student,
    avatarUrl,
    uploadAvatar,
  } = useStudent();
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl ?? null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  useEffect(() => {
    setPreviewUrl(avatarUrl ?? null);
  }, [avatarUrl]);

  useEffect(() => {
    return () => {
      if (cropImageSrc) {
        URL.revokeObjectURL(cropImageSrc);
      }
    };
  }, [cropImageSrc]);

  if (!student) {
    return (
      <div className="rounded-sm border border-zinc-100 bg-white/90 p-6 text-center text-zinc-600 shadow-lg shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300 dark:shadow-black/30">
        Data siswa belum tersedia.
      </div>
    );
  }

  const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  const resetDialogState = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropImageSrc(null);
    setUploadError(null);
  };

  const openDialog = () => {
    resetDialogState();
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError("Format tidak didukung. Gunakan PNG, JPG, atau WEBP.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("Ukuran maksimum 2MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setCropImageSrc(objectUrl);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const getCroppedFile = useCallback(async () => {
    if (!cropImageSrc || !croppedAreaPixels) return null;

    const image = await createImage(cropImageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    );

    return new Promise<File | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve(new File([blob], "avatar.jpg", { type: blob.type }));
      }, "image/jpeg", 0.9);
    });
  }, [cropImageSrc, croppedAreaPixels]);

  const handleUpload = async () => {
    if (!cropImageSrc || !croppedAreaPixels) {
      setUploadError("Pilih dan atur gambar terlebih dahulu.");
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);
    try {
      const file = await getCroppedFile();
      if (!file) {
        throw new Error("Gagal memproses gambar.");
      }
      await uploadAvatar(file);
      setUploadSuccess("Foto profil berhasil diperbarui.");
      closeDialog();
    } catch (error) {
      setUploadError((error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const info = [
    { label: "NISN", value: student.nisn },
    { label: "Nama", value: student.nama },
    { label: "Kelas", value: student.class?.class_name ?? String(student.kelas) },
    { label: "Tempat & Tanggal Lahir", value: formatBirthInfo(student.tempat_lahir, student.tanggal_lahir) },
    { label: "Alamat", value: student.alamat },
    { label: "Jenis Kelamin", value: student.jenis_kelamin },
  ];

  return (
    <section className="space-y-6">
      <div className="space-y-4 rounded-sm border border-zinc-100 bg-white/90 p-6 shadow-lg shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-black/30">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
        >
          <span aria-hidden>←</span>Kembali
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Profil</h2>
        </div>

        <div className="flex flex-col gap-4 rounded-sm border border-zinc-100 bg-white/70 p-4 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <Avatar name={student.nama} src={previewUrl} size="lg" />
          <div className="flex-1 space-y-2">
            <button
              type="button"
              onClick={openDialog}
              className="inline-flex items-center justify-center rounded-sm bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              Ubah Foto
            </button>
            {uploadError && (
              <p className="rounded-sm border border-rose-200/40 bg-rose-50/90 px-4 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">{uploadError}</p>
            )}
            {uploadSuccess && (
              <p className="rounded-sm border border-emerald-200/40 bg-emerald-50/90 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">{uploadSuccess}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            setIsSigningOut(true);
            await signOut();
            navigate("/login", { replace: true });
          }}
          disabled={isSigningOut}
          className="inline-flex items-center justify-center rounded-sm border border-zinc-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-500/10 disabled:cursor-not-allowed dark:border-zinc-700 dark:text-rose-300"
        >
          {isSigningOut ? "Keluar..." : "Keluar"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {info.map(({ label, value }) => (
          <article
            key={label}
            className="rounded-sm border border-zinc-100 bg-white/90 p-5 shadow shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-black/20"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className="mt-2 text-lg font-medium text-zinc-950 dark:text-zinc-50">{value || "-"}</p>
          </article>
        ))}
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-sm border border-zinc-200 bg-white/95 p-6 shadow-2xl shadow-black/30 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Ubah Foto Profil</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Pilih gambar lalu atur posisi sebelum menyimpan.</p>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                aria-label="Tutup dialog"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Pilih Gambar</span>
                <input
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  onChange={handleFileChange}
                  className="mt-2 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-sm file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-900 dark:text-zinc-300 dark:file:bg-zinc-800 dark:file:text-zinc-200"
                />
              </label>

              {cropImageSrc ? (
                <div className="relative h-64 w-full overflow-hidden rounded-sm bg-zinc-900/5 dark:bg-zinc-800/50">
                  <Cropper
                    image={cropImageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-sm border border-dashed border-zinc-200 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  Upload gambar untuk memulai pengeditan.
                </div>
              )}

              {cropImageSrc && (
                <label className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                  Zoom
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="flex-1"
                  />
                </label>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="rounded-sm border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!cropImageSrc || !croppedAreaPixels || isUploading}
                  onClick={handleUpload}
                  className="rounded-sm bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-400"
                >
                  {isUploading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const createImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
};
