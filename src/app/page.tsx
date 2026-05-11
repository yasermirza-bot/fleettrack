'use client';

import { useFleetStore, selectComplianceAlerts, selectOverdueDrivers } from '@/store/fleetStore';
import Dashboard from '@/components/dashboard/Dashboard';
import DriversPage from '@/components/drivers/DriversPage';
import FleetPage from '@/components/drivers/FleetPage';
import StatementsPage from '@/components/statements/StatementsPage';
import ReconcilePage from '@/components/payments/ReconcilePage';
import RemindersPage from '@/components/reminders/RemindersPage';
import ReportsPage from '@/components/dashboard/ReportsPage';

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',      icon: '⊞',  section: 'overview' },
  { id: 'drivers',    label: 'Drivers',         icon: '👤',  section: 'overview' },
  { id: 'fleet',      label: 'Fleet & Cars',    icon: '🚗',  section: 'overview' },
  { id: 'statements', label: 'Bank Statements', icon: '↑',  section: 'payments' },
  { id: 'reconcile',  label: 'Reconciliation',  icon: '⟷',  section: 'payments' },
  { id: 'reminders',  label: 'Reminders',       icon: '💬',  section: 'payments' },
  { id: 'reports',    label: 'Reports & ROI',   icon: '📊',  section: 'analytics' },
] as const;

const PAGE_TITLES: Record<string, string> = {
  dashboard:  'Dashboard',
  drivers:    'Driver Management',
  fleet:      'Fleet & Cars',
  statements: 'Bank Statements',
  reconcile:  'Payment Reconciliation',
  reminders:  'WhatsApp Reminders',
  reports:    'Reports & ROI',
};

export default function Home() {
  const { activePage, setActivePage, drivers, reminders, setAddDriverModalOpen } = useFleetStore();

  const complianceAlerts = selectComplianceAlerts();
  const overdueDrivers = selectOverdueDrivers(drivers);
  const pendingReminders = reminders.filter(r => r.status === 'pending');

  const badgeCount = (id: string): number | null => {
    if (id === 'fleet')     return complianceAlerts.length || null;
    if (id === 'drivers')   return overdueDrivers.length || null;
    if (id === 'reminders') return pendingReminders.length || null;
    if (id === 'reconcile') return drivers.filter(d => d.paymentStatus === 'overdue' || d.paymentStatus === 'partial').length || null;
    return null;
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':  return <Dashboard />;
      case 'drivers':    return <DriversPage />;
      case 'fleet':      return <FleetPage />;
      case 'statements': return <StatementsPage />;
      case 'reconcile':  return <ReconcilePage />;
      case 'reminders':  return <RemindersPage />;
      case 'reports':    return <ReportsPage />;
      default:           return <Dashboard />;
    }
  };

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <nav className="sidebar" aria-label="Main navigation">
        <div className="sidebar-brand">
          <div className="sidebar-logo">🚗</div>
          <div>
            <div className="brand-title">FleetTrack</div>
            <div className="brand-sub">Rental Manager</div>
          </div>
        </div>

        {/* Nav items grouped by section */}
        {(['overview', 'payments', 'analytics'] as const).map(section => {
          const items = NAV.filter(n => n.section === section);
          return (
            <div key={section} className="sidebar-section">
              <div className="sidebar-section-label">{section}</div>
              {items.map(item => {
                const count = badgeCount(item.id);
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                    onClick={() => setActivePage(item.id as typeof activePage)}
                    aria-current={activePage === item.id ? 'page' : undefined}
                  >
                    <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {count !== null && <span className="nav-badge">{count}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}

        <div className="sidebar-footer">
          <div className="avatar-circle" aria-hidden="true">JD</div>
          <div className="footer-text">
            <div style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>Fleet Owner</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Brisbane, QLD</div>
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <div className="main">
        {/* Top bar */}
        <header className="topbar">
          <h1 className="page-title">{PAGE_TITLES[activePage]}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--surface-2)', borderRadius: 7,
              padding: '5px 12px', fontSize: 12, color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}>
              📅 Week of 5 May 2026
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setAddDriverModalOpen(true)}>
              + Add Driver
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="page-body" id="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
