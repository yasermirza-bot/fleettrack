'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFleetStore } from '@/store/fleetStore';
import { CARS } from '@/lib/data/seed';
import { Contract } from '@/lib/types/contract';

interface Props {
  onClose: () => void;
  onCreated: (contract: Contract) => void;
}

type Step = 'driver' | 'car' | 'terms' | 'guarantor' | 'preview';

const STEPS: { id: Step; label: string; icon: string }[] = [
  { id: 'driver',    label: 'Driver',    icon: '👤' },
  { id: 'car',       label: 'Car',       icon: '🚗' },
  { id: 'terms',     label: 'Terms',     icon: '📋' },
  { id: 'guarantor', label: 'Guarantor', icon: '🤝' },
  { id: 'preview',   label: 'Preview',   icon: '✅' },
];

const TODAY = new Date().toISOString().split('T')[0];

// ── Field component defined OUTSIDE to prevent focus loss on every keystroke ──
interface FieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

function Field({ label, value, onChange, type = 'text', placeholder = '', required = false }: FieldProps) {
  return (
    <div className="form-group">
      <label className="form-label">{label}{required ? ' *' : ''}</label>
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

// ─────────────────────────────────────────────────────────────────────────────

export default function ContractGenerateModal({ onClose, onCreated }: Props) {
  const { drivers } = useFleetStore();
  const [step, setStep] = useState<Step>('driver');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [useExistingDriver, setUseExistingDriver] = useState(true);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  const [form, setForm] = useState({
    driverId: '',
    driverSurname: '',
    driverGivenName: '',
    driverAddress: '',
    driverEmail: '',
    driverPhone: '',
    driverLicense: '',
    driverLicenseExpiry: '',
    carRego: '',
    carModel: '',
    carYear: new Date().getFullYear(),
    weeklyRent: '',
    minimumDuration: '3',
    insurancePolicyNumber: '',
    startDate: TODAY,
    guarantorName: '',
    guarantorPhone: '',
    guarantorEmail: '',
  });

  // Stable setter using useCallback to avoid re-renders
  const set = useCallback((field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Auto-fill from selected existing driver
  useEffect(() => {
    if (!selectedDriverId || !useExistingDriver) return;
    const driver = drivers.find(d => d.id === selectedDriverId);
    if (!driver) return;
    const car = CARS.find(c => c.rego === driver.currentRego);
    setForm(prev => ({
      ...prev,
      driverId: driver.id,
      driverGivenName: (driver as any).givenName || driver.name?.split(' ')[0] || '',
      driverSurname:   (driver as any).surname   || driver.name?.split(' ').slice(1).join(' ') || '',
      driverPhone:     driver.phone || '',
      driverEmail:     (driver as any).email || '',
      driverAddress:   (driver as any).address || '',
      driverLicense:   (driver as any).licenceNumber || '',
      driverLicenseExpiry: (driver as any).licenceExpiry || '',
      carRego:   driver.currentRego || '',
      carModel:  car ? `${car.make} ${car.model}` : '',
      carYear:   car?.year ?? new Date().getFullYear(),
      weeklyRent: String(driver.weeklyRent || ''),
    }));
  }, [selectedDriverId, useExistingDriver]);

  // Auto-fill car details when rego selected
  const handleRegoChange = (rego: string) => {
    set('carRego', rego);
    const car = CARS.find(c => c.rego === rego);
    if (car) {
      set('carModel', `${car.make} ${car.model}`);
      set('carYear', car.year);
      if (!form.weeklyRent) set('weeklyRent', String(car.weeklyRent));
    }
  };

  const rentalCars = CARS.filter(c => !c.isPersonal);
  const currentStepIdx = STEPS.findIndex(s => s.id === step);

  const goNext = () => {
    const idx = STEPS.findIndex(s => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  };

  const goPrev = () => {
    const idx = STEPS.findIndex(s => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, driverId: selectedDriverId || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      const contract = await res.json();
      onCreated(contract);
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div className="modal-header">
          <span className="modal-title">Generate Rental Contract</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Step indicator */}
        <div style={{
          display: 'flex', gap: 4, padding: '12px 20px',
          borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', flexShrink: 0,
        }}>
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              onClick={() => i < currentStepIdx && setStep(s.id)}
              style={{
                flex: 1, textAlign: 'center', fontSize: 11,
                padding: '5px 4px', borderRadius: 6,
                background: s.id === step ? 'var(--accent)' : i < currentStepIdx ? 'var(--green-bg)' : 'transparent',
                color: s.id === step ? '#fff' : i < currentStepIdx ? 'var(--green)' : 'var(--text-hint)',
                cursor: i < currentStepIdx ? 'pointer' : 'default',
                fontWeight: s.id === step ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {s.icon} {s.label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* ── DRIVER STEP ── */}
          {step === 'driver' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  className={`btn ${useExistingDriver ? 'btn-primary' : 'btn-outline'} btn-sm`}
                  onClick={() => setUseExistingDriver(true)}
                >Existing Driver</button>
                <button
                  className={`btn ${!useExistingDriver ? 'btn-primary' : 'btn-outline'} btn-sm`}
                  onClick={() => setUseExistingDriver(false)}
                >New Driver</button>
              </div>

              {useExistingDriver && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Select Driver *</label>
                    <select
                      className="form-input"
                      value={selectedDriverId}
                      onChange={e => setSelectedDriverId(e.target.value)}
                    >
                      <option value="">— Select a driver —</option>
                      {drivers.filter(d => d.isActive).map(d => (
                        <option key={d.id} value={d.id}>
                          {(d as any).givenName || d.name} {(d as any).surname || ''} ({d.currentRego})
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedDriverId && (
                    <div style={{ background: 'var(--blue-bg)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--blue)', marginBottom: 12 }}>
                      ℹ️ Driver details pre-filled. Fill in any missing fields below.
                    </div>
                  )}
                </div>
              )}

              <div className="form-row">
                <Field label="Given Name" value={form.driverGivenName} onChange={v => set('driverGivenName', v)} placeholder="e.g. Vishal" required />
                <Field label="Surname" value={form.driverSurname} onChange={v => set('driverSurname', v)} placeholder="e.g. Bravo" required />
              </div>
              <Field label="Address" value={form.driverAddress} onChange={v => set('driverAddress', v)} placeholder="25 Bolton Street, Eight Mile Plains QLD 4113" />
              <div className="form-row">
                <Field label="Email" value={form.driverEmail} onChange={v => set('driverEmail', v)} type="email" placeholder="driver@email.com" />
                <Field label="Phone" value={form.driverPhone} onChange={v => set('driverPhone', v)} placeholder="+61 4XX XXX XXX" />
              </div>
              <div className="form-row">
                <Field label="Driver Licence Number" value={form.driverLicense} onChange={v => set('driverLicense', v)} placeholder="141442710" required />
                <Field label="Licence Expiry" value={form.driverLicenseExpiry} onChange={v => set('driverLicenseExpiry', v)} type="date" />
              </div>
            </div>
          )}

          {/* ── CAR STEP ── */}
          {step === 'car' && (
            <div>
              <div className="form-group">
                <label className="form-label">Select Fleet Car *</label>
                <select
                  className="form-input"
                  value={form.carRego}
                  onChange={e => handleRegoChange(e.target.value)}
                >
                  <option value="">— Select a car —</option>
                  {rentalCars.map(c => (
                    <option key={c.rego} value={c.rego}>
                      {c.rego} — {c.make} {c.model} {c.year} ({c.colour})
                    </option>
                  ))}
                  <option value="__custom">+ Enter manually</option>
                </select>
              </div>

              {form.carRego === '__custom' && (
                <>
                  <Field label="Registration Number" value={form.carRego} onChange={v => set('carRego', v)} placeholder="e.g. 1ABC123" required />
                  <Field label="Vehicle Model" value={form.carModel} onChange={v => set('carModel', v)} placeholder="e.g. Toyota Camry Hybrid" required />
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input className="form-input" type="number" placeholder="2019"
                      value={form.carYear} onChange={e => set('carYear', parseInt(e.target.value))} />
                  </div>
                </>
              )}

              {form.carRego && form.carRego !== '__custom' && (() => {
                const car = rentalCars.find(c => c.rego === form.carRego);
                if (!car) return null;
                return (
                  <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px', marginTop: 8, fontSize: 13 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Selected vehicle</div>
                    <div><strong>{car.rego}</strong> — {car.make} {car.model} {car.year}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      Colour: {car.colour} · BHSL: {car.bhslNumber ?? 'N/A'}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── TERMS STEP ── */}
          {step === 'terms' && (
            <div>
              <div className="form-row">
                <Field label="Weekly Rent (AUD) *" value={form.weeklyRent} onChange={v => set('weeklyRent', v)} type="number" placeholder="325" />
                <div className="form-group">
                  <label className="form-label">Minimum Duration *</label>
                  <select className="form-input" value={form.minimumDuration} onChange={e => set('minimumDuration', e.target.value)}>
                    <option value="1">1 month</option>
                    <option value="2">2 months</option>
                    <option value="3">3 months (standard)</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                  </select>
                </div>
              </div>
              <Field label="Contract Start Date *" value={form.startDate} onChange={v => set('startDate', v)} type="date" />
              <Field label="Insurance Policy Number *" value={form.insurancePolicyNumber} onChange={v => set('insurancePolicyNumber', v)} placeholder="e.g. BRSC-PL-00811" />
              <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-border)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--amber)', marginTop: 8 }}>
                📋 Payment due each Saturday. Two weeks written notice required for termination.
              </div>
            </div>
          )}

          {/* ── GUARANTOR STEP ── */}
          {step === 'guarantor' && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Guarantor details are optional but recommended for new drivers.
              </p>
              <Field label="Guarantor Full Name" value={form.guarantorName} onChange={v => set('guarantorName', v)} placeholder="e.g. John Smith" />
              <div className="form-row">
                <Field label="Mobile Number" value={form.guarantorPhone} onChange={v => set('guarantorPhone', v)} placeholder="+61 4XX XXX XXX" />
                <Field label="Email Address" value={form.guarantorEmail} onChange={v => set('guarantorEmail', v)} type="email" placeholder="guarantor@email.com" />
              </div>
            </div>
          )}

          {/* ── PREVIEW STEP ── */}
          {step === 'preview' && (
            <div>
              <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--green)', marginBottom: 16 }}>
                ✅ Review the details below. Once generated, a unique signing link will be created.
              </div>
              {[
                { label: 'Driver',           value: `${form.driverGivenName} ${form.driverSurname}` },
                { label: 'Address',          value: form.driverAddress },
                { label: 'Email',            value: form.driverEmail },
                { label: 'Phone',            value: form.driverPhone },
                { label: 'Licence',          value: `${form.driverLicense}${form.driverLicenseExpiry ? ` (exp: ${form.driverLicenseExpiry})` : ''}` },
                { label: 'Car Rego',         value: form.carRego },
                { label: 'Car',              value: `${form.carModel} ${form.carYear}` },
                { label: 'Weekly Rent',      value: `AUD $${form.weeklyRent}` },
                { label: 'Min Duration',     value: `${form.minimumDuration} months` },
                { label: 'Start Date',       value: form.startDate },
                { label: 'Insurance Policy', value: form.insurancePolicyNumber },
                { label: 'Guarantor',        value: form.guarantorName || 'None' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: '0.5px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)', minWidth: 140, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontWeight: 500 }}>{row.value || '—'}</span>
                </div>
              ))}
              {error && (
                <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 7, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginTop: 14 }}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {currentStepIdx > 0 && (
            <button className="btn btn-outline btn-sm" onClick={goPrev}>← Back</button>
          )}
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          {step !== 'preview' ? (
            <button className="btn btn-primary btn-sm" onClick={goNext}>Next →</button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Generating...' : '📄 Generate Contract'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
