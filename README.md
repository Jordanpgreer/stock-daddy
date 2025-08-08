
# Stock Daddy (MVP)

Tracks US-listed common stocks with 90-day ADV ≥ 50M. Alerts on drops ≥ 7% vs previous close and on recovery back to baseline, during regular market hours only. Scans every 10 minutes. Sends alerts to a Discord webhook.

## Quick start

1. **Create Postgres** (Neon or Supabase) and set `DATABASE_URL`.
2. **Create Discord webhook** and set `DISCORD_WEBHOOK`.
3. **Pick provider** via `PROVIDER`. Start with **FINNHUB** or **TWELVEDATA** free key, or **POLYGON** if you have paid.
4. Copy `.env.example` to `.env.local` and fill in keys.
5. Install & run:

```bash
npm i
npx prisma migrate dev --name init
npm run dev
```

### Deploy
- **Vercel**: Add env vars in dashboard; deploy repo.
- **Scheduler**: Use the provided GitHub Actions `scan.yml` and replace your app URL.

### Daily flow
- 08:00 ET: call `POST /api/reset` to rebuild universe (90d ADV ≥ 50M) and seed today's baselines (previous close per ticker).
- 09:30–16:00 ET: every 10 minutes, call `GET /api/scan` to evaluate alerts.
