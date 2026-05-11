'use client';

import { useState } from 'react';
import { useFleetStore } from '@/store/fleetStore';
import { fmtCurrency, generateWhatsAppMessage } from '@/lib/utils/csv';
import { CARS } from '@/lib/data/seed';
import { ReminderMessage } from '@/lib/types';

export default function RemindersPage() {
  const { drivers, reminders, markReminderSent } = useFleetStore();
  const [selectedReminder, setSelectedReminder] = useState<ReminderMessage | null>(reminders[0] ?? null);
  const [sentModal, setSentModal] = useState(false);

  // Build auto-reminders for overdue/partial drivers not already in queue
  const extraReminders: ReminderMessage[] = drivers
    .filter(d => (d.paymentStatus === 'overdue' || d.paymentStatus === 'partial') && d.isActive)
    .filter(d => !reminders.find(r => r.driverId === d.id && r.status === 'pending'))
    .map(d => {
      const car = CARS.find(c => c.rego === d.currentRego);
      return {
        id: `auto_${d.id}`,
        driverId: d.id,
        driverName: d.name,
        phone: d.phone,
        rego: d.currentRego,
        amountDue: d.amountOwed ?? d.weeklyRent,
        weekDue: '5 May 2026',
        type: d.paymentStatus === 'overdue' ? 'overdue' : 'rent_due',
        status: 'pending',
        messageBody: generateWhatsAppMessage(d, car ?? { rego: d.currentRego }, d.amountOwed ?? d.weeklyRent, '5 May 2026'),
      } as ReminderMessage;
    });

  const allReminders = [...reminders, ...extraReminders];
  const pending = allReminders.filter(r => r.status === 'pending');
  const sent = allReminders.filter(r => r.status === 'sent');

  const TYPE_LABELS: Record<string, string> = {
    rent_due: '💰 Rent Due',
    overdue: '⚠️ Overdue',
    compliance: '📋 Compliance',
    custom: '✏️ Custom',
  };

  const TYPE_BADGE: Record<string, string> = {
    rent_due: 'badge-blue',
    overdue: 'badge-red',
    compliance: 'badge-amber',
    custom: 'badge-gray',
  };

  const handleSendAll = () => {
    pending.forEach(r => {
      if (reminders.find(rem => rem.id === r.id)) markReminderSent(r.id);
    });
    setSentModal(true);
  };

  return (
    <div>
      {/* Stats */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-label">Pending Reminders</div>
          <div className="kpi-value" style={{ color: pending.length > 0 ? '#b91c1c' : '#15803d' }}>{pending.length}</div>
          <div className="kpi-sub">awaiting send</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Sent This Cycle</div>
          <div className="kpi-value" style={{ color: '#15803d' }}>{sent.length}</div>
          <div className="kpi-sub">via WhatsApp</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Outstanding</div>
          <div className="kpi-value" style={{ color: '#b91c1c' }}>
            {fmtCurrency(pending.reduce((s, r) => s + r.amountDue, 0))}
          </div>
          <div className="kpi-sub">across {pending.length} drivers</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">API Status</div>
          <div className="kpi-value" style={{ fontSize: 16 }}>Not Connected</div>
          <div className="kpi-sub">Twilio / Meta Cloud API</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>
        {/* Left: reminder list */}
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Queue ({pending.length})</span>
              {pending.length > 0 && (
                <button className="btn btn-wa btn-xs" onClick={handleSendAll}>📤 Send All</button>
              )}
            </div>
            <div style={{ padding: '8px 0' }}>
              {pending.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelectedReminder(r)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    background: selectedReminder?.id === r.id ? 'var(--surface-2)' : undefined,
                    borderLeft: selectedReminder?.id === r.id ? '3px solid var(--accent)' : '3px solid transparent',
                    transition: 'all 0.1s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{r.driverName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {r.rego} · {fmtCurrency(r.amountDue)} due
                      </div>
                    </div>
                    <span className={`badge ${TYPE_BADGE[r.type]}`} style={{ fontSize: 10, flexShrink: 0 }}>
                      {TYPE_LABELS[r.type]}
                    </span>
                  </div>
                </div>
              ))}

              {pending.length === 0 && (
                <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-hint)', fontSize: 13 }}>
                  ✅ No pending reminders
                </div>
              )}

              {sent.length > 0 && (
                <>
                  <div style={{ padding: '8px 14px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Sent
                  </div>
                  {sent.map(r => (
                    <div key={r.id} style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', opacity: 0.6 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{r.driverName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>✅ Sent · {r.rego}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: message preview */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              {selectedReminder ? `Preview — ${selectedReminder.driverName}` : 'Select a reminder'}
            </span>
            {selectedReminder?.status === 'pending' && (
              <button
                className="btn btn-wa btn-sm"
                onClick={() => {
                  if (selectedReminder && reminders.find(r => r.id === selectedReminder.id)) {
                    markReminderSent(selectedReminder.id);
                    setSelectedReminder(s => s ? { ...s, status: 'sent' } : null);
                  }
                }}
              >
                📤 Send via WhatsApp
              </button>
            )}
          </div>

          {selectedReminder ? (
            <div className="card-body">
              {/* Driver info */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                <div className="driver-av" style={{ background: '#eff6ff', color: '#1d4ed8', width: 40, height: 40, fontSize: 14 }}>
                  {selectedReminder.driverName.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{selectedReminder.driverName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedReminder.phone}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedReminder.rego} · Due: {selectedReminder.weekDue}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span className={`badge ${TYPE_BADGE[selectedReminder.type]}`}>{TYPE_LABELS[selectedReminder.type]}</span>
                </div>
              </div>

              {/* WhatsApp bubble */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Message Preview
                </div>
                <div style={{ display: 'flex' }}>
                  <div style={{
                    background: '#dcfce7',
                    borderRadius: '0 12px 12px 12px',
                    padding: '12px 16px',
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: '#14532d',
                    border: '1px solid #86efac',
                    whiteSpace: 'pre-wrap',
                    maxWidth: 420,
                  }}>
                    {selectedReminder.messageBody}
                  </div>
                </div>
              </div>

              {/* Message template editor */}
              <div style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 8 }}>
                💡 Message template editable before sending · Actual WhatsApp delivery via Twilio / Meta Cloud API (backend config required)
              </div>
            </div>
          ) : (
            <div className="card-body" style={{ textAlign: 'center', color: 'var(--text-hint)', padding: '48px 0' }}>
              Select a reminder from the queue to preview the message.
            </div>
          )}
        </div>
      </div>

      {/* Send all confirmation modal */}
      {sentModal && (
        <div className="modal-overlay" onClick={() => setSentModal(false)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Reminders Queued</span>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {pending.length} reminder{pending.length > 1 ? 's' : ''} have been queued for delivery.
                  <br /><br />
                  Connect the Twilio or Meta WhatsApp Cloud API in backend settings to enable real message delivery.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-sm" onClick={() => setSentModal(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
