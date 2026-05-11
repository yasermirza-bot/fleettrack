# FleetTrack — Car Rental Management System

Built for your specific fleet from `turrant_calculation.xlsx`.

## Quick Start

```bash
npm install
npm run dev
# → http://localhost:3000
```

## What's In Here

### Pages
| Route | Description |
|-------|-------------|
| Dashboard | KPIs, revenue trend, compliance alerts, driver overview |
| Drivers | Full CRUD — add/edit/delete, WhatsApp preview |
| Fleet & Cars | All 12 cars with real rego/BHSL expiry dates |
| Bank Statements | CSV upload + auto-parsing (CBA/ANZ/Westpac/NAB) |
| Reconciliation | Match transactions to drivers, manual override |
| Reminders | WhatsApp message queue with preview |
| Reports & ROI | Per-car and portfolio ROI from your actual data |

### Real Data Loaded
- All 12 cars from Fleet sheet (3 personal, 9 rental)
- All 11 current drivers with phone, rego, rent rates
- ROI from Mstr + ROI sheets (Batch 1/2/3)
- 112 weeks of income history from Combined sheet
- Compliance dates: all rego + BHSL expiries

### Urgent Items Flagged
- 833MC3 (Jagsir): Rego expired TODAY
- 064LP3 (Usman): Rego expired 12 days ago
- 942 MU5 (Alam): BHSL expired 27 days ago
- 796KD6 + 464NJ6: BHSL due in 35 days

## CSV Parsing

The parser handles your bank's transaction patterns:
- `FAST TRANSFER FROM [NAME]`
- `PAYID TRANSFER FROM [NAME]`
- `DIRECT CREDIT [NAME]`
- `OSKO PAYMENT [NAME]`
- OptecAus payments

Driver matching is automatic based on name patterns from your transaction history.

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (state)
- Recharts (charts)
- PapaParse (CSV)

## Backend (Phase 2)
See `BACKEND_ARCHITECTURE.md` for the full plan including:
- PostgreSQL schema (Prisma)
- REST API routes
- WhatsApp integration (Twilio / Meta Cloud API)
- Cron jobs for auto-reminders
- Deployment guide (Railway)
