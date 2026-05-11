// ─────────────────────────────────────────────────────────────────────────────
// FleetTrack — CSV Bank Statement Parser
// Handles CBA, ANZ, Westpac, NAB formats + the transaction patterns seen in
// turrant_calculation.xlsx (Fast Transfer, PayID, OptecAus, Direct Credit)
// ─────────────────────────────────────────────────────────────────────────────

import Papa from 'papaparse';
import { BankTransaction, MatchStatus, Driver } from '@/lib/types';
import { DRIVERS } from '@/lib/data/seed';

// ─── Known driver name patterns for auto-matching ─────────────────────────────
// Derived from real transaction descriptions in the spreadsheet

const DRIVER_MATCH_PATTERNS: Array<{ pattern: RegExp; driverId: string }> = [
  { pattern: /SAMI|BURAK/i,              driverId: 'drv_sami' },
  { pattern: /BEANT\s*SINGH/i,           driverId: 'drv_beant' },
  { pattern: /HAMMAD|796KD6/i,           driverId: 'drv_hammad' },
  { pattern: /ZOHAIB/i,                  driverId: 'drv_zohaib' },
  { pattern: /LAKHVEER\s*DHALIWAL/i,     driverId: 'drv_lakhveer' },
  { pattern: /JAGSIR|JAGSEER|833MC/i,    driverId: 'drv_jagsir' },
  { pattern: /DAVINDAR|DAVINDER|DNDR/i,  driverId: 'drv_davindar' },
  { pattern: /AQUEEL|122OG6/i,           driverId: 'drv_aqueel' },
  { pattern: /USMAN|064LP3/i,            driverId: 'drv_usman' },
  { pattern: /MUHAMMAD\s*ALAM|ALM|ALAM/i,driverId: 'drv_alam' },
  { pattern: /KARAN|464NJ6/i,            driverId: 'drv_karan' },
];

// ─── Detect payment method from description ────────────────────────────────

function detectPaymentMethod(desc: string): BankTransaction['paymentMethod'] {
  const d = desc.toUpperCase();
  if (d.includes('FAST TRANSFER')) return 'fast_transfer';
  if (d.includes('PAYID') || d.includes('OSKO') || d.includes('PAY ID')) return 'payid';
  if (d.includes('DIRECT CREDIT')) return 'direct_credit';
  if (d.includes('OPTECAUS') || d.includes('OPTEC')) return 'optec';
  if (d.includes('CASH')) return 'cash';
  return 'unknown';
}

// ─── Auto-match a transaction to a driver ─────────────────────────────────

function matchToDriver(description: string, reference: string): {
  driverId?: string;
  driverName?: string;
  status: MatchStatus;
} {
  const text = `${description} ${reference}`.toUpperCase();

  for (const { pattern, driverId } of DRIVER_MATCH_PATTERNS) {
    if (pattern.test(text)) {
      const driver = DRIVERS.find(d => d.id === driverId);
      return {
        driverId,
        driverName: driver?.name,
        status: 'matched',
      };
    }
  }

  return { status: 'unmatched' };
}

// ─── Normalise a date string from various bank formats ────────────────────

function normaliseDate(raw: string): string {
  if (!raw) return '';
  const s = raw.trim();

  // DD/MM/YYYY  or  DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;

  // YYYY-MM-DD (already ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD Mon YYYY  e.g. "07 May 2026"
  const months: Record<string,string> = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' };
  const dmy2 = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (dmy2) {
    const m = months[dmy2[2].toLowerCase()];
    return m ? `${dmy2[3]}-${m}-${dmy2[1].padStart(2,'0')}` : s;
  }

  return s;
}

// ─── Normalise amount — handle parentheses for debits ─────────────────────

function normaliseAmount(raw: string): number {
  if (!raw) return 0;
  const s = raw.toString().replace(/[$,\s]/g, '');
  // Some banks use (123.45) for negative
  if (s.startsWith('(') && s.endsWith(')')) return -parseFloat(s.slice(1,-1));
  return parseFloat(s) || 0;
}

// ─── Detect column mapping from header row ───────────────────────────────

interface ColMap {
  date: number;
  description: number;
  amount: number;
  credit?: number;
  debit?: number;
  balance?: number;
  reference?: number;
}

function detectColumns(headers: string[]): ColMap | null {
  const h = headers.map(x => x?.toLowerCase().trim() ?? '');

  const find = (...keys: string[]) => {
    for (const k of keys) {
      const i = h.findIndex(x => x.includes(k));
      if (i >= 0) return i;
    }
    return -1;
  };

  const date = find('date', 'transaction date', 'tran date');
  const desc = find('description', 'narrative', 'details', 'memo', 'particulars');
  const amount = find('amount', 'net amount');
  const credit = find('credit', 'credits', 'deposit');
  const debit = find('debit', 'debits', 'withdrawal');
  const balance = find('balance', 'running balance');
  const reference = find('reference', 'ref', 'transaction ref');

  if (date < 0 || desc < 0) return null;
  if (amount < 0 && credit < 0 && debit < 0) return null;

  return {
    date,
    description: desc,
    amount: amount >= 0 ? amount : -1,
    credit: credit >= 0 ? credit : undefined,
    debit: debit >= 0 ? debit : undefined,
    balance: balance >= 0 ? balance : undefined,
    reference: reference >= 0 ? reference : undefined,
  };
}

