'use client';

import { useState } from 'react';
import { useFleetStore } from '@/store/fleetStore';
import { fmtCurrency, generateWhatsAppMessage } from '@/lib/utils/csv';
import { CARS } from '@/lib/data/seed';
import { ReminderMessage } from '@/lib/types';

async function sendWhatsApp(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export default function RemindersPage() {
  const { drivers, reminders, markReminderSent } = useFleetStore();
  const [selectedReminder, setSelectedReminder] = useState<ReminderMessage | null>(reminders[0] ?? null);
  const [sending, setSending] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [results, setResults] = useState<Record<string, 'sent' | 'failed'>>({});
  const [sentModal, setSentModal] = useState(false);

  const extraReminders: ReminderMessage[] = drivers
    .filter(d => (d.paymentStatus === 'overdue' || d.paymentStatus === 'partial') && d.isActive)
    .filter(d => !reminders.find(r => r.driverId === d.id && r.status === 'pending'))
    .map(d => {
      const car = CARS.find(c => c.rego === d.currentRego);
      return {
        id: `auto_${d.id}`,
        driverId: d.id,
        driverName: (d as any).givenName ? `${(d as any).givenName} ${(d as any).surname}`.trim() : d.name,
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
  const pending = allReminders.filter(r => r.status === 'pending' && !results[r.id]);
  const sent = allReminders.filter(r => r.status === 'sent' || results[r.id] === 'sent');

  const handleSend = async (r: ReminderMessage) => {
    setSending(r.id);
    const result = await sendWhatsApp(r.phone, r.messageBody);
    if (result.success) {
      setResults(prev => ({ ...prev, [r.id]: 'sent' }));
      if (reminders.find(rem => rem.id === r.id)) markReminderSent(r.id);
    } else {
      setResults(prev => ({ ...prev, [r.id]: 'failed' }));
      alert(`Failed to send to ${r.driverName}: ${result.error}`);
    }
    setSending(null);
  };

  const handleSendAll = async () => {
    setSendingAll(true);
    for (const r of pending) {
      await handleSend(r);
    }
    setSendingAll(false);
    setSentModal(true);
  };

  const TYPE_LABELS: Record<string, string> = {
    rent_due: '💰 Rent Due', overdue: '⚠️ Overdue',
    compliance: '📋 Compliance', custom: '✏️ Custom',
  };

  const TYPE_BADGE: Record<string, string> = {
    rent_due: 'badge-blue', overdue: 'badge-red',
    compliance: 'badge-amber', custom: 'badge-gray',
  };

  return (
    <div>
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
          <div className="kpi-value" style={{ fontSize: 14, color: '#15803d' }}>✅ Twilio</div>
          <div className="kpi-sub">WhatsApp connected</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16 }}>
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Queue ({pending.length})</span>
              {pending.length > 0 && (
                <button className="btn btn-wa btn-xs" onClick={handleSendAll} disabled={sendingAll}>
                  {sendingAll ? '⟳ Sending...' : '📤 Send All'}
                </button>
              )}
            </div>
            <div style={{ padding: '8px 0' }}>
              {pending.map(r => (
                <div key={r.id} onClick={() => setSelectedReminder(r)} style={{
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  background: selectedReminder?.id === r.id ? 'var(--surface-2)' : undefined,
                  borderLeft: selectedReminder?.id === r.id ? '3px solid var(--accent)' : '3px solid transparent',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{r.driverName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {r.rego} · {fmtCurrency(r.amountDue)} due · {r.phone}
                      </div>
                    </div>
                    <span className={`badge ${TYPE_BADGE[r.type]}`} style={{ fontSize: 10, flexShrink: 0 }}>
                      {TYPE_LABELS[r.type]}
                    </span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button className="btn btn-wa btn-xs" disabled={sending === r.id}
                      onClick={e => { e.stopPropagation(); handleSend(r); }}>
                      {sending === r.id ? '⟳ Sending...' : '💬 Send'}
                    </button>
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

        <div className="card">
          <div className="card-header">
            <span className="card-title">
              {selectedReminder ? `Preview — ${selectedReminder.driverName}` : 'Select a reminder'}
            </span>
            {selectedReminder && !results[selectedReminder.id] && (
              <button className="btn btn-wa btn-sm" disabled={sending === selectedReminder.id}
                onClick={() => handleSend(selectedReminder)}>
                {sending === selectedReminder.id ? '⟳ Sending...' : '📤 Send via WhatsApp'}
              </button>
            )}
            {selectedReminder && results[selectedReminder.id] === 'sent' && <span className="badge badge-green">✅ Sent</span>}
            {selectedReminder && results[selectedReminder.id] === 'failed' && <span className="badge badge-red">❌ Failed</span>}
          </div>

          {selectedReminder ? (
            <div className="card-body">
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
                <div className="driver-av" style={{ background: '#eff6ff', color: '#1d4ed8', width: 40, height: 40, fontSize: 14 }}>
                  {selectedReminder.driverName.slice(0, 2).toUpperCase()}
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

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Message Preview
                </div>
                <div style={{
                  background: '#dcfce7', borderRadius: '0 12px 12px 12px',
                  padding: '12px 16px', fontSize: 13, lineHeight: 1.65, color: '#14532d',
                  border: '1px solid #86efac', whiteSpace: 'pre-wrap', maxWidth: 420,
                }}>
                  {selectedReminder.messageBody}
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-hint)' }}>
                💡 Twilio WhatsApp Sandbox — drivers must send "join [your-sandbox-word]" to +14155238886 first to receive messages.
              </div>
            </div>
          ) : (
            <div className="card-body" style={{ textAlign: 'center', color: 'var(--text-hint)', padding: '48px 0' }}>
              Select a reminder from the queue to preview the message.
            </div>
          )}
        </div>
      </div>

      {sentModal && (
        <div className="modal-overlay" onClick={() => setSentModal(false)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><span className="modal-title">Reminders Sent</span></div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>All reminders sent via WhatsApp.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-sm" onClick={() => setSentModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
