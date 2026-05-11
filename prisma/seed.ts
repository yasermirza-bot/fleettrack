import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: "postgresql://postgres.aiqcpbqqvfproxgdzxkp:Kitno@4608888@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('Seeding fleet data...');

  // Clear existing data
  await prisma.reminder.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bankTransaction.deleteMany();
  await prisma.uploadBatch.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.car.deleteMany();

  // ── Seed Cars ──────────────────────────────────────────────────────────────
  await prisma.car.createMany({
    data: [
      {
        rego: '707XXF',
        make: 'Toyota', model: 'Camry', year: 2018, colour: 'Red',
        regoExpiry: new Date('2026-06-19'),
        bhslExpiry: new Date('2027-02-04'),
        bhslNumber: '243700',
        ctpClass: 4, weeklyRent: 330, batch: 1,
        regoStatus: 'ok', bhslStatus: 'ok',
      },
      {
        rego: '947ZWE',
        make: 'Toyota', model: 'Camry', year: 2020, colour: 'Silver',
        regoExpiry: new Date('2026-07-28'),
        bhslExpiry: new Date('2027-03-17'),
        bhslNumber: '243247',
        ctpClass: 4, weeklyRent: 340, batch: 1,
        regoStatus: 'ok', bhslStatus: 'ok',
      },
      {
        rego: '796KD6',
        make: 'Toyota', model: 'Camry', year: 2017, colour: 'White',
        regoExpiry: new Date('2026-08-21'),
        bhslExpiry: new Date('2026-06-15'),
        bhslNumber: '253652',
        ctpClass: 4, weeklyRent: 290, batch: 2,
        regoStatus: 'ok', bhslStatus: 'warning',
      },
      {
        rego: '754KJ2',
        make: 'Toyota', model: 'Corolla', year: 2021, colour: 'White',
        regoExpiry: new Date('2026-06-18'),
        bhslExpiry: new Date('2026-07-08'),
        bhslNumber: '252466',
        ctpClass: 4, weeklyRent: 270, batch: 2,
        regoStatus: 'ok', bhslStatus: 'ok',
      },
      {
        rego: '725KW9',
        make: 'Toyota', model: 'Camry', year: 2018, colour: 'White',
        regoExpiry: new Date('2026-08-27'),
        bhslExpiry: new Date('2026-08-29'),
        bhslNumber: '258819',
        ctpClass: 4, weeklyRent: 320, batch: 2,
        regoStatus: 'ok', bhslStatus: 'ok',
      },
      {
        rego: '833MC3',
        make: 'Toyota', model: 'Camry', year: 2018, colour: 'White',
        regoExpiry: new Date('2026-05-11'),
        bhslExpiry: new Date('2026-08-29'),
        bhslNumber: '258820',
        ctpClass: 4, weeklyRent: 320, batch: 2,
        regoStatus: 'due_today', bhslStatus: 'ok',
      },
      {
        rego: '723KW9',
        make: 'Toyota', model: 'Camry', year: 2019, colour: 'White',
        regoExpiry: new Date('2026-08-27'),
        bhslExpiry: new Date('2026-08-29'),
        bhslNumber: '258695',
        ctpClass: 4, weeklyRent: 330, batch: 2,
        regoStatus: 'ok', bhslStatus: 'ok',
      },
      {
        rego: '122OG6',
        make: 'Toyota', model: 'Camry', year: 2020, colour: 'White',
        regoExpiry: new Date('2026-09-10'),
        bhslExpiry: new Date('2026-09-10'),
        bhslNumber: '260158',
        ctpClass: 4, weeklyRent: 340, batch: 3,
        regoStatus: 'ok', bhslStatus: 'ok',
      },
      {
        rego: '123OG6',
        make: 'Toyota', model: 'Camry', year: 2021, colour: 'White',
        regoExpiry: new Date('2026-09-11'),
        bhslExpiry: new Date('2026-09-15'),
        bhslNumber: '260082',
        ctpClass: 4, weeklyRent: 340, batch: 3,
        regoStatus: 'ok', bhslStatus: 'ok',
      },
      {
        rego: '064LP3',
        make: 'Toyota', model: 'Camry', year: 2019, colour: 'Blue',
        regoExpiry: new Date('2026-04-29'),
        bhslExpiry: new Date('2026-11-13'),
        bhslNumber: '265324',
        ctpClass: 4, weeklyRent: 330, batch: 3,
        regoStatus: 'expired', bhslStatus: 'ok',
      },
      {
        rego: '942MU5',
        make: 'Toyota', model: 'Camry', year: 2021, colour: 'White',
        regoExpiry: new Date('2026-10-10'),
        bhslExpiry: new Date('2026-04-14'),
        bhslNumber: '248816',
        ctpClass: 4, weeklyRent: 340, batch: 3,
        regoStatus: 'ok', bhslStatus: 'expired',
      },
      {
        rego: '464NJ6',
        make: 'Toyota', model: 'Camry', year: 2020, colour: 'White',
        regoExpiry: new Date('2026-06-12'),
        bhslExpiry: new Date('2026-06-15'),
        bhslNumber: '253459',
        ctpClass: 4, weeklyRent: 340, batch: 3,
        regoStatus: 'ok', bhslStatus: 'warning',
      },
      {
        rego: '795EU6',
        make: 'Toyota', model: 'Land Cruiser', year: 2007, colour: 'White',
        regoExpiry: new Date('2026-07-07'),
        ctpClass: 1, weeklyRent: 0,
        isPersonal: true,
        regoStatus: 'ok', bhslStatus: 'ok',
      },
      {
        rego: '773LP3',
        make: 'Hummer', model: 'H2', year: 2008, colour: 'Silver',
        regoExpiry: new Date('2026-08-06'),
        ctpClass: 1, weeklyRent: 0,
        isPersonal: true,
        regoStatus: 'ok', bhslStatus: 'ok',
      },
      {
        rego: '105LV2',
        make: 'Mazda', model: 'CX-9', year: 2017, colour: 'White',
        regoExpiry: new Date('2026-08-27'),
        ctpClass: 1, weeklyRent: 0,
        isPersonal: true,
        regoStatus: 'ok', bhslStatus: 'ok',
      },
    ],
  });

  // ── Seed Drivers ───────────────────────────────────────────────────────────
  await prisma.driver.createMany({
    data: [
      {
        name: 'Sami',
        phone: '+61400000001',
        currentRego: '707XXF',
        weeklyRent: 325,
        startDate: new Date('2024-03-01'),
        paymentStatus: 'paid',
        lastPaymentDate: new Date('2026-05-07'),
        lastPaymentAmount: 325,
        amountOwed: 0,
        notes: 'Red Camry. Reliable payer. Pays via Fast Transfer.',
      },
      {
        name: 'Beant Singh',
        phone: '+61400000002',
        currentRego: '947ZWE',
        weeklyRent: 295,
        startDate: new Date('2024-07-01'),
        paymentStatus: 'paid',
        lastPaymentDate: new Date('2026-05-06'),
        lastPaymentAmount: 295,
        amountOwed: 0,
        notes: 'Silver Camry. Bond $590 paid. Pays via PayID.',
      },
      {
        name: 'Hammad',
        phone: '+61400000003',
        currentRego: '796KD6',
        weeklyRent: 280,
        startDate: new Date('2024-01-15'),
        paymentStatus: 'overdue',
        lastPaymentDate: new Date('2026-04-28'),
        lastPaymentAmount: 280,
        amountOwed: 560,
        notes: 'Lowest collection rate (78.5%). BHSL due 15 Jun. Frequently pays late.',
      },
      {
        name: 'Zohaib',
        phone: '+61400000004',
        currentRego: '754KJ2',
        weeklyRent: 280,
        startDate: new Date('2024-02-01'),
        paymentStatus: 'paid',
        lastPaymentDate: new Date('2026-05-08'),
        lastPaymentAmount: 280,
        amountOwed: 0,
        notes: 'Corolla. Bond $560. Pays via OptecAus and PayID.',
      },
      {
        name: 'Lakhveer Dhaliwal',
        phone: '+61400000005',
        currentRego: '725KW9',
        weeklyRent: 320,
        startDate: new Date('2024-05-01'),
        paymentStatus: 'paid',
        lastPaymentDate: new Date('2026-05-05'),
        lastPaymentAmount: 320,
        amountOwed: 0,
        notes: 'Pays Fast Transfer. Previously on 464NJ6.',
      },
      {
        name: 'Jagsir',
        phone: '+61400000006',
        currentRego: '833MC3',
        weeklyRent: 325,
        startDate: new Date('2024-03-15'),
        paymentStatus: 'partial',
        lastPaymentDate: new Date('2026-05-04'),
        lastPaymentAmount: 205,
        amountOwed: 120,
        notes: 'Car rego due TODAY. Paid partial this week. BHSL due 15 Jun.',
      },
      {
        name: 'Davindar',
        phone: '+61400000007',
        currentRego: '723KW9',
        weeklyRent: 325,
        startDate: new Date('2024-04-01'),
        paymentStatus: 'paid',
        lastPaymentDate: new Date('2026-05-09'),
        lastPaymentAmount: 325,
        amountOwed: 0,
        notes: 'Reliable. Pays via Optec.',
      },
      {
        name: 'Aqueel',
        phone: '+61400000008',
        currentRego: '122OG6',
        weeklyRent: 340,
        startDate: new Date('2025-01-06'),
        paymentStatus: 'paid',
        lastPaymentDate: new Date('2026-05-06'),
        lastPaymentAmount: 340,
        amountOwed: 0,
        notes: 'Bond paid. Collection rate 100.9%.',
      },
      {
        name: 'Usman',
        phone: '+61400000009',
        currentRego: '064LP3',
        weeklyRent: 325,
        startDate: new Date('2024-06-01'),
        paymentStatus: 'paid',
        lastPaymentDate: new Date('2026-05-07'),
        lastPaymentAmount: 325,
        amountOwed: 0,
        notes: 'Blue Camry. REGO EXPIRED 29 Apr 2026 — action needed.',
      },
      {
        name: 'Alam',
        phone: '+61400000010',
        currentRego: '942MU5',
        weeklyRent: 340,
        startDate: new Date('2025-07-01'),
        paymentStatus: 'paid',
        lastPaymentDate: new Date('2026-05-05'),
        lastPaymentAmount: 340,
        amountOwed: 0,
        notes: 'BHSL EXPIRED 14 Apr 2026 — rideshare accreditation at risk.',
      },
      {
        name: 'Karan',
        phone: '+61400000011',
        currentRego: '464NJ6',
        weeklyRent: 300,
        startDate: new Date('2025-10-01'),
        paymentStatus: 'paid',
        lastPaymentDate: new Date('2026-05-08'),
        lastPaymentAmount: 300,
        amountOwed: 0,
        notes: 'BHSL due 15 Jun 2026 — book inspection.',
      },
    ],
  });

  console.log('✅ Done — 15 cars and 11 drivers seeded successfully.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => pool.end());