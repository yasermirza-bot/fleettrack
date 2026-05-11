'use client';

import { useState } from 'react';
import { useFleetStore } from '@/store/fleetStore';
import { Driver } from '@/lib/types';
import { fmtCurrency, fmtDate, generateWhatsAppMessage } from '@/lib/utils/csv';
import { CARS } from '@/lib/data/seed';

type DriverForm = {
  name: string; phone: string; currentRego: string;
  weeklyRent: string; startDate: string; notes: string;
};

const BLANK: DriverForm = { name: '', phone: '', currentRego: '', weeklyRent: '', startDate: '', notes: '' };

export default function DriversPage() {
  const { drivers, addDriver, updateDriver, deleteDriver,
          addDriverModalOpen, setAddDriverModalOpen } = useFleetStore();

  const [form, setForm] = useState<DriverForm>(BLANK);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [waPreview, setWaPreview] = useState<{ msg: string; name: string } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openAdd = () => { setForm(BLANK); setEditId(null); setAddDriverModalOpen(true); };
  const openEdit = (d: Driver) => {
    setForm({ name: d.name, phone: d.phone, currentRego: d.currentRego, weeklyRent: String(d.weeklyRent), startDate: d.startDate, notes: d.notes ?? '' });
    setEditId(d.id);
    setAddDriverModalOpen(true);
  };
  const closeModal = () => { setAddDriverModalOpen(false); setEditId(null); setForm(BLANK); };

  const handleSave = () => {
    if (!form.name.trim() || !form.currentRego.trim()) return;
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      currentRego: form.currentRego.trim().toUpperCase(),
      weeklyRent: parseFloat(form.weeklyRent) || 0,
      startDate: form.startDate,
      notes: form.notes,
      isActive: true,
      paymentStatus: 'pending' as const,
      amountOwed: 0,
    };
    if (editId) updateDriver(editId, payload);
    else addDriver(payload);
    closeModal();
  };

  const sendReminder = (d: Driver) => {
    const car = CARS.find(c => c.rego === d.currentRego);
    if (!car) return;
    const due = d.weeklyRent;
    const msg = generateWhatsAppMessage(d, car, due, '5 May 2026');
    setWaPreview({ msg, name: d.name });
  };

  const filtered = drivers.filter(d => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.currentRego.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.paymentStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalWeeklyRent = drivers.filter(d => d.isActive).reduce((s, d) => s + d.weeklyRent, 0);
  const totalOutstanding = drivers.filter(d => d.isActive).reduce((s, d) => s + (d.amountOwed ?? 0), 0);

  return (
    <div>
      {/* Stats row */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-label">Active Drivers</div>
          <div className="kpi-value">{drivers.filter(d => d.isActive).length}</div>
          <div className="kpi-sub">of {drivers.length} total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Target Weekly Revenue</div>
          <div className="kpi-value">{fmtCurrency(totalWeeklyRent)}</div>
          <div className="kpi-sub">from active drivers</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Outstanding</div>
          <div className="kpi-value" style={{ color: totalOutstanding > 0 ? '#b91c1c' : '#15803d' }}>{fmtCurrency(totalOutstanding)}</div>
          <div className="kpi-sub">{drivers.filter(d => (d.amountOwed ?? 0) > 0).length} drivers behind</div>
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="form-input"
              style={{ width: 'auto', fontSize: 12, padding: '5px 10px' }}
            >
              <option value="all">All status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
            <input
              className="form-input"
              style={{ width: 200, fontSize: 12 }}
              placeholder="Search name or rego…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Driver</button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Car Rego</th>
              <th>Weekly Rent</th>
              <th>Last Payment</th>
              <th>Amount Owed</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div className="driver-av" style={{
                      background: d.paymentStatus === 'overdue' ? '#fef2f2' : d.paymentStatus === 'partial' ? '#fffbeb' : '#eff6ff',
                      color: d.paymentStatus === 'overdue' ? '#b91c1c' : d.paymentStatus === 'partial' ? '#b45309' : '#1d4ed8',
                    }}>
                      {d.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>{d.phone}</div>
                    </div>
                  </div>
                </td>
                <td><span className="mono" style={{ fontWeight: 600 }}>{d.currentRego}</span></td>
                <td className="mono">${d.weeklyRent}/wk</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  {fmtDate(d.lastPaymentDate ?? '')}
                  {d.lastPaymentAmount ? <span className="mono" style={{ marginLeft: 4, color: 'var(--text-hint)' }}>${d.lastPaymentAmount}</span> : null}
                </td>
                <td>
                  {(d.amountOwed ?? 0) > 0
                    ? <span className="mono" style={{ color: '#b91c1c', fontWeight: 600 }}>{fmtCurrency(d.amountOwed ?? 0)}</span>
                    : <span style={{ color: '#15803d' }}>—</span>
                  }
                </td>
                <td>
                  <span className={`badge ${
                    d.paymentStatus === 'paid'    ? 'badge-green' :
                    d.paymentStatus === 'partial' ? 'badge-amber' :
                    d.paymentStatus === 'overdue' ? 'badge-red'   : 'badge-gray'
                  }`}>
                    {d.paymentStatus ?? 'unknown'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button
                      className="btn-icon wa" title="Send WhatsApp reminder"
                      onClick={() => sendReminder(d)}
                    >💬</button>
                    <button
                      className="btn-icon" title="Edit driver"
                      onClick={() => openEdit(d)}
                    >✏️</button>
                    <button
                      className="btn-icon danger" title="Remove driver"
                      onClick={() => setConfirmDelete(d.id)}
                    >🗑</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-hint)', padding: 32 }}>No drivers match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Add/Edit Driver Modal ── */}
      {addDriverModalOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editId ? 'Edit Driver' : 'Add New Driver'}</span>
              <button className="btn-icon" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="e.g. Lakhveer Dhaliwal" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone (WhatsApp)</label>
                  <input className="form-input" placeholder="+61 4XX XXX XXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Car Rego *</label>
                  <input className="form-input" placeholder="e.g. 725KW9" value={form.currentRego} onChange={e => setForm(f => ({ ...f, currentRego: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Weekly Rent ($)</label>
                  <input className="form-input" type="number" placeholder="320" value={form.weeklyRent} onChange={e => setForm(f => ({ ...f, weeklyRent: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input className="form-input" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-input" placeholder="Bond paid, pays via PayID, etc." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>
                {editId ? 'Save Changes' : 'Add Driver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Remove Driver?</span>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                This will remove <strong>{drivers.find(d => d.id === confirmDelete)?.name}</strong> from your fleet. Payment history will be retained.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={() => { deleteDriver(confirmDelete); setConfirmDelete(null); }}>
                Remove Driver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WhatsApp Preview Modal ── */}
      {waPreview && (
        <div className="modal-overlay" onClick={() => setWaPreview(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">💬 WhatsApp Reminder — {waPreview.name}</span>
              <button className="btn-icon" onClick={() => setWaPreview(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#dcfce7', borderRadius: '0 12px 12px 12px', padding: '12px 14px', fontSize: 13, lineHeight: 1.65, color: '#14532d', border: '1px solid #86efac', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {waPreview.msg}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 10 }}>
                ℹ️ Actual sending via Twilio or Meta WhatsApp Cloud API (configured in backend settings).
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => setWaPreview(null)}>Close</button>
              <button className="btn btn-wa btn-sm" onClick={() => { alert('WhatsApp API not yet connected — see backend architecture docs.'); setWaPreview(null); }}>
                📤 Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
