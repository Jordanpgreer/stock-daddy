
import { Provider } from './types';
import { finnhubProvider } from './finnhub';
import { twelveDataProvider } from './twelvedata';
import { polygonProvider } from './polygon';

export function getProvider(): Provider {
  const sel = process.env.PROVIDER || 'FINNHUB';
  if (sel === 'TWELVEDATA') return twelveDataProvider;
  if (sel === 'POLYGON') return polygonProvider;
  return finnhubProvider;
}
