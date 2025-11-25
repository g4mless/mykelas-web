const requireEnv = (value: string | undefined, key: string) => {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const SUPABASE_URL = requireEnv(
  import.meta.env.VITE_SUPABASE_URL,
  "VITE_SUPABASE_URL",
);

export const SUPABASE_ANON_KEY = requireEnv(
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  "VITE_SUPABASE_ANON_KEY",
);

export const KLAS_API_URL = requireEnv(
  import.meta.env.VITE_KLAS_API_URL,
  "VITE_KLAS_API_URL",
);
