# FleetTrack — Backend Architecture

> Phase 2 implementation plan. Frontend (Phase 1) is complete with mock/local state.

---

## Recommended Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| API | Node.js + Express or Fastify | Lightweight, TypeScript-native |
| Database | PostgreSQL | Relational, ideal for payment/reconciliation queries |
| ORM | Prisma | Type-safe, great Next.js integration |
| Auth | NextAuth.js + JWT | Simple single-owner auth |
| File Storage | AWS S3 or Cloudflare R2 | CSV statement storage |
| WhatsApp | Twilio or Meta Cloud API | Automated reminders |
| Hosting | Railway / Render / Fly.io | Simple PostgreSQL + Node hosting |
| Cron | node-cron or Vercel cron | Weekly reminders, compliance checks |

---

## Database Schema (PostgreSQL / Prisma)

```prisma
model Driver {
  id            String    @id @default(cuid())
  name          String
  phone         String
  currentRego   String
  weeklyRent    Decimal
  startDate     DateTime
  isActive      Boolean   @default(true)
  notes         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  payments      Payment[]
  carHistory    DriverCarHistory[]
  reminders     Reminder[]
}

model Car {
  id              String    @id @default(cuid())
  rego            String    @unique
  make            String
  model           String
  year            Int
  colour          String
  regoExpiry      DateTime
  bhslExpiry      DateTime?
  bhslNumber      String?
  ctpClass        Int       @default(4)
  weeklyRent      Decimal
  assignedDriverId String?
  batch           Int?
  isPersonal      Boolean   @default(false)
  purchasePrice   Decimal?
  createdAt       DateTime  @default(now())

  driver          Driver?   @relation(fields: [assignedDriverId], references: [id])
  payments        Payment[]
  carHistory      DriverCarHistory[]
}

model Payment {
  id              String    @id @default(cuid())
  driverId        String
  carId           String
  transactionId   String?
  amount          Decimal
  expectedAmount  Decimal
  dueDate         DateTime
  paidDate        DateTime?
  weekNumber      Int
  year            Int
  status          PaymentStatus @default(PENDING)
  notes           String?
  createdAt       DateTime  @default(now())

  driver          Driver    @relation(fields: [driverId], references: [id])
  car             Car       @relation(fields: [carId], references: [id])
  transaction     BankTransaction? @relation(fields: [transactionId], references: [id])
  deductions      PaymentDeduction[]
}

model PaymentDeduction {
  id          String  @id @default(cuid())
  paymentId   String
  type        DeductionType
  amount      Decimal
  description String
  payment     Payment @relation(fields: [paymentId], references: [id])
}

model BankTransaction {
  id              String    @id @default(cuid())
  uploadBatchId   String
  date            DateTime
  description     String
  reference       String?
  amount          Decimal
  balance         Decimal?
  matchStatus     MatchStatus @default(UNMATCHED)
  matchedDriverId String?
  isManualOverride Boolean  @default(false)
  paymentMethod   PaymentMethod @default(UNKNOWN)
  createdAt       DateTime  @default(now())

  uploadBatch     UploadBatch @relation(fields: [uploadBatchId], references: [id])
  payment         Payment[]
}

model UploadBatch {
  id              String    @id @default(cuid())
  filename        String
  s3Key           String?
  uploadedAt      DateTime  @default(now())
  rowCount        Int
  dateRangeStart  DateTime
  dateRangeEnd    DateTime
  matchedCount    Int       @default(0)
  unmatchedCount  Int       @default(0)
  totalCredits    Decimal   @default(0)

  transactions    BankTransaction[]
}

model DriverCarHistory {
  id          String    @id @default(cuid())
  driverId    String
  carId       String
  startDate   DateTime
  endDate     DateTime?
  weeklyRent  Decimal
  driver      Driver    @relation(fields: [driverId], references: [id])
  car         Car       @relation(fields: [carId], references: [id])
}

model Reminder {
  id          String    @id @default(cuid())
  driverId    String
  type        ReminderType
  messageBody String
  status      ReminderStatus @default(PENDING)
  sentAt      DateTime?
  createdAt   DateTime  @default(now())
  driver      Driver    @relation(fields: [driverId], references: [id])
}

enum PaymentStatus   { PAID PARTIAL OVERDUE PENDING VACANT }
enum MatchStatus     { MATCHED PARTIAL UNMATCHED MANUAL }
enum PaymentMethod   { FAST_TRANSFER PAYID DIRECT_CREDIT OPTEC CASH UNKNOWN }
enum DeductionType   { SERVICE TYRE REGO BHSL INSURANCE REPAIR OTHER }
enum ReminderType    { RENT_DUE OVERDUE COMPLIANCE CUSTOM }
enum ReminderStatus  { PENDING SENT FAILED }
```

