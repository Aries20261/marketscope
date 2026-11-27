'use client';

export default function PrintButton({ label = 'Unduh PDF' }: { label?: string }) {
  return (
    <button type="button" className="btn primary noprint" onClick={() => window.print()}>
      {label}
    </button>
  );
}
