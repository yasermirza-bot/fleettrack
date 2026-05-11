// ─────────────────────────────────────────────────────────────────────────────
// FleetTrack — Core Domain Types
// Based on turrant_calculation.xlsx analysis
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentStatus = 'paid' | 'overdue' | 'partial' | 'pending' | 'vacant';
export type MatchStatus   = 'matched' | 'unmatched' | 'partial' | 'manual';
export type ComplianceStatus = 'ok' | 'warning' | 'expired' | 'due_today';

// ─── Driver ──────────────────────────────────────────────────────────────────

export interface Driver {
  id: string;
  name: string;
  phone: string;           // WhatsApp-capable Australian mobile
  currentRego: string;     // Currently assigned car rego
  weeklyRent: number;      // Current weekly rent in AUD
  startDate: string;       // ISO date — when they started with this car
  isActive: boolean;
  notes?: string;
  // Computed display fields
  paymentStatus?: PaymentStatus;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  amountOwed?: number;
}

// ─── Car / Vehicle ───────────────────────────────────────────────────────────

export interface Car {
  id: string;
  rego: string;
  make: string;
  model: string;
  year: number;
  colour: string;
  regoExpiry: string;      // ISO date
  bhslExpiry: string | null; // Booked-hire service licence — null for personal cars
  bhslNumber?: string;     // e.g. "258819"
  ctpClass: number;        // 4 = rideshare, 1 = personal
  weeklyRent: number;      // Target weekly rent
  assignedDriverId: string | null;
  batch: 1 | 2 | 3 | null;
  isPersonal: boolean;     // Self-driven (LC200, Hummer, CX9)
  purchasePrice?: number;
  // Compliance
  regoStatus: ComplianceStatus;
  bhslStatus: ComplianceStatus;
}

// ─── Transaction (from bank CSV) ─────────────────────────────────────────────

export interface BankTransaction {
  id: string;
  date: string;            // ISO date string
  description: string;     // Raw bank description
  reference: string;       // Payment reference
  amount: number;          // Positive = credit (rent received)
  balance?: number;
  matchStatus: MatchStatus;
  matchedDriverId?: string;
  matchedDriverName?: string;
  isManualOverride?: boolean;
  uploadBatchId: string;
  paymentMethod: 'fast_transfer' | 'payid' | 'direct_credit' | 'cash' | 'optec' | 'unknown';
}

// ─── Payment (weekly rent record) ────────────────────────────────────────────

export interface Payment {
  id: string;
  driverId: string;
  driverName: string;
  rego: string;
  transactionId?: string;
  amount: number;
  expectedAmount: number;
  dueDate: string;          // ISO date — Monday of the week
  paidDate?: string;
  weekNumber: number;
  year: number;
  status: PaymentStatus;
  notes?: string;           // e.g. "service deducted", "partial — balance next week"
  deductions?: PaymentDeduction[];
}

export interface PaymentDeduction {
  type: 'service' | 'tyre' | 'rego' | 'bhsl' | 'insurance' | 'repair' | 'other';
  amount: number;
  description: string;
}

// ─── Upload Batch ─────────────────────────────────────────────────────────────

export interface UploadBatch {
  id: string;
  filename: string;
  uploadedAt: string;
  rowCount: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  matchedCount: number;
  unmatchedCount: number;
  totalCredits: number;
}

// ─── Reconciliation ──────────────────────────────────────────────────────────

export interface ReconciliationRow {
  driver: Driver;
  car: Car;
  expectedAmount: number;
  receivedAmount: number;
  difference: number;
  status: PaymentStatus;
  matchedTransaction?: BankTransaction;
  deductions: number;      // Amounts deducted for services/repairs
  weekStart: string;
}

// ─── ROI / Financial ─────────────────────────────────────────────────────────

export interface CarROI {
  rego: string;
  totalRevenue: number;
  totalWeeks: number;
  avgWeeklyActual: number;
  projectedWeeklyRent: number;
  collectionRate: number;   // percentage
  tillDateROI: number;      // percentage
  annualROI: number;        // percentage
  grossProfit: number;
  netProfit: number;
  purchasePrice: number;
  opCost: number;
  remainingAssetValue: number;
}

export interface PortfolioROI {
  totalRevenue: number;
  totalPurchaseCost: number;
  totalOpCost: number;
  totalGrossProfit: number;
  totalNetProfit: number;
  tillDateROI: number;
  annualROI: number;
  totalAssetValue: number;
  totalWorth: number;       // assets + profit
}

// ─── WhatsApp Reminder ───────────────────────────────────────────────────────

export interface ReminderMessage {
  id: string;
  driverId: string;
  driverName: string;
  phone: string;
  rego: string;
  amountDue: number;
  weekDue: string;
  messageBody: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  type: 'rent_due' | 'overdue' | 'compliance' | 'custom';
}

// ─── Weekly Income (from Combined sheet) ─────────────────────────────────────

export interface WeeklyIncome {
  week: number;
  weekStart: string;       // ISO date
  totalIncome: number;
  perCarBreakdown: Record<string, number>;
}

// ─── Driver History ───────────────────────────────────────────────────────────

export interface DriverCarHistory {
  driverId: string;
  driverName: string;
  rego: string;
  startDate: string;
  endDate?: string;        // null = current
  weeklyRent: number;
  totalWeeks: number;
  totalRevenue: number;
}
