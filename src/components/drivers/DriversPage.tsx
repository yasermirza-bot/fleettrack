'use client';

import { useState } from 'react';
import { useFleetStore } from '@/store/fleetStore';
import { fmtCurrency, fmtDate } from '@/lib/utils/csv';
import DriverProfileModal from './DriverProfileModal';
import { Driver } from '@/lib/types';

const displayName = (d: any) =>
  `${d.givenName ?? ''} ${d.surname ?? ''}`.trim() || d.name || 'Unknown';

export default function DriversPage() {
  const { drivers, deleteDriver } = useFleetStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openNew = () => { setSelectedDriver(null); setIsNew(true); setShowModal(true); };
  const openEdit = (d: Driver) => { setSelectedDriver(d); setIsNew(false); setShowModal(true); };

  const filtered = drivers.filter(d => {
    const name = displayName(d).toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) || (d.currentRego ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.paymentStatus === filterStatus;
    return matchSearch && matchStatus && d.isActive;
  });

  const totalOutstanding = drivers.filter(d => d.isActive).reduce((s, d) => s + (d.amountOwed ?? 0), 0);

  return (
    <div>
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-label">Active Drivers</div>
          <div className="kpi-value">{drivers.filter(d => d.isActive).length}</div>
          <div className="kpi-sub">in fleet</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Weekly Target</div>
          <div className="kpi-value">{fmtCurrency(drivers.filter(d => d.isActive).reduce((s, d) => s + d.weeklyRent, 0))}</div>
          <div className="kpi-sub">expected per week</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Outstanding</div>
          <div className="kpi-value" style={{ color: totalOutstanding > 0 ? '#b91c1c' : '#15803d' }}>
            {fmtCurrency(totalOutstanding)}
          </div>
          <div className="kpi-sub">{drivers.filter(d => (d.amountOwed ?? 0) > 0).length} behind</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Paid This Week</div>
          <div className="kpi-value" style={{ color: '#15803d' }}>{drivers.filter(d => d.paymentStatus === 'paid').length}</div>
          <div className="kpi-sub">of {drivers.filter(d => d.isActive).length} active</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Drivers ({filtered.length})</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="form-input" style={{ width: 'auto', fontSize: 12, padding: '5px 10px' }}
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
            <input className="form-input" style={{ width: 200, fontSize: 12 }}
              placeholder="Search name or rego…" value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Driver</button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Driver</th><th>Licence</th><th>Car</th><th>Rent</th>
              <th>Bond</th><th>Last Payment</th><th>Owed</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(d)}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div className="driver-av" style={{
                      background: d.paymentStatus === 'overdue' ? '#fef2f2' : d.paymentStatus === 'partial' ? '#fffbeb' : '#eff6ff',
                      color: d.paymentStatus === 'overdue' ? '#b91c1c' : d.paymentStatus === 'partial' ? '#b45309' : '#1d4ed8',
                    }}>
                      {displayName(d).slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{displayName(d)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>{d.phone}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="mono" style={{ fontSize: 12 }}>{(d as any).licenceNumber || '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>
                    {(d as any).licenceExpiry ? `exp ${fmtDate((d as any).licenceExpiry)}` : ''}
                  </div>
                </td>
                <td><span className="mono" style={{ fontWeight: 600 }}>{d.currentRego || '—'}</span></td>
                <td className="mono">${d.weeklyRent}/wk</td>
                <td>
                  {(d as any).bondAmount > 0
                    ? <span className={`badge ${(d as any).bondPaid ? 'badge-green' : 'badge-amber'}`}>
                        ${(d as any).bondAmount} {(d as any).bondPaid ? '✓' : 'unpaid'}
                      </span>
                    : <span style={{ color: 'var(--text-hint)' }}>—</span>
                  }
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtDate(d.lastPaymentDate ?? '')}</td>
                <td className="mono" style={{ color: (d.amountOwed ?? 0) > 0 ? '#b91c1c' : '#15803d' }}>
                  {(d.amountOwed ?? 0) > 0 ? fmtCurrency(d.amountOwed ?? 0) : '—'}
                </td>
                <td>
                  <span className={`badge ${d.paymentStatus === 'paid' ? 'badge-green' : d.paymentStatus === 'partial' ? 'badge-amber' : d.paymentStatus === 'overdue' ? 'badge-red' : 'badge-gray'}`}>
                    {d.paymentStatus ?? 'pending'}
                  </span>
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button className="btn-icon" onClick={() => openEdit(d)}>✏️</button>
                    <button className="btn-icon danger" onClick={() => setConfirmDelete(d.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-hint)', padding: 32 }}>No drivers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <DriverProfileModal driver={selectedDriver} isNew={isNew} onClose={() => setShowModal(false)} />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Remove Driver?</span></div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                This will deactivate <strong>{displayName(drivers.find(d => d.id === confirmDelete)!)}</strong>. History retained.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={() => { deleteDriver(confirmDelete); setConfirmDelete(null); }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
