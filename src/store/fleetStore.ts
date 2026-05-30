// ─────────────────────────────────────────────────────────────────────────────
// FleetTrack — Global State Store (Zustand)
// Connected to Supabase via API routes
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { Driver, BankTransaction, UploadBatch, ReminderMessage } from '@/lib/types';
import { REMINDERS_QUEUE, CARS } from '@/lib/data/seed';

export type NavPage = 'dashboard' | 'drivers' | 'fleet' | 'statements' | 'reconcile' | 'reminders' | 'reports' | 'contracts' | 'settings';

interface FleetStore {
  // ── Navigation
  activePage: NavPage;
  setActivePage: (page: NavPage) => void;

  // ── Loading
  isLoading: boolean;
  error: string | null;

  // ── Drivers
  drivers: Driver[];
  fetchDrivers: () => Promise<void>;
  addDriver: (driver: Omit<Driver, 'id'>) => Promise<void>;
  updateDriver: (id: string, updates: Partial<Driver>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;

  // ── Transactions
  transactions: BankTransaction[];
  uploadBatches: UploadBatch[];
  fetchTransactions: () => Promise<void>;
  fetchBatches: () => Promise<void>;
  addTransactions: (txns: BankTransaction[], batch: UploadBatch) => Promise<void>;
  updateTransactionMatch: (txId: string, driverId: string | undefined, status: BankTransaction['matchStatus']) => Promise<void>;

  // ── Reminders
  reminders: ReminderMessage[];
  markReminderSent: (id: string) => void;

  // ── UI modals
  addDriverModalOpen: boolean;
  setAddDriverModalOpen: (v: boolean) => void;
  editingDriverId: string | null;
  setEditingDriverId: (id: string | null) => void;
}

export const useFleetStore = create<FleetStore>((set, get) => ({
  // ── Navigation
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),

  // ── Loading
  isLoading: false,
  error: null,

  // ── Drivers
  drivers: [],

  fetchDrivers: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/drivers');
      if (!res.ok) throw new Error('Failed to fetch drivers');
      const data = await res.json();
      set({ drivers: data, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  addDriver: async (driver) => {
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driver),
      });
      if (!res.ok) throw new Error('Failed to create driver');
      const newDriver = await res.json();
      set(s => ({ drivers: [...s.drivers, newDriver] }));
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  updateDriver: async (id, updates) => {
    try {
      const res = await fetch(`/api/drivers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update driver');
      const updated = await res.json();
      set(s => ({ drivers: s.drivers.map(d => d.id === id ? { ...d, ...updated } : d) }));
    } catch (error) {
      set({ error: String(error) });
      throw error;
    }
  },

  deleteDriver: async (id) => {
    try {
      const res = await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete driver');
      set(s => ({ drivers: s.drivers.map(d => d.id === id ? { ...d, isActive: false } : d) }));
    } catch (error) {
      set({ error: String(error) });
    }
  },

  // ── Transactions
  transactions: [],
  uploadBatches: [],

  fetchTransactions: async () => {
    try {
      const res = await fetch('/api/transactions');
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      set({ transactions: data });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  fetchBatches: async () => {
    try {
      const res = await fetch('/api/statements');
      if (!res.ok) throw new Error('Failed to fetch batches');
      const data = await res.json();
      set({ uploadBatches: data });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  addTransactions: async (txns, batch) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: txns, batch }),
      });
      if (!res.ok) throw new Error('Failed to save transactions');
      set(s => ({ transactions: [...s.transactions, ...txns], uploadBatches: [batch, ...s.uploadBatches] }));
    } catch (error) {
      set(s => ({ transactions: [...s.transactions, ...txns], uploadBatches: [batch, ...s.uploadBatches], error: String(error) }));
    }
  },

  updateTransactionMatch: async (txId, driverId, status) => {
    try {
      const res = await fetch(`/api/transactions/${txId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchedDriverId: driverId, matchStatus: status }),
      });
      if (!res.ok) throw new Error('Failed to update transaction');
      const updated = await res.json();
      set(s => ({ transactions: s.transactions.map(t => t.id === txId ? { ...t, ...updated } : t) }));
    } catch (error) {
      const driver = get().drivers.find(d => d.id === driverId);
      set(s => ({
        transactions: s.transactions.map(t =>
          t.id === txId ? { ...t, matchStatus: status, matchedDriverId: driverId, matchedDriverName: driver?.name, isManualOverride: true } : t
        ),
        error: String(error),
      }));
    }
  },

  // ── Reminders
  reminders: REMINDERS_QUEUE as ReminderMessage[],
  markReminderSent: (id) => set(s => ({
    reminders: s.reminders.map(r => r.id === id ? { ...r, status: 'sent', sentAt: new Date().toISOString() } : r),
  })),

  // ── UI state
  addDriverModalOpen: false,
  setAddDriverModalOpen: (v) => set({ addDriverModalOpen: v }),
  editingDriverId: null,
  setEditingDriverId: (id) => set({ editingDriverId: id }),
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectFleetCars = () => CARS;
export const selectRentalCars = () => CARS.filter(c => !c.isPersonal);
export const selectPersonalCars = () => CARS.filter(c => c.isPersonal);
export const selectComplianceAlerts = () =>
  CARS.filter(c => !c.isPersonal && (
    c.regoStatus === 'expired' || c.regoStatus === 'due_today' ||
    c.bhslStatus === 'expired' || c.bhslStatus === 'warning'
  ));
export const selectOverdueDrivers = (drivers: Driver[]) =>
  drivers.filter(d => d.isActive && (d.paymentStatus === 'overdue' || d.paymentStatus === 'partial'));
export const selectTotalOutstanding = (drivers: Driver[]) =>
  drivers.filter(d => d.isActive).reduce((s, d) => s + (d.amountOwed ?? 0), 0);