---

## API Routes

### Drivers
```
GET    /api/drivers              List all drivers
POST   /api/drivers              Create driver
GET    /api/drivers/:id          Get driver + payment history
PATCH  /api/drivers/:id          Update driver
DELETE /api/drivers/:id          Deactivate driver
GET    /api/drivers/:id/payments Payment history
```

### Cars
```
GET    /api/cars                 List all cars
POST   /api/cars                 Add car
PATCH  /api/cars/:id             Update car
GET    /api/cars/compliance      Cars with expiring rego/BHSL (< 60 days)
```

### Payments / Reconciliation
```
GET    /api/payments             List payments (filterable by week/year/status)
POST   /api/payments             Create manual payment record
PATCH  /api/payments/:id         Update payment (mark paid, add note)
GET    /api/reconciliation/week  Reconciliation for a given week
POST   /api/reconciliation/run   Re-run auto-matching for a batch
```

### Bank Statements
```
POST   /api/statements/upload    Upload CSV (multipart), returns batch ID
GET    /api/statements           List upload batches
GET    /api/statements/:batchId/transactions  Transactions in batch
PATCH  /api/transactions/:id     Override match status / assign driver
```

### Reminders
```
GET    /api/reminders            List pending reminders
POST   /api/reminders/send       Send single reminder via WhatsApp
POST   /api/reminders/send-all   Send all pending reminders
```

### Reports
```
GET    /api/reports/weekly       Weekly income summary
GET    /api/reports/monthly      Monthly income
GET    /api/reports/roi          Per-car ROI (from CAR_ROI seed or DB)
GET    /api/reports/outstanding  Current outstanding payments
```

---

## WhatsApp Integration

### Option A — Twilio WhatsApp API (Recommended)
```
npm install twilio

POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages
Body: To=whatsapp:+61412345678
      From=whatsapp:+14155238886  (Twilio sandbox / approved number)
      Body=Hi Lakhveer...
```

### Option B — Meta WhatsApp Cloud API (Free tier)
```
POST https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {ACCESS_TOKEN}
{
  "messaging_product": "whatsapp",
  "to": "61412345678",
  "type": "text",
  "text": { "body": "Hi Lakhveer..." }
}
```

**Webhook for delivery receipts:**
```
POST /api/webhooks/whatsapp
→ Update reminder.status = SENT | FAILED
```

---

## Auto-reminder Cron Jobs

```typescript
// Run every Monday at 7am AEST
cron.schedule('0 7 * * 1', async () => {
  const overdueDrivers = await prisma.driver.findMany({
    where: { isActive: true, payments: { some: { status: 'OVERDUE' } } }
  });
  for (const driver of overdueDrivers) {
    await sendWhatsAppReminder(driver);
  }
});

// Compliance check — run daily
cron.schedule('0 9 * * *', async () => {
  const expiring = await prisma.car.findMany({
    where: {
      OR: [
        { regoExpiry: { lte: addDays(new Date(), 45) } },
        { bhslExpiry: { lte: addDays(new Date(), 45) } },
      ]
    }
  });
  // Send alert to owner (email or WhatsApp)
});
```

---

## Authentication

- Single-owner app: simple email + password via NextAuth.js
- JWT stored in HttpOnly cookie
- All `/api/*` routes protected by middleware
- Future: multi-owner with role-based access (owner / bookkeeper)

---

## Environment Variables (.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/fleettrack
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-app.com

# WhatsApp (choose one)
TWILIO_SID=ACxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# or Meta
META_WA_TOKEN=EAAxxxxxxx
META_PHONE_NUMBER_ID=xxxxxxx

# File storage
AWS_S3_BUCKET=fleettrack-statements
AWS_ACCESS_KEY_ID=xxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxx
```

---

## Deployment

```
Railway.app (recommended):
  → PostgreSQL plugin included
  → Auto-deploy from GitHub
  → $5/month for hobby

Vercel (frontend) + Railway (API + DB)
```
