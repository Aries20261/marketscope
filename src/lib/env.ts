export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variabel lingkungan ${name} belum diisi.`);
  return v;
}

/** Token API dari env, dibersihkan dari salah-salin umum: spasi/baris baru, tanda kutip, awalan "Bearer " atau "NAMA=". */
export function requireToken(name: string): string {
  let v = requireEnv(name).trim();
  v = v.replace(new RegExp(`^${name}\\s*=\\s*`), '').trim();
  v = v.replace(/^bearer\s+/i, '').trim();
  v = v.replace(/^["'`]+|["'`]+$/g, '').trim();
  if (!v) throw new Error(`Variabel lingkungan ${name} belum diisi.`);
  return v;
}
