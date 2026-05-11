'use client';

import { useState } from 'react';
import { useFleetStore } from '@/store/fleetStore';
import { fmtCurrency, fmtDate } from '@/lib/utils/csv';
import { CARS } from '@/lib/data/seed';

export default function ReconcilePage() {
  const { drivers, transactions, updateTransactionMatch } = useFleetStore();

  const [overrideModal, setOverrideModal] = useState<{
    txId: string; desc: string; amount: number;
  } | null>(null);
  const [overrideDriverId, setOverrideDriverId] = useState('');

  // Build reconciliation rows: one per active driver for current week
  const activeDrivers = drivers.filter(d => d.isActive);

  // Find matched transaction for each driver (from this week's batch)
  const getDriverTx = (driverId: string) =>
    transactions.find(t => t.matchedDriverId === driverId && t.amount > 0);

  const recoRows = activeDrivers.map(driver => {
    const tx = getDriverTx(driver.id);
    const received = tx?.amount ?? 0;
    const expected = driver.weeklyRent;
    const diff = received - expected;
    const car = CARS.find(c => c.rego === driver.currentRego);

    let status: 'paid' | 'partial' | 'overdue' = 'overdue';
    if (received >= expected * 0.99) status = 'paid';
    else if (received > 0) status = 'partial';

    return { driver, car, tx, received, expected, diff, status };
  });

  const unmatchedCredits = transactions.filter(t =>
    t.matchStatus === 'unmatched' && t.amount > 0
  );

  const totalExpected = recoRows.reduce((s, r) => s + r.expected, 0);
  const totalReceived = recoRows.reduce((s, r) => s + r.received, 0);
  const totalGap = totalExpected - totalReceived;

  const handleOverrideSave = () => {
    if (!overrideModal || !overrideDriverId) return;
    updateTransactionMatch(overrideModal.txId, overrideDriverId, 'manual');
    setOverrideModal(null);
    setOverrideDriverId('');
  };

  return (
    <div>
      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-label">Expected This Week</div>
          <div className="kpi-value">{fmtCurrency(totalExpected)}</div>
          <div className="kpi-sub">{activeDrivers.length} active drivers</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Received</div>
          <div className="kpi-value" style={{ color: '#15803d' }}>{fmtCurrency(totalReceived)}</div>
          <div className="kpi-sub">{recoRows.filter(r => r.status === 'paid').length} fully paid</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Outstanding Gap</div>
          <div className="kpi-value" style={{ color: totalGap > 0 ? '#b91c1c' : '#15803d' }}>
            {totalGap > 0 ? fmtCurrency(totalGap) : 'All collected'}
          </div>
          <div className="kpi-sub">{recoRows.filter(r => r.status === 'overdue').length} overdue · {recoRows.filter(r => r.status === 'partial').length} partial</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Unmatched Credits</div>
          <div className="kpi-value" style={{ color: unmatchedCredits.length > 0 ? '#b45309' : '#15803d' }}>
            {unmatchedCredits.length}
          </div>
          <div className="kpi-sub">{unmatchedCredits.length > 0 ? fmtCurrency(unmatchedCredits.reduce((s,t) => s+t.amount,0)) + ' to assign' : 'All matched'}</div>
        </div>
      </div>

      {/* Unmatched credits alert */}
      {unmatchedCredits.length > 0 && (
        <div className="alert alert-amber" style={{ marginBottom: 16 }}>
          <span>💡</span>
          <div>
            <strong>{unmatchedCredits.length} unmatched credit{unmatchedCredits.length > 1 ? 's' : ''}</strong> — payments received but not linked to a driver.
            Use the Override button below to assign them.
          </div>
        </div>
      )}

      {/* Main reconciliation table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Weekly Reconciliation — Week of 5 May 2026</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm">📥 Export</button>
            <button className="btn btn-primary btn-sm">🔄 Re-run Matching</button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Car</th>
              <th>Expected</th>
              <th>Received</th>
              <th>Gap</th>
              <th>Pay Method</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recoRows.map(({ driver, car, tx, received, expected, diff, status }) => (
              <tr key={driver.id} style={{
                background: status === 'overdue' ? '#fef2f280' : status === 'partial' ? '#fffbeb80' : undefined,
              }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="driver-av" style={{
                      background: status === 'overdue' ? '#fef2f2' : status === 'partial' ? '#fffbeb' : '#f0fdf4',
                      color: status === 'overdue' ? '#b91c1c' : status === 'partial' ? '#b45309' : '#15803d',
                    }}>
                      {driver.name.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{driver.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>{driver.phone}</div>
                    </div>
                  </div>
                </td>
                <td><span className="mono" style={{ fontWeight: 600 }}>{car?.rego ?? driver.currentRego}</span></td>
                <td className="mono">{fmtCurrency(expected)}</td>
                <td className="mono" style={{ color: received >= expected ? '#15803d' : received > 0 ? '#b45309' : '#b91c1c', fontWeight: 600 }}>
                  {received > 0 ? fmtCurrency(received) : <span style={{ color: '#b91c1c' }}>$0 — no payment</span>}
                </td>
                <td className="mono" style={{ color: diff >= 0 ? '#15803d' : '#b91c1c', fontWeight: 500 }}>
                  {diff >= 0 ? `+${fmtCurrency(diff)}` : fmtCurrency(diff)}
                </td>
                <td style={{ fontSize: 12 }}>
                  {tx?.paymentMethod
                    ? <span className="badge badge-blue" style={{ fontSize: 10 }}>{tx.paymentMethod.replace('_', ' ')}</span>
                    : <span style={{ color: 'var(--text-hint)' }}>—</span>
                  }
                </td>
                <td>
                  <span className={`badge ${
                    status === 'paid'    ? 'badge-green' :
                    status === 'partial' ? 'badge-amber' : 'badge-red'
                  }`}>
                    {status === 'overdue' ? '⚠ Overdue' : status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {status !== 'paid' && (
                      <button
                        className="btn btn-xs btn-wa"
                        title="Send WhatsApp reminder"
                        onClick={() => alert(`Will send WhatsApp to ${driver.name}`)}
                      >
                        💬
                      </button>
                    )}
                    {tx && (
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => setOverrideModal({ txId: tx.id, desc: tx.description, amount: tx.amount })}
                      >
                        ✏️ Override
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Unmatched transactions */}
      {unmatchedCredits.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Unmatched Credits — Need Manual Assignment</span>
            <span className="badge badge-amber">{unmatchedCredits.length} pending</span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Description</th><th>Amount</th><th>Action</th></tr>
            </thead>
            <tbody>
              {unmatchedCredits.map(t => (
                <tr key={t.id} style={{ background: '#fffbeb80' }}>
                  <td style={{ fontSize: 12 }}>{fmtDate(t.date)}</td>
                  <td style={{ fontSize: 12, maxWidth: 300 }}>{t.description}</td>
                  <td className="mono" style={{ color: '#15803d', fontWeight: 600 }}>{fmtCurrency(t.amount)}</td>
                  <td>
                    <button
                      className="btn btn-xs btn-outline"
                      onClick={() => setOverrideModal({ txId: t.id, desc: t.description, amount: t.amount })}
                    >
                      Assign to driver →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Override modal */}
      {overrideModal && (
        <div className="modal-overlay" onClick={() => setOverrideModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Assign Payment to Driver</span>
              <button className="btn-icon" onClick={() => setOverrideModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4 }}>Transaction</div>
                <div style={{ fontWeight: 500 }}>{overrideModal.desc}</div>
                <div className="mono" style={{ color: '#15803d', marginTop: 4 }}>{fmtCurrency(overrideModal.amount)}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Assign to driver</label>
                <select
                  className="form-input"
                  value={overrideDriverId}
                  onChange={e => setOverrideDriverId(e.target.value)}
                >
                  <option value="">— Select driver —</option>
                  {drivers.filter(d => d.isActive).map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.currentRego})</option>
                  ))}
                  <option value="__unrelated">Mark as unrelated (not a rent payment)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => setOverrideModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleOverrideSave} disabled={!overrideDriverId}>
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
