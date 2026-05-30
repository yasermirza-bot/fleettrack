'use client';

import { useState, useEffect } from 'react';
import { Contract } from '@/lib/types/contract';
import { fmtDate } from '@/lib/utils/csv';
import ContractGenerateModal from './ContractGenerateModal';

const STATUS_STYLE: Record<string, string> = {
  draft:   'badge-gray',
  sent:    'badge-blue',
  signed:  'badge-green',
  expired: 'badge-red',
};

const STATUS_ICON: Record<string, string> = {
  draft:   '📝',
  sent:    '📤',
  signed:  '✅',
  expired: '⏰',
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [ownerSigning, setOwnerSigning] = useState<string | null>(null);
  const [ownerSignError, setOwnerSignError] = useState('');

  const fetchContracts = async () => {
    try {
      const res = await fetch('/api/contracts');
      if (res.ok) setContracts(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContracts(); }, []);

  const getSigningLink = (token: string) =>
    `${window.location.origin}/sign/${token}`;

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(getSigningLink(token));
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteContract = async (id: string) => {
    if (!confirm('Delete this contract?')) return;
    await fetch(`/api/contracts/${id}`, { method: 'DELETE' });
    setContracts(c => c.filter(x => x.id !== id));
  };

  const addOwnerSignature = async (contractId: string) => {
    setOwnerSigning(contractId);
    setOwnerSignError('');
    try {
      const res = await fetch('/api/contracts/sign-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add signature');
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, ...data } : c));
    } catch (e: any) {
      setOwnerSignError(e.message);
    } finally {
      setOwnerSigning(null);
    }
  };

  const filtered = contracts.filter(c =>
    filterStatus === 'all' || c.status === filterStatus
  );

  const counts = {
    all: contracts.length,
    draft: contracts.filter(c => c.status === 'draft').length,
    sent: contracts.filter(c => c.status === 'sent').length,
    signed: contracts.filter(c => c.status === 'signed').length,
  };

  // Contracts where driver signed but owner hasn't yet
  const awaitingOwner = contracts.filter(c =>
    c.signedAt && !(c as any).ownerSignedAt
  );

  return (
    <div>
      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Contracts</div>
          <div className="kpi-value">{contracts.length}</div>
          <div className="kpi-sub">all time</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Signed</div>
          <div className="kpi-value" style={{ color: '#15803d' }}>{counts.signed}</div>
          <div className="kpi-sub">fully executed</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Awaiting Signature</div>
          <div className="kpi-value" style={{ color: '#b45309' }}>{counts.sent}</div>
          <div className="kpi-sub">link sent to driver</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Need Your Signature</div>
          <div className="kpi-value" style={{ color: awaitingOwner.length > 0 ? '#b91c1c' : '#15803d' }}>
            {awaitingOwner.length}
          </div>
          <div className="kpi-sub">driver signed, awaiting you</div>
        </div>
      </div>

      {/* Alert for contracts needing owner signature */}
      {awaitingOwner.length > 0 && (
        <div className="alert alert-amber" style={{ marginBottom: 16 }}>
          <span>✍️</span>
          <div>
            <strong>{awaitingOwner.length} contract{awaitingOwner.length > 1 ? 's' : ''} need your signature</strong>
            {' — '}
            {awaitingOwner.map(c => `${c.driverGivenName} ${c.driverSurname}`).join(', ')}
          </div>
        </div>
      )}

      {ownerSignError && (
        <div className="alert alert-red" style={{ marginBottom: 16 }}>
          <span>⚠️</span>
          <div>{ownerSignError}
            {ownerSignError.includes('signature') && (
              <span> — <a href="#" onClick={() => {}} style={{ color: 'inherit', fontWeight: 600 }}>Go to Settings to upload your signature</a></span>
            )}
          </div>
        </div>
      )}

      {/* Contracts table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Contracts ({filtered.length})</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              className="form-input"
              style={{ width: 'auto', fontSize: 12, padding: '5px 10px' }}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="signed">Signed</option>
              <option value="expired">Expired</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              + New Contract
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading contracts...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No contracts yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Generate a contract for a driver to read and sign on their phone.
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              + Generate First Contract
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Car</th>
                <th>Weekly Rent</th>
                <th>Start Date</th>
                <th>Driver Signed</th>
                <th>Owner Signed</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {c.driverGivenName} {c.driverSurname}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>{c.driverEmail}</div>
                  </td>
                  <td>
                    <span className="mono" style={{ fontWeight: 600 }}>{c.carRego}</span>
                    <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>{c.carModel} {c.carYear}</div>
                  </td>
                  <td className="mono">${c.weeklyRent}/wk</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {fmtDate(c.startDate?.split('T')[0])}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {c.signedAt
                      ? <span style={{ color: '#15803d' }}>✅ {fmtDate(c.signedAt.split('T')[0])}</span>
                      : <span style={{ color: 'var(--text-hint)' }}>Pending</span>
                    }
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {(c as any).ownerSignedAt
                      ? <span style={{ color: '#15803d' }}>✅ {fmtDate((c as any).ownerSignedAt.split('T')[0])}</span>
                      : c.signedAt
                        ? <button
                            className="btn btn-primary btn-xs"
                            onClick={() => addOwnerSignature(c.id)}
                            disabled={ownerSigning === c.id}
                          >
                            {ownerSigning === c.id ? '...' : '✍️ Sign Now'}
                          </button>
                        : <span style={{ color: 'var(--text-hint)' }}>—</span>
                    }
                  </td>
                  <td>
                    <span className={`badge ${STATUS_STYLE[c.status]}`}>
                      {STATUS_ICON[c.status]} {c.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {c.status !== 'signed' && (
                        <button
                          className="btn-icon"
                          title="Copy signing link"
                          onClick={() => copyLink(c.signingToken)}
                        >
                          {copiedId === c.signingToken ? '✓' : '🔗'}
                        </button>
                      )}
                      {c.status !== 'signed' && (
                        <button
                          className="btn-icon wa"
                          title="Send via WhatsApp"
                          onClick={() => {
                            const msg = encodeURIComponent(
                              `Hi ${c.driverGivenName}, please review and sign your FleetTrack rental agreement:\n${getSigningLink(c.signingToken)}`
                            );
                            window.open(`https://wa.me/${c.driverPhone?.replace(/\D/g,'')}?text=${msg}`, '_blank');
                          }}
                        >💬</button>
                      )}
                      <button
                        className="btn-icon"
                        title="View contract"
                        onClick={() => window.open(`/sign/${c.signingToken}`, '_blank')}
                      >👁</button>
                      <button
                        className="btn-icon danger"
                        title="Delete contract"
                        onClick={() => deleteContract(c.id)}
                      >🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <ContractGenerateModal
          onClose={() => setShowModal(false)}
          onCreated={(contract) => {
            setContracts(prev => [contract, ...prev]);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}
