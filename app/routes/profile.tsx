"use client";

import type { Route } from "./+types/profile";
import { useStudent } from "../providers/student-provider";

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
  const { student } = useStudent();

  if (!student) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow-sm text-center text-slate-500">
        Data siswa belum tersedia.
      </div>
    );
  }

  const info = [
    { label: "NISN", value: student.nisn },
    { label: "Nama", value: student.nama },
    { label: "Kelas", value: String(student.kelas) },
    { label: "TTL", value: formatBirthInfo(student.tempat_lahir, student.tanggal_lahir) },
    { label: "Alamat", value: student.alamat },
    { label: "Jenis Kelamin", value: student.jenis_kelamin },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Profil</h2>
        <p className="mt-2 text-sm text-slate-500">
          Informasi pribadi yang diambil dari database Klas.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {info.map(({ label, value }) => (
          <article key={label} className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
            <p className="mt-2 text-lg font-medium text-slate-900">{value || "-"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
