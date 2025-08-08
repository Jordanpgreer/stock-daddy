
import { prisma } from './db';
import { getProvider } from './provider';

const ADV_DAYS = Number(process.env.ADV_WINDOW_DAYS || 90);
const ADV_MIN = Number(process.env.ADV_MIN_SHARES || 50000000);
const MAX_UNIVERSE = Number(process.env.MAX_UNIVERSE || 200);

export async function rebuildUniverse() {
  const p = getProvider();
  const syms = await p.getUniverseByADV(ADV_MIN, ADV_DAYS, MAX_UNIVERSE);
  for (const s of syms) {
    await prisma.symbol.upsert({
      where: { ticker: s.ticker },
      create: { id: s.ticker, ticker: s.ticker, name: s.name || null, active: true },
      update: { name: s.name || null, active: true }
    });
  }
  await prisma.symbol.updateMany({ where: { ticker: { notIn: syms.map(s => s.ticker) } }, data: { active: false } });
  return syms.map(s => s.ticker);
}

export async function seedDailyStates(date: Date) {
  const p = getProvider();
  const active = await prisma.symbol.findMany({ where: { active: true }, select: { ticker: true } });
  for (const { ticker } of active) {
    const prev = await p.getPreviousClose(ticker);
    await prisma.dailyState.upsert({
      where: { date_ticker: { date, ticker } },
      create: { date, ticker, referenceClose: prev.close },
      update: { referenceClose: prev.close }
    });
  }
}
