
import { NextResponse } from 'next/server';
import { DateTime } from 'luxon';
import { prisma } from '@/lib/db';
import { isRegularSessionNow } from '@/lib/marketHours';
import { getProvider } from '@/lib/provider';
import { processTick, ensureDailyState } from '@/lib/stateMachine';

export const runtime = 'nodejs';

export async function GET() {
  const nowEt = DateTime.now().setZone('America/New_York');
  if (!isRegularSessionNow(nowEt)) {
    return NextResponse.json({ ok: true, skipped: 'outside market hours', ts: nowEt.toISO() });
  }

  const p = getProvider();
  const today = nowEt.startOf('day').toJSDate();
  const actives = await prisma.symbol.findMany({ where: { active: true }, select: { ticker: true } });

  let processed = 0;
  for (const { ticker } of actives) {
    try {
      const ds = await prisma.dailyState.findUnique({ where: { date_ticker: { date: today, ticker } } });
      if (!ds) continue;
      const q = await p.getLastPrice(ticker);
      await ensureDailyState(ticker, ds.referenceClose, today);
      await processTick(ticker, q.last, ds.referenceClose, today);
      processed++;
    } catch (e) {}
  }

  return NextResponse.json({ ok: true, provider: p.name, processed, ts: nowEt.toISO() });
}
