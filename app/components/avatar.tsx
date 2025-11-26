"use client";

const palette = [
  "bg-gradient-to-br from-sky-400 to-blue-600",
  "bg-gradient-to-br from-purple-400 to-indigo-600",
  "bg-gradient-to-br from-emerald-400 to-teal-600",
  "bg-gradient-to-br from-rose-400 to-pink-600",
];

const getInitials = (name: string) => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .padEnd(2, "");
};

export function Avatar({ name }: { name: string }) {
  const initials = getInitials(name || "Siswa");
  const colorClass = palette[name.length % palette.length];

  return (
    <div
      aria-hidden
      className={`${colorClass} flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white shadow-inner`}
    >
      {initials || "S"}
    </div>
  );
}