// ─── Main parse function ──────────────────────────────────────────────────

export interface ParseResult {
  transactions: BankTransaction[];
  errors: string[];
  dateRangeStart: string;
  dateRangeEnd: string;
  totalCredits: number;
  totalDebits: number;
  rowCount: number;
}

export function parseCSV(csvText: string, uploadBatchId: string): ParseResult {
  const errors: string[] = [];
  const transactions: BankTransaction[] = [];

  const { data, errors: parseErrors } = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
    header: false,
  });

  if (parseErrors.length) {
    errors.push(...parseErrors.map(e => e.message));
  }

  if (!data || data.length < 2) {
    return { transactions, errors: ['File appears empty or has no data rows.'], dateRangeStart: '', dateRangeEnd: '', totalCredits: 0, totalDebits: 0, rowCount: 0 };
  }

  // Find the header row (first row with recognisable column names)
  let headerRowIdx = -1;
  let colMap: ColMap | null = null;

  for (let i = 0; i < Math.min(5, data.length); i++) {
    const attempt = detectColumns(data[i] as string[]);
    if (attempt) {
      headerRowIdx = i;
      colMap = attempt;
      break;
    }
  }

  if (!colMap || headerRowIdx < 0) {
    errors.push('Could not detect column headers. Ensure the CSV has Date, Description, and Amount columns.');
    return { transactions, errors, dateRangeStart: '', dateRangeEnd: '', totalCredits: 0, totalDebits: 0, rowCount: 0 };
  }

  let txIndex = 0;

  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const row = data[i] as string[];
    if (!row || row.every(c => !c?.trim())) continue;

    try {
      const rawDate = row[colMap.date]?.trim() ?? '';
      const desc = row[colMap.description]?.trim() ?? '';
      const ref = colMap.reference != null ? (row[colMap.reference]?.trim() ?? '') : '';

      if (!rawDate && !desc) continue;

      // Amount resolution: prefer single amount col, else credit - debit
      let amount = 0;
      if (colMap.amount >= 0) {
        amount = normaliseAmount(row[colMap.amount]);
      } else {
        const credit = colMap.credit != null ? normaliseAmount(row[colMap.credit]) : 0;
        const debit  = colMap.debit  != null ? normaliseAmount(row[colMap.debit])  : 0;
        amount = credit - debit;
      }

      const balance = colMap.balance != null ? normaliseAmount(row[colMap.balance]) : undefined;
      const isoDate = normaliseDate(rawDate);
      const matchResult = matchToDriver(desc, ref);

      // Check if partial: driver matched but amount < expected rent
      let finalMatchStatus = matchResult.status;
      if (matchResult.driverId && matchResult.status === 'matched') {
        const driver = DRIVERS.find(d => d.id === matchResult.driverId);
        if (driver && amount > 0 && amount < driver.weeklyRent * 0.9) {
          finalMatchStatus = 'partial';
        }
      }

      transactions.push({
        id: `tx_${uploadBatchId}_${txIndex++}`,
        date: isoDate,
        description: desc,
        reference: ref,
        amount,
        balance,
        matchStatus: finalMatchStatus,
        matchedDriverId: matchResult.driverId,
        matchedDriverName: matchResult.driverName,
        uploadBatchId,
        paymentMethod: detectPaymentMethod(desc),
      });
    } catch (err) {
      errors.push(`Row ${i + 1}: ${String(err)}`);
    }
  }

  const credits = transactions.filter(t => t.amount > 0);
  const debits  = transactions.filter(t => t.amount < 0);
  const dates   = transactions.map(t => t.date).filter(Boolean).sort();

  return {
    transactions,
    errors,
    dateRangeStart: dates[0] ?? '',
    dateRangeEnd:   dates[dates.length - 1] ?? '',
    totalCredits:   credits.reduce((s, t) => s + t.amount, 0),
    totalDebits:    Math.abs(debits.reduce((s, t) => s + t.amount, 0)),
    rowCount:       transactions.length,
  };
}

// ─── Format helpers ──────────────────────────────────────────────────────

export function fmtCurrency(n: number, decimals = 0): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function fmtDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

export function daysUntil(iso: string): number {
  const today = new Date('2026-05-11');
  const target = new Date(iso + 'T00:00:00');
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

export function complianceBadge(iso: string | null): {
  label: string;
  variant: 'ok' | 'warning' | 'danger' | 'expired';
} {
  if (!iso) return { label: 'N/A', variant: 'ok' };
  const days = daysUntil(iso);
  if (days < 0)   return { label: `Expired ${Math.abs(days)}d ago`, variant: 'expired' };
  if (days === 0) return { label: 'Due TODAY', variant: 'danger' };
  if (days <= 45) return { label: `${days}d remaining`, variant: 'warning' };
  return { label: fmtDate(iso), variant: 'ok' };
}

export function generateWhatsAppMessage(driver: Driver, car: { rego: string }, amountDue: number, weekDue: string): string {
  return `Hi ${driver.name.split(' ')[0]}, this is a reminder that your weekly car rental for *${car.rego}* of *$${amountDue}* was due on *${weekDue}*.

Please arrange your bank transfer:
BSB: 062-000 | Acc: XXXX XXXX
Ref: *${driver.name.replace(/\s+/g,'').toUpperCase()}-${car.rego}*

Thank you 🚗 FleetTrack`;
}
