'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { PORTFOLIO_ROI, CAR_ROI, WEEKLY_INCOMES } from '@/lib/data/seed';
import { fmtCurrency } from '@/lib/utils/csv';

const CustomTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color ?? 'var(--text-primary)' }}>
          {p.name}: {p.name.includes('ROI') || p.name.includes('%') ? `${Number(p.value).toFixed(1)}%` : fmtCurrency(p.value)}
        </div>
      ))}
    </div>
  );
};

// Monthly income grouping (every 4 weeks ≈ 1 month)
const monthlyData: { month: string; income: number }[] = [];
for (let i = 0; i < Math.floor(WEEKLY_INCOMES.length / 4); i++) {
  const slice = WEEKLY_INCOMES.slice(i * 4, i * 4 + 4);
  monthlyData.push({
    month: `M${i + 1}`,
    income: slice.reduce((a, b) => a + b, 0),
  });
}

const batchBreakdown = [
  { batch: 'Batch 1', revenue: 75200, opCost: 38889, netProfit: 31042, annualROI: 23.5, cars: 2 },
  { batch: 'Batch 2', revenue: 141756, opCost: 76486, netProfit: 65269, annualROI: 34.0, cars: 6 },
  { batch: 'Batch 3', revenue: 30370, opCost: 17396, netProfit: 12973, annualROI: 30.9, cars: 4 },
];

