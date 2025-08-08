
export type Quote = { ticker: string; last: number; asOf: number };
export type PrevClose = { ticker: string; close: number; date: string };
export type SymbolInfo = { ticker: string; name?: string };

export interface Provider {
  name: string;
  getUniverseByADV(minADV: number, days: number, max: number): Promise<SymbolInfo[]>;
  getPreviousClose(ticker: string): Promise<PrevClose>;
  getLastPrice(ticker: string): Promise<Quote>;
}
