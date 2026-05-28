'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFleetStore } from '@/store/fleetStore';
import { Driver } from '@/lib/types';
import { CARS } from '@/lib/data/seed';
import { fmtDate, fmtCurrency } from '@/lib/utils/csv';

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'personal' | 'licence' | 'car' | 'bond' | 'emergency' | 'history';

interface CarHistoryEntry {
  id: string;
  rego: string;
  carModel: string;
  weeklyRent: number;
  startDate: string;
  endDate: string | null;
  reason: string;
}

interface Props {
  driver: Driver | null;
  isNew: boolean;
  onClose: () => void;
}

const AU_STATES = ['QLD','NSW','VIC','WA','SA','TAS','ACT','NT'];

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'personal',  label: 'Personal',  icon: '👤' },
  { id: 'licence',   label: 'Licence',   icon: '🪪' },
  { id: 'car',       label: 'Car',       icon: '🚗' },
  { id: 'bond',      label: 'Bond',      icon: '💰' },
  { id: 'emergency', label: 'Emergency', icon: '🆘' },
  { id: 'history',   label: 'History',   icon: '📅' },
];

// ─── Input component — defined OUTSIDE modal to prevent focus loss ─────────
// Must be outside the modal component or React recreates it on every keystroke

interface InputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }: InputProps) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DriverProfileModal({ driver, isNew, onClose }: Props) {
  const { addDriver, updateDriver } = useFleetStore();
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [carHistory, setCarHistory] = useState<CarHistoryEntry[]>([]);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinkReason, setUnlinkReason] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkRego, setLinkRego] = useState('');
  const [linkRent, setLinkRent] = useState('');
  const [linkDate, setLinkDate] = useState(new Date().toISOString().split('T')[0]);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [f, setF] = useState({
    givenName:           (driver as any)?.givenName ?? driver?.name?.split(' ')[0] ?? '',
    surname:             (driver as any)?.surname ?? driver?.name?.split(' ').slice(1).join(' ') ?? '',
    dateOfBirth:         (driver as any)?.dateOfBirth ?? '',
    phone:               driver?.phone ?? '',
    email:               (driver as any)?.email ?? '',
    address:             (driver as any)?.address ?? '',
    licenceNumber:       (driver as any)?.licenceNumber ?? '',
    licenceExpiry:       (driver as any)?.licenceExpiry ?? '',
    licenceState:        (driver as any)?.licenceState ?? 'QLD',
    uberDriverId:        (driver as any)?.uberDriverId ?? '',
    abn:                 (driver as any)?.abn ?? '',
    emergencyName:       (driver as any)?.emergencyName ?? '',
    emergencyPhone:      (driver as any)?.emergencyPhone ?? '',
    emergencyRelation:   (driver as any)?.emergencyRelation ?? '',
    bondAmount:          String((driver as any)?.bondAmount ?? ''),
    bondPaid:            (driver as any)?.bondPaid ?? false,
    bondPaidDate:        (driver as any)?.bondPaidDate ?? '',
    bondReceiptNumber:   (driver as any)?.bondReceiptNumber ?? '',
    currentRego:         driver?.currentRego ?? '',
    weeklyRent:          String(driver?.weeklyRent ?? ''),
    assignmentStartDate: (driver as any)?.assignmentStartDate ?? '',
    notes:               (driver as any)?.notes ?? '',
  });

  // Use useCallback so set() reference is stable — prevents unnecessary re-renders
  const set = useCallback((field: string, value: any) => {
    setF(prev => ({ ...prev, [field]: value }));
  }, []);

  // Load car history for existing driver
  useEffect(() => {
    if (driver?.id) {
      fetch(`/api/car-history?driverId=${driver.id}`)
        .then(r => r.ok ? r.json() : [])
        .then(setCarHistory)
        .catch(() => {});
    }
  }, [driver?.id]);

  // ── Save driver ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!f.givenName.trim()) { setError('Given name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...f,
        weeklyRent: parseFloat(f.weeklyRent) || 0,
        bondAmount: parseFloat(f.bondAmount) || 0,
      };
      if (isNew) {
        await addDriver(payload as any);
      } else if (driver?.id) {
        await updateDriver(driver.id, payload as any);
      }
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  // ── Link a car ───────────────────────────────────────────────────────────────
  const handleLink = async () => {
    if (!linkRego || !driver?.id) return;
    const car = CARS.find(c => c.rego === linkRego);

    await fetch('/api/car-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driverId: driver.id,
        rego: linkRego,
        carModel: car ? `${car.make} ${car.model} ${car.year}` : '',
        weeklyRent: parseFloat(linkRent) || 0,
        startDate: linkDate,
        endDate: null,
        reason: 'New assignment',
      }),
    });

    await updateDriver(driver.id, {
      currentRego: linkRego,
      weeklyRent: parseFloat(linkRent) || 0,
      assignmentStartDate: linkDate,
    } as any);

    setF(prev => ({ ...prev, currentRego: linkRego, weeklyRent: linkRent, assignmentStartDate: linkDate }));

    const h = await fetch(`/api/car-history?driverId=${driver.id}`).then(r => r.json());
    setCarHistory(h);
    setShowLinkModal(false);
    setLinkRego(''); setLinkRent('');
    setLinkDate(new Date().toISOString().split('T')[0]);
  };

  // ── Delink car ───────────────────────────────────────────────────────────────
  const handleDelink = async () => {
    if (!driver?.id || !f.currentRego) return;

    const current = carHistory.find(h => h.endDate === null && h.rego === f.currentRego);
    if (current) {
      await fetch('/api/car-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driver.id,
          rego: f.currentRego,
          carModel: current.carModel,
          weeklyRent: current.weeklyRent,
          startDate: current.startDate,
          endDate: new Date().toISOString().split('T')[0],
          reason: unlinkReason || 'Car returned',
        }),
      });
    }

    await updateDriver(driver.id, { currentRego: '', assignmentStartDate: '' } as any);
    setF(prev => ({ ...prev, currentRego: '', assignmentStartDate: '' }));

    const h = await fetch(`/api/car-history?driverId=${driver.id}`).then(r => r.json());
    setCarHistory(h);
    setShowUnlinkModal(false);
    setUnlinkReason('');
  };

  const currentCar = CARS.find(c => c.rego === f.currentRego);
  const rentalCars = CARS.filter(c => !c.isPersonal);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 600, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">
              {isNew ? 'Add New Driver' : `${f.givenName} ${f.surname}`.trim() || 'Edit Driver'}
            </div>
            {!isNew && driver && (
              <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 2 }}>
                ID: {driver.id.slice(0, 14)}…
              </div>
            )}
          </div>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 2, padding: '10px 16px',
          borderBottom: '1px solid var(--border)', background: 'var(--surface-2)',
          overflowX: 'auto', flexShrink: 0,
        }}>
          {TABS.filter(t => !isNew || t.id !== 'history').map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontSize: 12, whiteSpace: 'nowrap', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* ── PERSONAL ── */}
          {activeTab === 'personal' && (
            <div>
              <div className="form-row">
                <Field label="Given Name *" value={f.givenName} onChange={v => set('givenName', v)} placeholder="e.g. Vishal" />
                <Field label="Surname *" value={f.surname} onChange={v => set('surname', v)} placeholder="e.g. Bravo" />
              </div>
              <div className="form-row">
                <Field label="Date of Birth" value={f.dateOfBirth} onChange={v => set('dateOfBirth', v)} type="date" />
                <Field label="Phone (WhatsApp)" value={f.phone} onChange={v => set('phone', v)} placeholder="+61 4XX XXX XXX" />
              </div>
              <Field label="Email" value={f.email} onChange={v => set('email', v)} type="email" placeholder="driver@email.com" />
              <Field label="Residential Address" value={f.address} onChange={v => set('address', v)} placeholder="25 Bolton Street, Eight Mile Plains QLD 4113" />
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input"
                  placeholder="Any notes about this driver…"
                  value={f.notes}
                  onChange={e => set('notes', e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {/* ── LICENCE ── */}
          {activeTab === 'licence' && (
            <div>
              <div className="form-row">
                <Field label="Licence Number" value={f.licenceNumber} onChange={v => set('licenceNumber', v)} placeholder="141442710" />
                <div className="form-group">
                  <label className="form-label">Issuing State</label>
                  <select className="form-input" value={f.licenceState} onChange={e => set('licenceState', e.target.value)}>
                    {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <Field label="Licence Expiry" value={f.licenceExpiry} onChange={v => set('licenceExpiry', v)} type="date" />

              {f.licenceExpiry && (() => {
                const days = Math.ceil((new Date(f.licenceExpiry).getTime() - Date.now()) / 86400000);
                const color = days < 0 ? '#b91c1c' : days < 60 ? '#b45309' : '#15803d';
                const msg = days < 0 ? `Expired ${Math.abs(days)} days ago` : days < 60 ? `Expires in ${days} days — remind driver` : `Valid for ${days} days`;
                return (
                  <div style={{ background: '#f8fafc', borderRadius: 7, padding: '8px 12px', fontSize: 12, color, marginBottom: 12, border: '1px solid var(--border)' }}>
                    🪪 {msg}
                  </div>
                );
              })()}

              <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Rideshare Details
              </div>
              <div className="form-row">
                <Field label="Uber Driver ID" value={f.uberDriverId} onChange={v => set('uberDriverId', v)} placeholder="e.g. 12345678" />
                <Field label="ABN" value={f.abn} onChange={v => set('abn', v)} placeholder="e.g. 12 345 678 901" />
              </div>
            </div>
          )}

          {/* ── CAR ── */}
          {activeTab === 'car' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Current Assignment
              </div>

              {f.currentRego ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#14532d', fontFamily: 'monospace' }}>{f.currentRego}</div>
                      {currentCar && (
                        <div style={{ fontSize: 13, color: '#166534', marginTop: 2 }}>
                          {currentCar.make} {currentCar.model} {currentCar.year} · {currentCar.colour}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: '#15803d', marginTop: 6 }}>
                        ${f.weeklyRent}/wk · since {f.assignmentStartDate ? fmtDate(f.assignmentStartDate) : '—'}
                      </div>
                    </div>
                    {!isNew && (
                      <button className="btn btn-danger btn-xs" onClick={() => setShowUnlinkModal(true)}>
                        ✕ Delink Car
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--surface-2)', border: '1px dashed var(--border-strong)', borderRadius: 10, padding: '20px', textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🚗</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No car currently assigned</div>
                  {!isNew && (
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => setShowLinkModal(true)}>
                      + Link a Car
                    </button>
                  )}
                </div>
              )}

              {/* Manual fields for new drivers */}
              {isNew && (
                <>
                  <div className="form-group">
                    <label className="form-label">Assign Car</label>
                    <select className="form-input" value={f.currentRego}
                      onChange={e => {
                        const rego = e.target.value;
                        set('currentRego', rego);
                        const car = CARS.find(c => c.rego === rego);
                        if (car && !f.weeklyRent) set('weeklyRent', String(car.weeklyRent));
                      }}>
                      <option value="">— No car yet —</option>
                      {rentalCars.map(c => (
                        <option key={c.rego} value={c.rego}>
                          {c.rego} — {c.make} {c.model} {c.year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <Field label="Weekly Rent ($)" value={f.weeklyRent} onChange={v => set('weeklyRent', v)} type="number" placeholder="325" />
                    <Field label="Assignment Start Date" value={f.assignmentStartDate} onChange={v => set('assignmentStartDate', v)} type="date" />
                  </div>
                </>
              )}

              {/* Compliance info */}
              {currentCar && (
                <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px', fontSize: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 11 }}>
                    Vehicle Compliance
                  </div>
                  {[
                    { label: 'Rego Expiry', value: fmtDate(currentCar.regoExpiry), status: currentCar.regoStatus },
                    { label: 'BHSL Expiry', value: currentCar.bhslExpiry ? fmtDate(currentCar.bhslExpiry) : 'N/A', status: currentCar.bhslStatus },
                    { label: 'BHSL Number', value: currentCar.bhslNumber ?? 'N/A', status: 'ok' },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '0.5px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                      <span style={{
                        fontWeight: 500,
                        color: row.status === 'expired' || row.status === 'due_today' ? '#b91c1c' : row.status === 'warning' ? '#b45309' : '#15803d',
                      }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── BOND ── */}
          {activeTab === 'bond' && (
            <div>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1d4ed8', marginBottom: 16 }}>
                💡 Bond is a security deposit held by the owner. It is refundable on return of the car in good condition.
              </div>
              <div className="form-row">
                <Field label="Bond Amount ($)" value={f.bondAmount} onChange={v => set('bondAmount', v)} type="number" placeholder="650" />
                <div className="form-group">
                  <label className="form-label">Bond Status</label>
                  <select className="form-input" value={f.bondPaid ? 'paid' : 'unpaid'}
                    onChange={e => set('bondPaid', e.target.value === 'paid')}>
                    <option value="unpaid">Not yet paid</option>
                    <option value="paid">Paid ✓</option>
                  </select>
                </div>
              </div>
              {f.bondPaid && (
                <div className="form-row">
                  <Field label="Date Paid" value={f.bondPaidDate} onChange={v => set('bondPaidDate', v)} type="date" />
                  <Field label="Receipt / Reference Number" value={f.bondReceiptNumber} onChange={v => set('bondReceiptNumber', v)} placeholder="e.g. BOND-001" />
                </div>
              )}
              {parseFloat(f.bondAmount) > 0 && (
                <div style={{ marginTop: 12, background: f.bondPaid ? '#f0fdf4' : '#fffbeb', border: `1px solid ${f.bondPaid ? '#bbf7d0' : '#fde68a'}`, borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: f.bondPaid ? '#15803d' : '#b45309' }}>
                    {f.bondPaid ? '✅ Bond Paid' : '⚠️ Bond Not Yet Paid'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Amount: ${f.bondAmount}
                    {f.bondPaid && f.bondPaidDate && ` · Paid: ${fmtDate(f.bondPaidDate)}`}
                    {f.bondPaid && f.bondReceiptNumber && ` · Ref: ${f.bondReceiptNumber}`}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── EMERGENCY ── */}
          {activeTab === 'emergency' && (
            <div>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#b91c1c', marginBottom: 16 }}>
                🆘 Emergency contact is used if the driver is involved in an incident and cannot be reached directly.
              </div>
              <Field label="Contact Full Name" value={f.emergencyName} onChange={v => set('emergencyName', v)} placeholder="e.g. Priya Bravo" />
              <div className="form-row">
                <Field label="Mobile Number" value={f.emergencyPhone} onChange={v => set('emergencyPhone', v)} placeholder="+61 4XX XXX XXX" />
                <Field label="Relationship" value={f.emergencyRelation} onChange={v => set('emergencyRelation', v)} placeholder="e.g. Spouse, Parent" />
              </div>
            </div>
          )}

          {/* ── HISTORY ── */}
          {activeTab === 'history' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Car Assignment History</div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowLinkModal(true)}>
                  + Assign New Car
                </button>
              </div>
              {carHistory.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-hint)', padding: 32, fontSize: 13 }}>
                  No car assignment history yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {carHistory.map(h => (
                    <div key={h.id} style={{
                      background: h.endDate === null ? '#f0fdf4' : 'var(--surface-2)',
                      border: `1px solid ${h.endDate === null ? '#bbf7d0' : 'var(--border)'}`,
                      borderRadius: 8, padding: '12px 14px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <span className="mono" style={{ fontWeight: 700, fontSize: 15 }}>{h.rego}</span>
                          {h.endDate === null && <span className="badge badge-green" style={{ marginLeft: 8 }}>Current</span>}
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{h.carModel}</div>
                        </div>
                        <div className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>${h.weeklyRent}/wk</div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 6 }}>
                        {fmtDate(h.startDate)} → {h.endDate ? fmtDate(h.endDate) : 'present'}
                        {h.reason && ` · ${h.reason}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '10px 14px', fontSize: 13, color: '#b91c1c', marginTop: 12 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Add Driver' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ── Delink Modal ── */}
      {showUnlinkModal && (
        <div className="modal-overlay" style={{ zIndex: 110 }}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <span className="modal-title">Delink Car — {f.currentRego}</span>
              <button className="btn-icon" onClick={() => setShowUnlinkModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                This will end the current assignment and record it in history.
              </p>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <input className="form-input" placeholder="e.g. Car returned, Driver left"
                  value={unlinkReason} onChange={e => setUnlinkReason(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => setShowUnlinkModal(false)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelink}>Confirm Delink</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Link Car Modal ── */}
      {showLinkModal && (
        <div className="modal-overlay" style={{ zIndex: 110 }}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <span className="modal-title">Assign Car to Driver</span>
              <button className="btn-icon" onClick={() => setShowLinkModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Car *</label>
                <select className="form-input" value={linkRego}
                  onChange={e => {
                    setLinkRego(e.target.value);
                    const car = CARS.find(c => c.rego === e.target.value);
                    if (car && !linkRent) setLinkRent(String(car.weeklyRent));
                  }}>
                  <option value="">— Select a car —</option>
                  {rentalCars.map(c => (
                    <option key={c.rego} value={c.rego}>
                      {c.rego} — {c.make} {c.model} {c.year} ({c.colour})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Weekly Rent ($) *</label>
                  <input className="form-input" type="number" placeholder="325"
                    value={linkRent} onChange={e => setLinkRent(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input className="form-input" type="date"
                    value={linkDate} onChange={e => setLinkDate(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => setShowLinkModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleLink} disabled={!linkRego || !linkRent}>
                Assign Car
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
