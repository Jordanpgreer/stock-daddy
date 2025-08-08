
'use client';
import { useEffect, useState } from 'react';

type Row = { ticker: string; status: string; referenceClose: number; last?: number; pct?: number; updated?: string };

export default function Dashboard() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    async function load() {
      const r = await fetch('/api/health');
      if (!r.ok) return;
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Stock Daddy</h1>
      <p className="text-sm text-neutral-400">Universe: US common stocks, 90d ADV ≥ 50M. Scans every 10m during regular hours. Alerts to Discord.</p>
      <div className="rounded-xl border border-neutral-800 p-4">Dashboard coming soon… alerts will flow to your Discord.</div>
    </div>
  );
}
