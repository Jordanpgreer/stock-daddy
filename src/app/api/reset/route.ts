
import { NextResponse } from 'next/server';
import { DateTime } from 'luxon';
import { prisma } from '@/lib/db';
import { rebuildUniverse, seedDailyStates } from '@/lib/universe';

export const runtime = 'nodejs';

export async function POST() {
  const todayEt = DateTime.now().setZone('America/New_York').startOf('day');
  const yesterday = todayEt.minus({ days: 1 }).toJSDate();

  await prisma.dailyState.updateMany({ where: { date: yesterday }, data: { status: 'done' } });

  const tickers = await rebuildUniverse();
  await seedDailyStates(todayEt.toJSDate());

  return NextResponse.json({ ok: true, tickers });
}
