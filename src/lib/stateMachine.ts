
import { prisma } from './db';
import { sendDiscordAlert } from './alerts';

const DROP_TH = -0.07; // -7%

function pctFrom(ref: number, last: number) {
  return (last - ref) / ref;
}

export async function ensureDailyState(ticker: string, referenceClose: number, date: Date) {
  const ds = await prisma.dailyState.upsert({
    where: { date_ticker: { date, ticker } },
    create: { date, ticker, referenceClose },
    update: { referenceClose }
  });
  return ds;
}

export async function processTick(ticker: string, last: number, referenceClose: number, date: Date) {
  const ds = await prisma.dailyState.findUnique({ where: { date_ticker: { date, ticker } } });
  if (!ds) return;
  const pct = pctFrom(referenceClose, last);

  if (ds.status === 'idle' && pct <= DROP_TH) {
    await prisma.dailyState.update({
      where: { id: ds.id },
      data: { status: 'dropped', dropAt: new Date(), dropPrice: last }
    });
    await prisma.alert.create({ data: { ticker, kind: 'drop', price: last, pct } });
    await sendDiscordAlert(`🟥 DROP: ${ticker} is ${(pct * 100).toFixed(2)}% vs prev close. Last ${last.toFixed(2)}.`, {
      title: 'Drop alert',
      description: 'Triggered at or below -7% vs previous close.',
      fields: [
        { name: 'Ticker', value: ticker, inline: true },
        { name: 'Last', value: last.toFixed(2), inline: true },
        { name: 'Change %', value: (pct * 100).toFixed(2) + '%', inline: true }
      ],
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (ds.status === 'dropped' && last >= referenceClose) {
    await prisma.dailyState.update({
      where: { id: ds.id },
      data: { status: 'recovered', recoverAt: new Date(), recoverPrice: last }
    });
    const recPct = pctFrom(referenceClose, last);
    await prisma.alert.create({ data: { ticker, kind: 'recovery', price: last, pct: recPct } });
    await sendDiscordAlert(`🟩 RECOVERY: ${ticker} back to baseline or higher. Last ${last.toFixed(2)}.`, {
      title: 'Recovery alert',
      description: 'Price returned to previous close after a -7% drop alert.',
      fields: [
        { name: 'Ticker', value: ticker, inline: true },
        { name: 'Last', value: last.toFixed(2), inline: true },
        { name: 'Change %', value: (recPct * 100).toFixed(2) + '%', inline: true }
      ],
      timestamp: new Date().toISOString()
    });
  }
}
