'use client';

import { CARS } from '@/lib/data/seed';
import { useFleetStore } from '@/store/fleetStore';
import { fmtDate, complianceBadge, daysUntil } from '@/lib/utils/csv';

export default function FleetPage() {
  const { drivers } = useFleetStore();

  const rentalCars = CARS.filter(c => !c.isPersonal);
  const personalCars = CARS.filter(c => c.isPersonal);
  const urgent = CARS.filter(c => !c.isPersonal && (c.regoStatus === 'expired' || c.regoStatus === 'due_today' || c.bhslStatus === 'expired'));
  const warnings = CARS.filter(c => !c.isPersonal && (c.regoStatus === 'warning' || c.bhslStatus === 'warning'));

  const getDriver = (id: string | null) => id ? drivers.find(d => d.id === id) : null;

  const CompBadge = ({ iso, status }: { iso: string | null, status: string }) => {
    const b = complianceBadge(iso);
    const cls = b.variant === 'ok' ? 'badge-green' : b.variant === 'warning' ? 'badge-amber' : 'badge-red';
    return <span className={`badge ${cls}`}>{b.label}</span>;
  };

  return (
    <div>
      {/* Urgent alerts */}
      {urgent.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {urgent.map(c => {
            const isRegoExp = c.regoStatus === 'expired' || c.regoStatus === 'due_today';
            const isBhslExp = c.bhslStatus === 'expired';
            return (
              <div key={c.rego} className="alert alert-red" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>🚨</span>
                <div>
                  <strong>{c.rego} ({c.model} {c.year})</strong>
                  {isRegoExp && ` — Rego ${c.regoStatus === 'due_today' ? 'due TODAY' : `expired ${Math.abs(daysUntil(c.regoExpiry))} days ago`}.`}
                  {isBhslExp && ` — BHSL expired ${Math.abs(daysUntil(c.bhslExpiry ?? ''))} days ago (rideshare accreditation invalid).`}
                  {' '}Driver: <strong>{getDriver(c.assignedDriverId)?.name ?? 'Unassigned'}</strong>.
                  {isRegoExp && ' Do not allow vehicle to operate until renewed.'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {warnings.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {warnings.map(c => (
            <div key={c.rego} className="alert alert-amber" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
              <div>
                <strong>{c.rego}</strong>
                {c.bhslStatus === 'warning' && ` — BHSL expires ${fmtDate(c.bhslExpiry ?? '')} (${daysUntil(c.bhslExpiry ?? '')} days). Book inspection now.`}
                {' '}Driver: {getDriver(c.assignedDriverId)?.name ?? 'Unassigned'}.
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-label">Rental Fleet</div>
          <div className="kpi-value">{rentalCars.length}</div>
          <div className="kpi-sub">rideshare cars (CTP Class 4)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Currently Assigned</div>
          <div className="kpi-value" style={{ color: '#15803d' }}>
            {rentalCars.filter(c => c.assignedDriverId).length}
          </div>
          <div className="kpi-sub">{rentalCars.filter(c => !c.assignedDriverId).length} vacant</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Compliance Alerts</div>
          <div className="kpi-value" style={{ color: urgent.length > 0 ? '#b91c1c' : '#b45309' }}>
            {urgent.length + warnings.length}
          </div>
          <div className="kpi-sub">{urgent.length} urgent · {warnings.length} upcoming</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Personal Vehicles</div>
          <div className="kpi-value">{personalCars.length}</div>
          <div className="kpi-sub">LC200 · Hummer · CX-9</div>
        </div>
      </div>

      {/* Rental fleet table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Rental Fleet — {rentalCars.length} cars</span>
          <span className="badge badge-blue">CTP Class 4 — Rideshare</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rego</th>
              <th>Car</th>
              <th>Colour</th>
              <th>Driver</th>
              <th>Wkly Rent</th>
              <th>Batch</th>
              <th>Rego Expiry</th>
              <th>BHSL Expiry</th>
              <th>BHSL #</th>
            </tr>
          </thead>
          <tbody>
            {rentalCars.map(c => {
              const driver = getDriver(c.assignedDriverId);
              const regoBadge = complianceBadge(c.regoExpiry);
              const bhslBadge = complianceBadge(c.bhslExpiry);

              const regoVariantClass = regoBadge.variant === 'ok' ? 'badge-green' : regoBadge.variant === 'warning' ? 'badge-amber' : 'badge-red';
              const bhslVariantClass = bhslBadge.variant === 'ok' ? 'badge-green' : bhslBadge.variant === 'warning' ? 'badge-amber' : 'badge-red';

              return (
                <tr key={c.rego} style={{ background: c.regoStatus === 'expired' || c.regoStatus === 'due_today' || c.bhslStatus === 'expired' ? '#fef2f2' : undefined }}>
                  <td><strong className="mono">{c.rego}</strong></td>
                  <td>{c.make} {c.model} {c.year}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.colour}</td>
                  <td>
                    {driver
                      ? <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div className="driver-av" style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: 10, width: 26, height: 26 }}>
                            {driver.name.slice(0,2).toUpperCase()}
                          </div>
                          {driver.name}
                        </div>
                      : <span style={{ color: '#b91c1c', fontWeight: 500 }}>⚠ Vacant</span>
                    }
                  </td>
                  <td className="mono">${c.weeklyRent}/wk</td>
                  <td>
                    {c.batch ? <span className="badge badge-gray">Batch {c.batch}</span> : '—'}
                  </td>
                  <td><span className={`badge ${regoVariantClass}`}>{regoBadge.label}</span></td>
                  <td><span className={`badge ${bhslVariantClass}`}>{bhslBadge.label}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }} className="mono">{c.bhslNumber ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Personal vehicles */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Personal Vehicles — {personalCars.length} cars</span>
          <span className="badge badge-gray">CTP Class 1 — No BHSL required</span>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Rego</th><th>Vehicle</th><th>Colour</th><th>Rego Expiry</th><th>Notes</th></tr>
          </thead>
          <tbody>
            {personalCars.map(c => {
              const b = complianceBadge(c.regoExpiry);
              return (
                <tr key={c.rego}>
                  <td><strong className="mono">{c.rego}</strong></td>
                  <td>{c.make} {c.model} {c.year}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.colour}</td>
                  <td><span className={`badge ${b.variant === 'ok' ? 'badge-green' : 'badge-amber'}`}>{b.label}</span></td>
                  <td style={{ color: 'var(--text-hint)', fontSize: 12 }}>Self-driven · no rideshare</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
