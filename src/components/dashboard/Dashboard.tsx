'use client';

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { useFleetStore, selectComplianceAlerts } from '@/store/fleetStore';
import { PORTFOLIO_ROI, WEEKLY_INCOMES, CAR_ROI, CARS } from '@/lib/data/seed';
import { fmtCurrency, fmtDate, daysUntil } from '@/lib/utils/csv';

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  paid: '#15803d', partial: '#b45309', overdue: '#b91c1c', pending: '#6b7280', vacant: '#9ca3af',
};

// Last 20 weeks for the trend chart
const weeklyData = WEEKLY_INCOMES.slice(-24).map((income, i) => ({
  week: `W${WEEKLY_INCOMES.length - 23 + i}`,
  income,
  avg: 2424,
}));

const paymentPieData = [
  { name: 'Paid',    value: 8, color: '#15803d' },
  { name: 'Partial', value: 1, color: '#b45309' },
  { name: 'Overdue', value: 1, color: '#b91c1c' },
  { name: 'Vacant',  value: 1, color: '#d1d5db' },
];

const batchROIData = [
  { batch: 'Batch 1', annualROI: 23.5, tillDateROI: 44.4, revenue: 75200 },
  { batch: 'Batch 2', annualROI: 34.0, tillDateROI: 50.9, revenue: 141756 },
  { batch: 'Batch 3', annualROI: 30.9, tillDateROI: 21.5, revenue: 30370 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.dataKey === 'income' ? fmtCurrency(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { drivers, setActivePage } = useFleetStore();
  const complianceAlerts = selectComplianceAlerts();
  const rentalCars = CARS.filter(c => !c.isPersonal);

  const totalOutstanding = drivers.filter(d => d.isActive).reduce((s, d) => s + (d.amountOwed ?? 0), 0);
  const activeDrivers = drivers.filter(d => d.isActive);
  const paidCount = drivers.filter(d => d.paymentStatus === 'paid').length;

  return (
    <div>
      {/* ── Compliance banner ── */}
      {complianceAlerts.length > 0 && (
        <div className="alert alert-red" style={{ marginBottom: 20, cursor: 'pointer' }} onClick={() => setActivePage('fleet')}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <strong>{complianceAlerts.length} compliance issue{complianceAlerts.length > 1 ? 's' : ''} need urgent attention</strong>
            {' — '}
            {complianceAlerts.slice(0,2).map(c => c.rego).join(', ')}
            {complianceAlerts.length > 2 ? ` +${complianceAlerts.length - 2} more` : ''}
            {' '}(expired rego/BHSL).{' '}
            <span style={{ textDecoration: 'underline' }}>View Fleet →</span>
          </div>
        </div>
      )}

      {/* ── KPI Row ── */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>$</div>
          <div className="kpi-label">Total Portfolio Revenue</div>
          <div className="kpi-value">{fmtCurrency(PORTFOLIO_ROI.totalRevenue, 0)}</div>
          <div className="kpi-sub">29.5% annual ROI</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>↑</div>
          <div className="kpi-label">Net Profit (all batches)</div>
          <div className="kpi-value" style={{ color: '#15803d' }}>{fmtCurrency(PORTFOLIO_ROI.totalNetProfit, 0)}</div>
          <div className="kpi-sub">After depreciation</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#fef2f2', color: '#b91c1c' }}>!</div>
          <div className="kpi-label">Outstanding This Week</div>
          <div className="kpi-value" style={{ color: totalOutstanding > 0 ? '#b91c1c' : '#15803d' }}>
            {fmtCurrency(totalOutstanding)}
          </div>
          <div className="kpi-sub">{drivers.filter(d => d.paymentStatus === 'overdue' || d.paymentStatus === 'partial').length} drivers behind</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#fefce8', color: '#b45309' }}>🚗</div>
          <div className="kpi-label">Fleet Utilisation</div>
          <div className="kpi-value">{Math.round((activeDrivers.length / rentalCars.length) * 100)}%</div>
          <div className="kpi-sub">{activeDrivers.length}/{rentalCars.length} cars assigned · 1 vacant</div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Weekly income trend */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Weekly Income Trend (last 24 weeks)</span>
            <span className="badge badge-blue">Avg {fmtCurrency(2424)}/wk</span>
          </div>
          <div className="card-body" style={{ paddingBottom: 8 }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} barSize={10}>
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" name="Income" radius={[3,3,0,0]}>
                  {weeklyData.map((d, i) => (
                    <Cell key={i} fill={d.income > 3000 ? '#15803d' : d.income > 2424 ? '#0ea5e9' : '#93c5fd'} />
                  ))}
                </Bar>
                <Line dataKey="avg" dot={false} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment status donut */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Driver Payment Status</span>
            <span className="badge badge-gray">Week of 5 May</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={paymentPieData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} dataKey="value" paddingAngle={2}>
                    {paymentPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {paymentPieData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{d.name}</span>
                    <strong>{d.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROI by batch + Top cars ── */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">ROI by Purchase Batch</span>
          </div>
          <div className="card-body" style={{ paddingBottom: 8 }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={batchROIData} barCategoryGap="30%">
                <XAxis dataKey="batch" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="annualROI"   name="Annual ROI"    fill="#0ea5e9" radius={[4,4,0,0]} />
                <Bar dataKey="tillDateROI" name="Till-date ROI" fill="#bae6fd" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#0ea5e9', display: 'inline-block' }} /> Annual ROI</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#bae6fd', display: 'inline-block' }} /> Till-date ROI</span>
            </div>
          </div>
        </div>

        {/* Top 5 cars by revenue */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Top Cars by Total Revenue</span>
            <button className="btn btn-outline btn-xs" onClick={() => setActivePage('reports')}>Full report →</button>
          </div>
          <div style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr><th>Rego</th><th>Revenue</th><th>Weeks</th><th>Collection</th></tr>
              </thead>
              <tbody>
                {CAR_ROI.slice(0, 5).map(c => (
                  <tr key={c.rego}>
                    <td><strong className="mono">{c.rego}</strong></td>
                    <td className="mono" style={{ color: '#15803d' }}>{fmtCurrency(c.totalRevenue)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.totalWeeks}wk</td>
                    <td>
                      <span className={`badge ${c.collectionRate >= 95 ? 'badge-green' : c.collectionRate >= 80 ? 'badge-blue' : 'badge-amber'}`}>
                        {c.collectionRate.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Recent drivers overview ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Driver Overview — Current Week</span>
          <button className="btn btn-outline btn-xs" onClick={() => setActivePage('drivers')}>Manage drivers →</button>
        </div>
        <div style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr><th>Driver</th><th>Rego</th><th>Rent/wk</th><th>Last Payment</th><th>Owed</th><th>Status</th></tr>
            </thead>
            <tbody>
              {drivers.filter(d => d.isActive).map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div className="driver-av" style={{
                        background: d.paymentStatus === 'overdue' ? '#fef2f2' : d.paymentStatus === 'partial' ? '#fffbeb' : '#eff6ff',
                        color: d.paymentStatus === 'overdue' ? '#b91c1c' : d.paymentStatus === 'partial' ? '#b45309' : '#1d4ed8',
                      }}>
                        {d.name.slice(0,2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500 }}>{d.name}</span>
                    </div>
                  </td>
                  <td><span className="mono">{d.currentRego}</span></td>
                  <td className="mono">${d.weeklyRent}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{fmtDate(d.lastPaymentDate ?? '')}</td>
                  <td className="mono" style={{ color: (d.amountOwed ?? 0) > 0 ? '#b91c1c' : '#15803d' }}>
                    {(d.amountOwed ?? 0) > 0 ? fmtCurrency(d.amountOwed ?? 0) : '—'}
                  </td>
                  <td>
                    <span className={`badge ${
                      d.paymentStatus === 'paid'    ? 'badge-green' :
                      d.paymentStatus === 'partial' ? 'badge-amber' :
                      d.paymentStatus === 'overdue' ? 'badge-red'   : 'badge-gray'
                    }`}>
                      {d.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
