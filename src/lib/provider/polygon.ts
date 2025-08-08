
import { Provider, SymbolInfo, PrevClose, Quote } from './types';
const key = process.env.POLYGON_API_KEY!;
const BASE = 'https://api.polygon.io';

async function fetchJson(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('Polygon error ' + r.status);
  return r.json();
}

async function getUniverseByADV(minADV: number, days: number, max: number): Promise<SymbolInfo[]> {
  const syms = await fetchJson(`${BASE}/v3/reference/tickers?market=stocks&type=CS&active=true&limit=1000&apiKey=${key}`);
  const list = syms.results.map((s: any) => ({ ticker: s.ticker, name: s.name }));
  const acc: { info: SymbolInfo; adv: number }[] = [];
  for (const info of list) {
    if (acc.length >= max) break;
    try {
      const end = new Date();
      const start = new Date(end.getTime() - (days + 5) * 24 * 60 * 60 * 1000);
      const s = start.toISOString().slice(0, 10);
      const e = end.toISOString().slice(0, 10);
      const url = `${BASE}/v2/aggs/ticker/${info.ticker}/range/1/day/${s}/${e}?adjusted=true&apiKey=${key}`;
      const js = await fetchJson(url);
      const vols = (js.results || []).map((b: any) => b.v);
      if (!vols.length) continue;
      const lastN = vols.slice(-days);
      const avg = lastN.reduce((a: number, b: number) => a + b, 0) / lastN.length;
      if (avg >= minADV) acc.push({ info, adv: avg });
    } catch {}
  }
  acc.sort((a, b) => b.adv - a.adv);
  return acc.map(x => x.info);
}

async function getPreviousClose(ticker: string): Promise<PrevClose> {
  const js = await fetchJson(`${BASE}/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${key}`);
  const res = js.results?.[0];
  return { ticker, close: res?.c ?? 0, date: res?.t ? new Date(res.t).toISOString() : '' };
}

async function getLastPrice(ticker: string): Promise<Quote> {
  const js = await fetchJson(`${BASE}/v2/last/trade/${ticker}?apiKey=${key}`);
  const p = js.results?.p ?? 0;
  return { ticker, last: p, asOf: Date.now() };
}

export const polygonProvider: Provider = {
  name: 'POLYGON',
  getUniverseByADV,
  getPreviousClose,
  getLastPrice
};
