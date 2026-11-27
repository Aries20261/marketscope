export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variabel lingkungan ${name} belum diisi.`);
  return v;
}
