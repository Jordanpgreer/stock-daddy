
import { Provider, SymbolInfo, PrevClose, Quote } from './types';

const key = process.env.FINNHUB_API_KEY!;
const BASE = 'https://finnhub.io/api/v1';

async function fetchJson(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('Finnhub error: ' + r.status);
  return r.json();
}

async function listUsCommon(limit = 1000): Promise<SymbolInfo[]> {
  const data = await fetchJson(`${BASE}/stock/symbol?exchange=US&token=${key}`);
  const commons = data.filter((s: any) => s.type === 'Common Stock');
  return commons.slice(0, limit).map((s: any) => ({ ticker: s.symbol, name: s.description }));
}

async function advForSymbol(ticker: string, days: number): Promise<number | null> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 86400 * (days + 5);
  const url = `${BASE}/stock/candle?symbol=${ticker}&resolution=D&from=${from}&to=${to}&token=${key}`;
  const js = await fetchJson(url);
  if (js.s !== 'ok') return null;
  const vols: number[] = js.v;
  if (!vols || vols.length === 0) return null;
  const lastN = vols.slice(-days);
  const avg = lastN.reduce((a: number, b: number) => a + b, 0) / lastN.length;
  return avg;
}

async function getUniverseByADV(minADV: number, days: number, max: number): Promise<SymbolInfo[]> {
  const base = await listUsCommon(1500);
  const results: { info: SymbolInfo; adv: number }[] = [];
  for (const info of base) {
    if (results.length >= max) break;
    try {
      const adv = await advForSymbol(info.ticker, days);
      if (adv && adv >= minADV) results.push({ info, adv });
    } catch {}
  }
  results.sort((a, b) => b.adv - a.adv);
  return results.map(r => r.info);
}

async function getPreviousClose(ticker: string): Promise<PrevClose> {
  const url = `${BASE}/quote?symbol=${ticker}&token=${key}`;
  const js = await fetchJson(url);
  return { ticker, close: js.pc, date: '' };
}

async function getLastPrice(ticker: string): Promise<Quote> {
  const url = `${BASE}/quote?symbol=${ticker}&token=${key}`;
  const js = await fetchJson(url);
  return { ticker, last: js.c, asOf: Date.now() };
}

export const finnhubProvider: Provider = {
  name: 'FINNHUB',
  getUniverseByADV,
  getPreviousClose,
  getLastPrice
};
