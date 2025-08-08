
import { Provider, SymbolInfo, PrevClose, Quote } from './types';
const key = process.env.TWELVEDATA_API_KEY!;
const BASE = 'https://api.twelvedata.com';

async function fetchJson(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('TwelveData error ' + r.status);
  return r.json();
}

async function listUsCommon(limit = 1000): Promise<SymbolInfo[]> {
  const js = await fetchJson(`${BASE}/stocks?exchange=NYSE,NASDAQ&format=JSON&apikey=${key}`);
  const commons = js.data.filter((s: any) => s.type === 'Common Stock');
  return commons.slice(0, limit).map((s: any) => ({ ticker: s.symbol, name: s.name }));
}

async function advForSymbol(ticker: string, days: number): Promise<number | null> {
  const interval = '1day';
  const js = await fetchJson(`${BASE}/time_series?symbol=${ticker}&interval=${interval}&outputsize=${days}&apikey=${key}`);
  const bars = js.values || [];
  if (!bars.length) return null;
  const vols = bars.map((b: any) => Number(b.volume));
  const avg = vols.reduce((a: number, b: number) => a + b, 0) / vols.length;
  return avg;
}

async function getUniverseByADV(minADV: number, days: number, max: number): Promise<SymbolInfo[]> {
  const base = await listUsCommon(1000);
  const acc: { info: SymbolInfo; adv: number }[] = [];
  for (const info of base) {
    if (acc.length >= max) break;
    try {
      const adv = await advForSymbol(info.ticker, days);
      if (adv && adv >= minADV) acc.push({ info, adv });
    } catch {}
  }
  acc.sort((a, b) => b.adv - a.adv);
  return acc.map(x => x.info);
}

async function getPreviousClose(ticker: string): Promise<PrevClose> {
  const js = await fetchJson(`${BASE}/quote?symbol=${ticker}&apikey=${key}`);
  return { ticker, close: Number(js.previous_close), date: js.timestamp };
}

async function getLastPrice(ticker: string): Promise<Quote> {
  const js = await fetchJson(`${BASE}/quote?symbol=${ticker}&apikey=${key}`);
  return { ticker, last: Number(js.price), asOf: Date.now() };
}

export const twelveDataProvider: Provider = {
  name: 'TWELVEDATA',
  getUniverseByADV,
  getPreviousClose,
  getLastPrice
};
