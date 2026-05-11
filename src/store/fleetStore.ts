// ─────────────────────────────────────────────────────────────────────────────
// FleetTrack — Global State Store (Zustand)
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { Driver, BankTransaction, UploadBatch, ReminderMessage } from '@/lib/types';
import { DRIVERS, CARS, MOCK_TRANSACTIONS, REMINDERS_QUEUE } from '@/lib/data/seed';

export type NavPage = 'dashboard' | 'drivers' | 'fleet' | 'statements' | 'reconcile' | 'reminders' | 'reports';

interface FleetStore {
  // ── Navigation
  activePage: NavPage;
  setActivePage: (page: NavPage) => void;

  // ── Drivers (full CRUD)
  drivers: Driver[];
  addDriver: (driver: Omit<Driver, 'id'>) => void;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;

  // ── Transactions (from CSV uploads)
  transactions: BankTransaction[];
  uploadBatches: UploadBatch[];
  addTransactions: (txns: BankTransaction[], batch: UploadBatch) => void;
  updateTransactionMatch: (txId: string, driverId: string | undefined, status: BankTransaction['matchStatus']) => void;

  // ── Reminders
  reminders: ReminderMessage[];
  markReminderSent: (id: string) => void;

  // ── UI modals
  addDriverModalOpen: boolean;
  setAddDriverModalOpen: (v: boolean) => void;
  editingDriverId: string | null;
  setEditingDriverId: (id: string | null) => void;
}

let driverIdCounter = 100;

export const useFleetStore = create<FleetStore>((set, get) => ({
  // ── Navigation
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),

  // ── Drivers — seeded from real spreadsheet data
  drivers: DRIVERS,

  addDriver: (driver) => set((s) => ({
    drivers: [...s.drivers, { ...driver, id: `drv_${++driverIdCounter}` }],
  })),

  updateDriver: (id, updates) => set((s) => ({
    drivers: s.drivers.map(d => d.id === id ? { ...d, ...updates } : d),
  })),

  deleteDriver: (id) => set((s) => ({
    drivers: s.drivers.filter(d => d.id !== id),
  })),

  // ── Transactions — pre-seeded with this week's mock data
  transactions: MOCK_TRANSACTIONS as BankTransaction[],

  uploadBatches: [{
    id: 'batch_001',
    filename: 'bank_statement_may2026.csv',
    uploadedAt: '2026-05-11T09:00:00',
    rowCount: 12,
    dateRangeStart: '2026-05-04',
    dateRangeEnd: '2026-05-10',
    matchedCount: 10,
    unmatchedCount: 2,
    totalCredits: 3255,
  }],

  addTransactions: (txns, batch) => set((s) => ({
    transactions: [...s.transactions, ...txns],
    uploadBatches: [batch, ...s.uploadBatches],
  })),

  updateTransactionMatch: (txId, driverId, status) => set((s) => {
    const driver = driverId ? s.drivers.find(d => d.id === driverId) : undefined;
    return {
      transactions: s.transactions.map(t =>
        t.id === txId
          ? { ...t, matchStatus: status, matchedDriverId: driverId, matchedDriverName: driver?.name, isManualOverride: true }
          : t
      ),
    };
  }),

  // ── Reminders
  reminders: REMINDERS_QUEUE as ReminderMessage[],
  markReminderSent: (id) => set((s) => ({
    reminders: s.reminders.map(r =>
      r.id === id ? { ...r, status: 'sent', sentAt: new Date().toISOString() } : r
    ),
  })),

  // ── UI state
  addDriverModalOpen: false,
  setAddDriverModalOpen: (v) => set({ addDriverModalOpen: v }),
  editingDriverId: null,
  setEditingDriverId: (id) => set({ editingDriverId: id }),
}));

// ─── Derived selectors ────────────────────────────────────────────────────────

export const selectRentalCars = () =>
  CARS.filter(c => !c.isPersonal);

export const selectPersonalCars = () =>
  CARS.filter(c => c.isPersonal);

export const selectFleetCars = () => CARS;

export const selectComplianceAlerts = () =>
  CARS.filter(c => !c.isPersonal && (
    c.regoStatus === 'expired' || c.regoStatus === 'due_today' ||
    c.bhslStatus === 'expired' || c.bhslStatus === 'warning'
  ));

export const selectCurrentWeekRevenue = (transactions: BankTransaction[]) =>
  transactions
    .filter(t => t.amount > 0 && t.uploadBatchId === 'batch_001')
    .reduce((s, t) => s + t.amount, 0);

export const selectOverdueDrivers = (drivers: Driver[]) =>
  drivers.filter(d => d.isActive && (d.paymentStatus === 'overdue' || d.paymentStatus === 'partial'));

export const selectTotalOutstanding = (drivers: Driver[]) =>
  drivers.filter(d => d.isActive).reduce((s, d) => s + (d.amountOwed ?? 0), 0);