export default function ReportsPage() {
  const avgWeekly = Math.round(WEEKLY_INCOMES.filter(w => w > 0).reduce((a, b) => a + b, 0) / WEEKLY_INCOMES.filter(w => w > 0).length);

  return (
    <div>
      {/* Portfolio KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Portfolio Revenue</div>
          <div className="kpi-value">{fmtCurrency(PORTFOLIO_ROI.totalRevenue, 0)}</div>
          <div className="kpi-sub">across all 12 cars</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Net Profit (after deprec.)</div>
          <div className="kpi-value" style={{ color: '#15803d' }}>{fmtCurrency(PORTFOLIO_ROI.totalNetProfit, 0)}</div>
          <div className="kpi-sub">Gross: {fmtCurrency(PORTFOLIO_ROI.totalGrossProfit, 0)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Combined Annual ROI</div>
          <div className="kpi-value" style={{ color: '#0ea5e9' }}>{PORTFOLIO_ROI.annualROI.toFixed(1)}%</div>
          <div className="kpi-sub">Till-date: {PORTFOLIO_ROI.tillDateROI.toFixed(1)}%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Portfolio Worth</div>
          <div className="kpi-value">{fmtCurrency(PORTFOLIO_ROI.totalWorth, 0)}</div>
          <div className="kpi-sub">Assets {fmtCurrency(PORTFOLIO_ROI.totalAssetValue, 0)} + profits</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Monthly income */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Monthly Income (all cars combined)</span>
          </div>
          <div className="card-body" style={{ paddingBottom: 8 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={16}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTip />} />
                <Bar dataKey="income" name="Monthly Income" radius={[4,4,0,0]}>
                  {monthlyData.map((d, i) => (
                    <Cell key={i} fill={d.income > 10000 ? '#15803d' : d.income > 7000 ? '#0ea5e9' : '#93c5fd'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Batch ROI comparison */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">ROI by Purchase Batch</span>
          </div>
          <div className="card-body">
            {batchBreakdown.map(b => (
              <div key={b.batch} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{b.batch}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 8 }}>{b.cars} cars</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: 12, color: '#15803d' }}>{fmtCurrency(b.netProfit, 0)} profit</span>
                    <span className="badge badge-blue">{b.annualROI}% annual</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  <span>Revenue: <strong>{fmtCurrency(b.revenue, 0)}</strong></span>
                  <span>Op Cost: <strong>{fmtCurrency(b.opCost, 0)}</strong></span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${b.annualROI * 2}%`, background: b.annualROI > 30 ? '#15803d' : '#0ea5e9' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-car ROI table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Per-Car Revenue & ROI Performance</span>
          <button className="btn btn-outline btn-sm">📥 Export CSV</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rego</th>
              <th>Total Revenue</th>
              <th>Weeks Active</th>
              <th>Avg / Week</th>
              <th>Target</th>
              <th>Collection Rate</th>
              <th>Net Profit</th>
              <th>Annual ROI</th>
              <th>Asset Value</th>
            </tr>
          </thead>
          <tbody>
            {CAR_ROI.map(c => (
              <tr key={c.rego}>
                <td><strong className="mono">{c.rego}</strong></td>
                <td className="mono" style={{ color: '#15803d' }}>{fmtCurrency(c.totalRevenue, 0)}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{c.totalWeeks}</td>
                <td className="mono">{fmtCurrency(c.avgWeeklyActual, 0)}</td>
                <td className="mono" style={{ color: 'var(--text-hint)' }}>{fmtCurrency(c.projectedWeeklyRent, 0)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, background: 'var(--surface-3)', borderRadius: 3, height: 5, overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(c.collectionRate, 100)}%`,
                        height: 5,
                        background: c.collectionRate >= 95 ? '#15803d' : c.collectionRate >= 80 ? '#0ea5e9' : '#b91c1c',
                        borderRadius: 3,
                      }} />
                    </div>
                    <span style={{ fontSize: 12, color: c.collectionRate >= 90 ? '#15803d' : c.collectionRate >= 80 ? '#b45309' : '#b91c1c', fontWeight: 500 }}>
                      {c.collectionRate.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="mono" style={{ color: '#15803d' }}>{fmtCurrency(c.netProfit, 0)}</td>
                <td>
                  <span className={`badge ${c.annualROI >= 35 ? 'badge-green' : c.annualROI >= 25 ? 'badge-blue' : 'badge-amber'}`}>
                    {c.annualROI.toFixed(1)}%
                  </span>
                </td>
                <td className="mono" style={{ color: c.remainingAssetValue > 0 ? undefined : '#b91c1c', fontSize: 12 }}>
                  {fmtCurrency(c.remainingAssetValue, 0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--surface-2)', fontWeight: 600 }}>
              <td>TOTAL</td>
              <td className="mono" style={{ color: '#15803d' }}>{fmtCurrency(CAR_ROI.reduce((s,c) => s + c.totalRevenue, 0), 0)}</td>
              <td style={{ color: 'var(--text-secondary)' }}>849 wks</td>
              <td className="mono">{fmtCurrency(avgWeekly, 0)}</td>
              <td>—</td>
              <td>—</td>
              <td className="mono" style={{ color: '#15803d' }}>{fmtCurrency(PORTFOLIO_ROI.totalNetProfit, 0)}</td>
              <td><span className="badge badge-blue">{PORTFOLIO_ROI.annualROI.toFixed(1)}%</span></td>
              <td className="mono">{fmtCurrency(PORTFOLIO_ROI.totalAssetValue, 0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ROI insights */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Key Insights</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: '🏆', title: 'Best performing car', body: '064LP3 (Blue Camry) — $37,061 total revenue. Note: includes bond payments, collection rate inflated at 147%.' },
              { icon: '⚠️', title: 'Lowest collection rate', body: '796KD6 (Hammad) at 70.7%. Avg/wk $205 vs $290 target. Consider reviewing terms or car assignment.' },
              { icon: '📈', title: 'Best annual ROI', body: 'Batch 2 at 34.0%. 725KW9 leads individually at 46.3% annual ROI — strong performer.' },
              { icon: '🚗', title: 'Vacant car cost', body: '123OG6 currently unassigned. At $340/wk target, each idle week = $340 lost revenue. Find a new driver ASAP.' },
              { icon: '💡', title: 'Bond vs Rent tracking', body: 'Bond payments are currently mixed with rent in transactions. Separate tracking recommended for accurate collection rates.' },
              { icon: '📊', title: 'Portfolio growth', body: 'Weekly income grew from ~$700 in early weeks to $3,000–$4,000 as fleet expanded. Current avg $2,424/wk.' },
            ].map(ins => (
              <div key={ins.title} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 18 }}>{ins.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{ins.title}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>{ins.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
