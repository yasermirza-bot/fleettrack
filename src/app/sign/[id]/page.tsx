'use client';

import { useEffect, useRef, useState } from 'react';
import { Contract } from '@/lib/types/contract';

export default function SignPage({ params }: { params: { id: string } }) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [justSigned, setJustSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    fetch(`/api/contracts/${params.id}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(data => {
        setContract(data);
        if (data.status === 'signed') setAlreadySigned(true);
      })
      .catch(() => setError('Contract not found or link has expired.'))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = 160;
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [contract, alreadySigned]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
    setHasSignature(true);
  };

  const stopDraw = () => { isDrawing.current = false; };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const submitSignature = async () => {
    if (!hasSignature || !agreed || !contract) return;
    setSubmitting(true);
    try {
      const canvas = canvasRef.current!;
      const signatureDataUrl = canvas.toDataURL('image/png');
      const res = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureDataUrl }),
      });
      if (!res.ok) throw new Error('Failed to save signature');
      const updated = await res.json();
      setContract(updated);
      setJustSigned(true);
      setAlreadySigned(true);
    } catch (e) {
      setError('Failed to submit signature. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = (iso?: string) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return iso; }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading contract...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20 }}>
      <div style={{ textAlign: 'center', background: '#fff', borderRadius: 12, padding: 32, maxWidth: 360 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>❌</div>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Contract Not Found</div>
        <div style={{ color: '#6b7280', fontSize: 14 }}>{error}</div>
      </div>
    </div>
  );

  if (!contract) return null;

  const ContractDocument = () => (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '28px 24px', marginBottom: 20, lineHeight: 1.7, fontSize: 14, color: '#1a1a1a' }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>
        Car Rental Owner/Driver Agreement
      </h1>
      <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13, marginBottom: 24 }}>
        {alreadySigned && !justSigned ? `Signed on ${fmtDate(contract.signedAt)}` : 'Please read this document from start to finish before signing.'}
      </p>

      <h2 style={{ fontSize: 14, fontWeight: 700, background: '#f0f4f8', padding: '8px 12px', borderRadius: 6, marginBottom: 12 }}>PART A — DETAILS</h2>

      <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Item 1. Owner's Details (Optecaus Pty Ltd)</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 13 }}>
        {[
          ['Surname', 'MIRZA'],
          ['Given Name', 'YASER'],
          ['Address', contract.ownerAddress],
          ['Telephone', contract.ownerPhone],
          ['Email', contract.ownerEmail],
        ].map(([k, v]) => (
          <tr key={k} style={{ borderBottom: '0.5px solid #e5e7eb' }}>
            <td style={{ padding: '5px 8px', color: '#6b7280', width: 140 }}>{k}</td>
            <td style={{ padding: '5px 8px', fontWeight: 600 }}>{v}</td>
          </tr>
        ))}
      </table>

      <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Item 2. Driver's Details</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 13 }}>
        {[
          ['Surname', contract.driverSurname?.toUpperCase()],
          ['Given Name', contract.driverGivenName?.toUpperCase()],
          ['Address', contract.driverAddress],
          ['Email', contract.driverEmail],
          ['Driver Licence', contract.driverLicense],
          ['Licence Expiry', fmtDate(contract.driverLicenseExpiry)],
        ].map(([k, v]) => (
          <tr key={k} style={{ borderBottom: '0.5px solid #e5e7eb' }}>
            <td style={{ padding: '5px 8px', color: '#6b7280', width: 140 }}>{k}</td>
            <td style={{ padding: '5px 8px', fontWeight: 600 }}>{v}</td>
          </tr>
        ))}
      </table>

      <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Item 3. Background</h3>
      <p style={{ fontSize: 13, marginBottom: 16 }}>
        YASER MIRZA (known as Owner) wishes to engage <strong>{contract.driverGivenName}</strong> (known as Driver) in a Uber/rideshare/taxi service where the Owner agrees to release the car to the Driver to drive in line with the below stipulated terms and conditions.
      </p>

      <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Item 4. Car Details</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 13 }}>
        {[
          ['Registration', contract.carRego],
          ['Vehicle', `${contract.carModel} ${contract.carYear}`],
        ].map(([k, v]) => (
          <tr key={k} style={{ borderBottom: '0.5px solid #e5e7eb' }}>
            <td style={{ padding: '5px 8px', color: '#6b7280', width: 140 }}>{k}</td>
            <td style={{ padding: '5px 8px', fontWeight: 600 }}>{v}</td>
          </tr>
        ))}
      </table>

      <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Item 5. Payment</h3>
      <p style={{ fontSize: 13, marginBottom: 16 }}>
        Irrespective of how much the Driver makes on a weekly basis, the parties agreed that a sum of <strong>AUD ${contract.weeklyRent}</strong> will be due to the Owner on a weekly basis. Payment must be reflected in the parties' bank account on or before Saturday morning of every new week.
      </p>

      <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Item 6. Duration</h3>
      <p style={{ fontSize: 13, marginBottom: 16 }}>
        This agreement will last for a minimum of <strong>{contract.minimumDuration} months</strong>, commencing <strong>{fmtDate(contract.startDate)}</strong>. It is automatically renewable after that on a monthly basis.
      </p>

      <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Item 7. Insurance</h3>
      <p style={{ fontSize: 13, marginBottom: 16 }}>
        The vehicle is insured under a comprehensive Auto Insurance Policy. Policy number: <strong>{contract.insurancePolicyNumber}</strong>.
      </p>

      <h2 style={{ fontSize: 14, fontWeight: 700, background: '#f0f4f8', padding: '8px 12px', borderRadius: 6, marginBottom: 12, marginTop: 24 }}>
        PART B — GENERAL CONDITIONS
      </h2>

      {[
        { title: '1. Possession and Use of Car', content: 'The Owner allows the Driver to take possession of the car and to use all Equipment in the car in accordance with the terms of this Agreement.' },
        { title: '2. Life of Agreement', content: `This Agreement begins when both parties have signed this document. This Agreement ends two weeks after notice of termination by either party. Minimum duration is ${contract.minimumDuration} months.` },
        { title: '3. Payment', content: `Driver must remit on a weekly basis a sum of AUD $${contract.weeklyRent} to the Owner. Both parties must maintain a record of all payments made.` },
        { title: '4. Maintenance Costs', content: 'The Driver shall pay all operating and maintenance costs including: fuel, excess on insurance claims, and any damage caused. The Owner will be responsible for: vehicle licence renewal, roadworthiness renewal, insurance renewal, service costs, oils, lubricants, and tyres.' },
        { title: '5. Insurance & Incidents', content: 'The Owner will maintain a comprehensive auto insurance policy at all times. If an incident occurs, the Driver must tell the Owner within 24 hours. The Driver is responsible for the excess on any insurance claim.' },
        { title: '6. Fines', content: 'The Driver agrees that they will be responsible for all fines that occur during the contract.' },
        { title: '7. Termination', content: 'Either party may end this Agreement by giving TWO weeks written notice via email or WhatsApp. On ending, the Driver must return the Car to the place nominated by the Owner.' },
        { title: '8. Driver Obligations', content: 'The Driver will: make all payments owing; ensure their driver licence is current; pay all fines; comply with all road rules; only use the car for rideshare purposes; not allow any other person to drive the car; report any damage within 12 hours; keep the interior and exterior clean.' },
        { title: '9. Owner Obligations', content: 'The Owner will: give the Driver a copy of this Agreement after signing; comply with laws of vehicle registration, licensing, safety and roadworthiness.' },
        { title: '10. Mutual Obligations', content: 'Each party must promptly inform the other of changes to any information given under this Agreement. The Driver consents to surveillance devices being installed in the car.' },
      ].map(section => (
        <div key={section.title} style={{ marginBottom: 14 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{section.title}</h4>
          <p style={{ fontSize: 13, color: '#374151' }}>{section.content}</p>
        </div>
      ))}

      {contract.guarantorName && (
        <div style={{ marginBottom: 14 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Guarantor</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            {[
              ['Name', contract.guarantorName],
              ['Phone', contract.guarantorPhone],
              ['Email', contract.guarantorEmail],
            ].map(([k, v]) => (
              <tr key={k} style={{ borderBottom: '0.5px solid #e5e7eb' }}>
                <td style={{ padding: '5px 8px', color: '#6b7280', width: 140 }}>{k}</td>
                <td style={{ padding: '5px 8px', fontWeight: 500 }}>{v}</td>
              </tr>
            ))}
          </table>
        </div>
      )}
    </div>
  );

  // ── Signed view ───────────────────────────────────────────────────────────

  if (alreadySigned && !justSigned) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#0f1e3d', color: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🚗</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>FleetTrack — Signed Contract</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              {contract.driverGivenName} {contract.driverSurname} · {contract.carRego} · Signed {fmtDate(contract.signedAt)}
            </div>
          </div>
          <button
            onClick={() => window.print()}
            style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}
          >
            🖨 Print
          </button>
        </div>

        <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 40px' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, color: '#14532d' }}>This contract has been signed</div>
              <div style={{ fontSize: 12, color: '#166534' }}>
                Driver signed on {fmtDate(contract.signedAt)}
                {(contract as any).ownerSignedAt && ` · Owner signed on ${fmtDate((contract as any).ownerSignedAt)}`}
              </div>
            </div>
          </div>

          <ContractDocument />

          {/* Both signatures */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '24px', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Signatures</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

              {/* Driver signature */}
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>
                  Driver — {contract.driverGivenName} {contract.driverSurname}
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {contract.signatureDataUrl ? (
                    <img
                      src={contract.signatureDataUrl}
                      alt="Driver signature"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />
                  ) : (
                    <div style={{ color: '#9ca3af', fontSize: 13 }}>Signature not available</div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                  Signed: {fmtDate(contract.signedAt)}
                </div>
              </div>

              {/* Owner signature */}
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 600 }}>
                  Owner — Yaser Mirza (Optecaus Pty Ltd)
                </div>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {(contract as any).ownerSignatureDataUrl ? (
                    <img
                      src={(contract as any).ownerSignatureDataUrl}
                      alt="Owner signature"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />
                  ) : (
                    <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>
                      Owner signature pending
                    </div>
                  )}
                </div>
                {(contract as any).ownerSignedAt && (
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                    Signed: {fmtDate((contract as any).ownerSignedAt)}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Just signed confirmation ───────────────────────────────────────────────

  if (justSigned) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', padding: 20 }}>
        <div style={{ textAlign: 'center', background: '#fff', borderRadius: 16, padding: 40, maxWidth: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#14532d' }}>Contract Signed!</div>
          <div style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>
            Thank you {contract.driverGivenName}. Your rental agreement has been signed and saved.
          </div>
          <div style={{ marginTop: 20, fontSize: 12, color: '#9ca3af' }}>
            Signed: {fmtDate(contract.signedAt)}
          </div>
        </div>
      </div>
    );
  }

  // ── Signing view ──────────────────────────────────────────────────────────

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#0f1e3d', color: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>🚗</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>FleetTrack</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Rental Agreement — Please read carefully</div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 40px' }}>
        <ContractDocument />

        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '24px', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Driver Acknowledgement & Signature</h3>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            I, <strong>{contract.driverGivenName} {contract.driverSurname}</strong>, hereby agree to all the terms and conditions above.
          </p>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0, cursor: 'pointer' }} />
            <span style={{ fontSize: 13, lineHeight: 1.5 }}>
              I confirm I have read and understood the full contract above and agree to all terms and conditions.
            </span>
          </label>

          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Draw your signature below
              </label>
              <button onClick={clearSignature} style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Clear
              </button>
            </div>
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: 160, border: '1.5px solid #d1d5db', borderRadius: 8, touchAction: 'none', cursor: 'crosshair', background: '#fff', display: 'block' }}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
            />
            {!hasSignature && (
              <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 4 }}>Use your finger or stylus to sign above</p>
            )}
          </div>

          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
            Date: {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#b91c1c', marginBottom: 12 }}>
              {error}
            </div>
          )}

          <button
            onClick={submitSignature}
            disabled={!hasSignature || !agreed || submitting}
            style={{
              width: '100%', padding: '14px', borderRadius: 10,
              background: hasSignature && agreed ? '#0f1e3d' : '#d1d5db',
              color: '#fff', fontWeight: 700, fontSize: 15, border: 'none',
              cursor: hasSignature && agreed ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
            }}
          >
            {submitting ? 'Submitting...' : '✅ I Agree and Sign'}
          </button>

          {(!hasSignature || !agreed) && (
            <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
              {!agreed ? 'Please tick the checkbox above' : 'Please draw your signature above'}
            </p>
          )}
        </div>

        <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
          This contract is legally binding once signed. Managed by FleetTrack / Optecaus Pty Ltd.
        </p>
      </div>
    </div>
  );
}