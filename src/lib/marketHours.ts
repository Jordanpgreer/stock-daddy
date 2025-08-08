
import { DateTime } from 'luxon';

export function isRegularSessionNow(now = DateTime.now().setZone('America/New_York')): boolean {
  if (now.weekday === 6 || now.weekday === 7) return false;
  const open = now.set({ hour: 9, minute: 30, second: 0, millisecond: 0 });
  const close = now.set({ hour: 16, minute: 0, second: 0, millisecond: 0 });
  return now >= open && now <= close;
}

export function todayEt(now = DateTime.now().setZone('America/New_York')): string {
  return now.toFormat('yyyy-LL-dd');
}
