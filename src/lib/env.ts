function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`missing environment variable: ${name}`);
  }

  return value;
}

export function publicSupabaseUrl(): string {
  return required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL");
}

export function serviceSupabaseKey(): string {
  return required(process.env.SUPABASE_SECRET_KEY, "SUPABASE_SECRET_KEY");
}
