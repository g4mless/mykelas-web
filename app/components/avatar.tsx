"use client";

const palette = [
  "bg-gradient-to-br from-sky-400 to-blue-600",
  "bg-gradient-to-br from-purple-400 to-indigo-600",
  "bg-gradient-to-br from-emerald-400 to-teal-600",
  "bg-gradient-to-br from-rose-400 to-pink-600",
];

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-xl",
} as const;

const getInitials = (name: string) => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .padEnd(2, "");
};

export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizeClasses;
}) {
  const initials = getInitials(name || "Siswa");
  const colorClass = palette[name.length % palette.length];
  const sizeClass = sizeClasses[size] ?? sizeClasses.md;

  if (src) {
    return (
      <img
        src={src}
        alt={`Foto ${name}`}
        className={`rounded-full object-cover ${sizeClass}`}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`${colorClass} flex items-center justify-center rounded-full font-semibold text-white shadow-inner ${sizeClass}`}
    >
      {initials || "S"}
    </div>
  );
}
