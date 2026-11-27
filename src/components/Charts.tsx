import { rpShort, type Bar, type MonthlySales } from '@/lib/riset-calc';

/** Batang horizontal berbasis HTML: ikut tercetak ke PDF dan terbaca pembaca layar. */
export function HBars({ rows, format = rpShort, emptyText = 'Belum ada data.' }: {
  rows: Bar[]; format?: (n: number) => string; emptyText?: string;
}) {
  if (!rows.length) return <p className="small">{emptyText}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="hbars" aria-label="Diagram batang">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="hb-label" title={r.label}>
            <span>{r.label}</span>
            {r.sub ? <small>{r.sub}</small> : null}
          </div>
          <div className="hb-track"><div className="hb-fill" style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} /></div>
          <div className="hb-val mono">{format(r.value)}</div>
        </li>
      ))}
    </ul>
  );
}

/** Histogram kolom sederhana (SVG). */
export function Columns({ rows }: { rows: Bar[] }) {
  const W = 560, H = 190, p = { l: 8, r: 8, t: 20, b: 28 };
  const max = Math.max(...rows.map((r) => r.value), 1);
  const bw = (W - p.l - p.r) / rows.length;
  const top = rows.reduce((a, r, i) => (r.value > rows[a].value ? i : a), 0);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" className="chartsvg"
      aria-label={`Distribusi harga: ${rows.map((r) => `${r.label} ${r.value} produk`).join(', ')}`}>
      {rows.map((r, i) => {
        const h = (r.value / max) * (H - p.t - p.b);
        const x = p.l + i * bw + 4;
        return (
          <g key={r.label}>
            <rect x={x} y={H - p.b - h} width={bw - 8} height={h} rx={4} fill="var(--accent)" opacity={i === top ? 1 : 0.45}><title>{`${r.label}: ${r.value} produk`}</title></rect>
            <text x={x + (bw - 8) / 2} y={H - p.b - h - 5} textAnchor="middle" fontWeight={i === top ? 700 : 400}>{r.value}</text>
            <text x={x + (bw - 8) / 2} y={H - 9} textAnchor="middle">{r.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Garis penjualan bulanan (unit). */
export function MonthlyLine({ data }: { data: MonthlySales[] }) {
  const W = 560, H = 200, p = { l: 52, r: 16, t: 14, b: 28 };
  const max = Math.max(...data.map((d) => d.unit), 1);
  const x = (i: number) => data.length === 1 ? (W + p.l - p.r) / 2 : p.l + (i * (W - p.l - p.r)) / (data.length - 1);
  const y = (v: number) => p.t + (1 - v / max) * (H - p.t - p.b);
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d.unit).toFixed(1)}`).join('');
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" className="chartsvg"
      aria-label={`Penjualan bulanan: ${data.map((d) => `${d.bulan} ${d.unit} unit`).join(', ')}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={p.l} x2={W - p.r} y1={y(t)} y2={y(t)} stroke="var(--line)" />
          <text x={p.l - 6} y={y(t) + 4} textAnchor="end">{t}</text>
        </g>
      ))}
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={d.bulan}>
          <circle cx={x(i)} cy={y(d.unit)} r={4.5} fill="var(--accent)" stroke="#fff" strokeWidth={2}><title>{`${d.bulan}: ${d.unit} unit`}</title></circle>
          <text x={x(i)} y={H - 9} textAnchor="middle">{d.bulan}</text>
        </g>
      ))}
    </svg>
  );
}
