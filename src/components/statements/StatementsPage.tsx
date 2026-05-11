'use client';

import { useRef, useState } from 'react';
import { useFleetStore } from '@/store/fleetStore';
import { parseCSV } from '@/lib/utils/csv';
import { BankTransaction, UploadBatch } from '@/lib/types';
import { fmtCurrency, fmtDate } from '@/lib/utils/csv';

const METHOD_LABELS: Record<string, string> = {
  fast_transfer: 'Fast Transfer',
  payid: 'PayID / OSKO',
  direct_credit: 'Direct Credit',
  optec: 'OptecAus',
  cash: 'Cash',
  unknown: '—',
};

const METHOD_COLORS: Record<string, string> = {
  fast_transfer: 'badge-blue',
  payid: 'badge-green',
  direct_credit: 'badge-gray',
  optec: 'badge-amber',
  cash: 'badge-gray',
  unknown: 'badge-gray',
};

export default function StatementsPage() {
  const { transactions, uploadBatches, addTransactions } = useFleetStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterMatch, setFilterMatch] = useState('all');
  const [searchDesc, setSearchDesc] = useState('');

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseErrors(['Only CSV files are supported. Export your bank statement as CSV.']);
      return;
    }

    setUploading(true);
    setProgress(0);
    setParseErrors([]);

    // Simulate progressive upload UX
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(interval); return p; }
        return p + Math.random() * 18;
      });
    }, 100);

    const reader = new FileReader();
    reader.onload = (e) => {
      clearInterval(interval);
      setProgress(100);

      const text = e.target?.result as string;
      const batchId = `batch_${Date.now()}`;
      const result = parseCSV(text, batchId);

      if (result.errors.length) setParseErrors(result.errors);

      const batch: UploadBatch = {
        id: batchId,
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        rowCount: result.rowCount,
        dateRangeStart: result.dateRangeStart,
        dateRangeEnd: result.dateRangeEnd,
        matchedCount: result.transactions.filter(t => t.matchStatus === 'matched').length,
        unmatchedCount: result.transactions.filter(t => t.matchStatus === 'unmatched').length,
        totalCredits: result.totalCredits,
      };

      addTransactions(result.transactions, batch);
      setTimeout(() => setUploading(false), 400);
    };

    reader.readAsText(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const filtered = transactions.filter(t => {
    const matchBatch = filterBatch === 'all' || t.uploadBatchId === filterBatch;
    const matchStatus = filterMatch === 'all' || t.matchStatus === filterMatch;
    const matchSearch = !searchDesc || t.description.toLowerCase().includes(searchDesc.toLowerCase()) || t.reference.toLowerCase().includes(searchDesc.toLowerCase());
    return matchBatch && matchStatus && matchSearch;
  });

  const credits = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const unmatched = filtered.filter(t => t.matchStatus === 'unmatched' && t.amount > 0);

  return (
    <div>
      {/* Upload area */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Upload Bank Statement</span>
          <span className="badge badge-gray">CBA · ANZ · Westpac · NAB · St George</span>
        </div>
        <div className="card-body">
          <div
            className="upload-zone"
            onDragOver={e => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Drop CSV bank statement here</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Export from your bank's internet banking · Supports all major Australian bank formats
            </div>
            <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
              📂 Browse file
            </button>
            <input ref={fileRef} type="file" accept=".csv" hidden onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          </div>

          {uploading && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                <span>Parsing transactions…</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {parseErrors.length > 0 && (
            <div className="alert alert-red" style={{ marginTop: 12 }}>
              <span>⚠️</span>
              <div>
                <strong>Parse issues:</strong>
                <ul style={{ marginTop: 4, paddingLeft: 16 }}>
                  {parseErrors.map((e, i) => <li key={i} style={{ fontSize: 12 }}>{e}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Previous uploads */}
      {uploadBatches.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <span className="card-title">Upload History</span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>File</th><th>Uploaded</th><th>Date Range</th><th>Transactions</th><th>Matched</th><th>Credits</th></tr>
            </thead>
            <tbody>
              {uploadBatches.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 500 }}>📄 {b.filename}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{fmtDate(b.uploadedAt.split('T')[0])}</td>
                  <td style={{ fontSize: 12 }}>{fmtDate(b.dateRangeStart)} – {fmtDate(b.dateRangeEnd)}</td>
                  <td>{b.rowCount}</td>
                  <td>
                    <span className="badge badge-green">{b.matchedCount} matched</span>
                    {b.unmatchedCount > 0 && <span className="badge badge-amber" style={{ marginLeft: 4 }}>{b.unmatchedCount} unmatched</span>}
                  </td>
                  <td className="mono" style={{ color: '#15803d' }}>{fmtCurrency(b.totalCredits)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transactions table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Transactions ({filtered.length})</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="form-input" style={{ width: 'auto', fontSize: 12, padding: '5px 10px' }} value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
              <option value="all">All uploads</option>
              {uploadBatches.map(b => <option key={b.id} value={b.id}>{b.filename}</option>)}
            </select>
            <select className="form-input" style={{ width: 'auto', fontSize: 12, padding: '5px 10px' }} value={filterMatch} onChange={e => setFilterMatch(e.target.value)}>
              <option value="all">All status</option>
              <option value="matched">Matched</option>
              <option value="partial">Partial</option>
              <option value="unmatched">Unmatched</option>
            </select>
            <input
              className="form-input"
              style={{ width: 220, fontSize: 12 }}
              placeholder="Search description…"
              value={searchDesc}
              onChange={e => setSearchDesc(e.target.value)}
            />
          </div>
        </div>

        {unmatched.length > 0 && (
          <div className="alert alert-amber" style={{ margin: '12px 16px 0', borderRadius: 7 }}>
            <span>ℹ️</span>
            <span>{unmatched.length} unmatched credit{unmatched.length > 1 ? 's' : ''} ({fmtCurrency(unmatched.reduce((s,t) => s + t.amount, 0))}) need manual review in Reconciliation.</span>
          </div>
        )}

        <table className="data-table" style={{ marginTop: 8 }}>
          <thead>
            <tr><th>Date</th><th>Description</th><th>Reference</th><th>Method</th><th>Amount</th><th>Matched To</th><th>Status</th></tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(t.date)}</td>
                <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }} title={t.description}>
                  {t.description}
                </td>
                <td className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.reference || '—'}</td>
                <td><span className={`badge ${METHOD_COLORS[t.paymentMethod]}`} style={{ fontSize: 10 }}>{METHOD_LABELS[t.paymentMethod]}</span></td>
                <td className="mono" style={{ fontWeight: 600, color: t.amount > 0 ? '#15803d' : '#b91c1c' }}>
                  {t.amount > 0 ? '+' : ''}{fmtCurrency(t.amount)}
                </td>
                <td style={{ fontSize: 12 }}>
                  {t.matchedDriverName
                    ? <span style={{ fontWeight: 500 }}>{t.matchedDriverName}</span>
                    : <span style={{ color: 'var(--text-hint)' }}>—</span>
                  }
                </td>
                <td>
                  <span className={`badge ${
                    t.matchStatus === 'matched'   ? 'badge-green' :
                    t.matchStatus === 'partial'   ? 'badge-amber' :
                    t.matchStatus === 'manual'    ? 'badge-blue'  : 'badge-red'
                  }`}>
                    {t.matchStatus === 'unmatched' && t.amount < 0 ? 'debit' : t.matchStatus}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-hint)', padding: 32 }}>
                No transactions. Upload a CSV bank statement above.
              </td></tr>
            )}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 24, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span>Total credits: <strong style={{ color: '#15803d' }}>{fmtCurrency(credits)}</strong></span>
            <span>Matched: <strong>{filtered.filter(t => t.matchStatus === 'matched').length}</strong></span>
            <span>Unmatched: <strong style={{ color: filtered.filter(t => t.matchStatus === 'unmatched' && t.amount > 0).length > 0 ? '#b91c1c' : 'inherit' }}>
              {filtered.filter(t => t.matchStatus === 'unmatched').length}
            </strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
