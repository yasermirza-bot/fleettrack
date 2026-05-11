import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://postgres.aiqcpbqqvfproxgdzxkp:Kitno@4608888@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  console.log('Connected to Supabase...');

  try {
    await client.query('DELETE FROM "Reminder"');
    await client.query('DELETE FROM "Payment"');
    await client.query('DELETE FROM "BankTransaction"');
    await client.query('DELETE FROM "UploadBatch"');
    await client.query('DELETE FROM "Driver"');
    await client.query('DELETE FROM "Car"');
    console.log('Cleared existing data...');

    await client.query(`
      INSERT INTO "Car" (id, rego, make, model, year, colour, "regoExpiry", "bhslExpiry", "bhslNumber", "ctpClass", "weeklyRent", batch, "isPersonal", "regoStatus", "bhslStatus", "createdAt")
      VALUES
        (gen_random_uuid(), '707XXF', 'Toyota', 'Camry',        2018, 'Red',    '2026-06-19', '2027-02-04', '243700', 4, 330, 1, false, 'ok',        'ok',      NOW()),
        (gen_random_uuid(), '947ZWE', 'Toyota', 'Camry',        2020, 'Silver', '2026-07-28', '2027-03-17', '243247', 4, 340, 1, false, 'ok',        'ok',      NOW()),
        (gen_random_uuid(), '796KD6', 'Toyota', 'Camry',        2017, 'White',  '2026-08-21', '2026-06-15', '253652', 4, 290, 2, false, 'ok',        'warning', NOW()),
        (gen_random_uuid(), '754KJ2', 'Toyota', 'Corolla',      2021, 'White',  '2026-06-18', '2026-07-08', '252466', 4, 270, 2, false, 'ok',        'ok',      NOW()),
        (gen_random_uuid(), '725KW9', 'Toyota', 'Camry',        2018, 'White',  '2026-08-27', '2026-08-29', '258819', 4, 320, 2, false, 'ok',        'ok',      NOW()),
        (gen_random_uuid(), '833MC3', 'Toyota', 'Camry',        2018, 'White',  '2026-05-11', '2026-08-29', '258820', 4, 320, 2, false, 'due_today', 'ok',      NOW()),
        (gen_random_uuid(), '723KW9', 'Toyota', 'Camry',        2019, 'White',  '2026-08-27', '2026-08-29', '258695', 4, 330, 2, false, 'ok',        'ok',      NOW()),
        (gen_random_uuid(), '122OG6', 'Toyota', 'Camry',        2020, 'White',  '2026-09-10', '2026-09-10', '260158', 4, 340, 3, false, 'ok',        'ok',      NOW()),
        (gen_random_uuid(), '123OG6', 'Toyota', 'Camry',        2021, 'White',  '2026-09-11', '2026-09-15', '260082', 4, 340, 3, false, 'ok',        'ok',      NOW()),
        (gen_random_uuid(), '064LP3', 'Toyota', 'Camry',        2019, 'Blue',   '2026-04-29', '2026-11-13', '265324', 4, 330, 3, false, 'expired',   'ok',      NOW()),
        (gen_random_uuid(), '942MU5', 'Toyota', 'Camry',        2021, 'White',  '2026-10-10', '2026-04-14', '248816', 4, 340, 3, false, 'ok',        'expired', NOW()),
        (gen_random_uuid(), '464NJ6', 'Toyota', 'Camry',        2020, 'White',  '2026-06-12', '2026-06-15', '253459', 4, 340, 3, false, 'ok',        'warning', NOW()),
        (gen_random_uuid(), '795EU6', 'Toyota', 'Land Cruiser', 2007, 'White',  '2026-07-07', NULL,         NULL,     1, 0,   NULL, true, 'ok',       'ok',      NOW()),
        (gen_random_uuid(), '773LP3', 'Hummer', 'H2',           2008, 'Silver', '2026-08-06', NULL,         NULL,     1, 0,   NULL, true, 'ok',       'ok',      NOW()),
        (gen_random_uuid(), '105LV2', 'Mazda',  'CX-9',         2017, 'White',  '2026-08-27', NULL,         NULL,     1, 0,   NULL, true, 'ok',       'ok',      NOW())
    `);
    console.log('✅ 15 cars seeded...');

    await client.query(`
      INSERT INTO "Driver" (id, name, phone, "currentRego", "weeklyRent", "startDate", "isActive", "paymentStatus", "lastPaymentDate", "lastPaymentAmount", "amountOwed", notes, "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), 'Sami',              '+61400000001', '707XXF', 325, '2024-03-01', true, 'paid',    '2026-05-07', 325, 0,   'Red Camry. Reliable payer.',              NOW(), NOW()),
        (gen_random_uuid(), 'Beant Singh',       '+61400000002', '947ZWE', 295, '2024-07-01', true, 'paid',    '2026-05-06', 295, 0,   'Silver Camry. Bond $590. Pays via PayID.',NOW(), NOW()),
        (gen_random_uuid(), 'Hammad',            '+61400000003', '796KD6', 280, '2024-01-15', true, 'overdue', '2026-04-28', 280, 560, 'Lowest collection rate. Frequently late.',NOW(), NOW()),
        (gen_random_uuid(), 'Zohaib',            '+61400000004', '754KJ2', 280, '2024-02-01', true, 'paid',    '2026-05-08', 280, 0,   'Corolla. Bond $560. Pays via OptecAus.',  NOW(), NOW()),
        (gen_random_uuid(), 'Lakhveer Dhaliwal', '+61400000005', '725KW9', 320, '2024-05-01', true, 'paid',    '2026-05-05', 320, 0,   'Pays Fast Transfer.',                     NOW(), NOW()),
        (gen_random_uuid(), 'Jagsir',            '+61400000006', '833MC3', 325, '2024-03-15', true, 'partial', '2026-05-04', 205, 120, 'Rego due TODAY. Partial payment.',         NOW(), NOW()),
        (gen_random_uuid(), 'Davindar',          '+61400000007', '723KW9', 325, '2024-04-01', true, 'paid',    '2026-05-09', 325, 0,   'Reliable. Pays via Optec.',                NOW(), NOW()),
        (gen_random_uuid(), 'Aqueel',            '+61400000008', '122OG6', 340, '2025-01-06', true, 'paid',    '2026-05-06', 340, 0,   'Bond paid. Collection rate 100.9%.',       NOW(), NOW()),
        (gen_random_uuid(), 'Usman',             '+61400000009', '064LP3', 325, '2024-06-01', true, 'paid',    '2026-05-07', 325, 0,   'Blue Camry. REGO EXPIRED 29 Apr 2026.',    NOW(), NOW()),
        (gen_random_uuid(), 'Alam',              '+61400000010', '942MU5', 340, '2025-07-01', true, 'paid',    '2026-05-05', 340, 0,   'BHSL EXPIRED 14 Apr 2026.',                NOW(), NOW()),
        (gen_random_uuid(), 'Karan',             '+61400000011', '464NJ6', 300, '2025-10-01', true, 'paid',    '2026-05-08', 300, 0,   'BHSL due 15 Jun 2026.',                    NOW(), NOW())
    `);
    console.log('✅ 11 drivers seeded...');

    console.log('✅ Done — all data seeded successfully!');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });