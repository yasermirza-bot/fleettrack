import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { contract } = await req.json();
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 });

    const fmtDate = (iso?: string) => {
      if (!iso) return '—';
      try { return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }); }
      catch { return iso; }
    };

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:system-ui,Arial,sans-serif;color:#1a1a1a;margin:0;padding:0;background:#f8fafc;}
.wrapper{max-width:680px;margin:0 auto;background:#fff;}
.header{background:#0f1e3d;color:#fff;padding:24px 32px;}
.header h1{margin:0;font-size:20px;font-weight:700;}
.header p{margin:6px 0 0;font-size:13px;opacity:0.7;}
.banner{background:#f0fdf4;border-bottom:1px solid #bbf7d0;padding:16px 32px;}
.banner strong{color:#14532d;font-size:14px;display:block;}
.banner span{color:#166534;font-size:12px;}
.content{padding:32px;line-height:1.7;font-size:14px;}
h2{font-size:14px;font-weight:700;background:#f0f4f8;padding:8px 12px;border-radius:6px;margin:24px 0 12px;}
h3{font-size:13px;font-weight:700;margin:16px 0 8px;}
h4{font-size:13px;font-weight:700;margin:12px 0 4px;}
table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px;}
td{padding:6px 8px;border-bottom:0.5px solid #e5e7eb;}
td:first-child{color:#6b7280;width:160px;}
td:last-child{font-weight:600;}
p{font-size:13px;color:#374151;margin:0 0 12px;}
.sigs{display:flex;gap:24px;margin-top:24px;}
.sig{flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:16px;}
.sig-label{font-size:12px;color:#6b7280;font-weight:600;margin-bottom:8px;}
.sig-img{max-width:100%;height:100px;object-fit:contain;display:block;border:1px solid #f0f0f0;border-radius:4px;background:#fafafa;}
.sig-date{font-size:11px;color:#9ca3af;margin-top:6px;}
.btn{display:inline-block;background:#0f1e3d;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;margin:16px 0;}
.footer{background:#f8fafc;padding:20px 32px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;}
</style></head><body>
<div class="wrapper">
  <div class="header"><h1>🚗 OptecAus FleetTrack</h1><p>Car Rental Owner/Driver Agreement — Fully Executed</p></div>
  <div class="banner">
    <strong>✅ This contract has been signed by both parties</strong>
    <span>Driver signed: ${fmtDate(contract.signedAt)} &nbsp;·&nbsp; Owner signed: ${fmtDate(contract.ownerSignedAt)}</span>
  </div>
  <div class="content">
    <h2>PART A — DETAILS</h2>
    <h3>Item 1. Owner's Details (Optecaus Pty Ltd)</h3>
    <table>
      <tr><td>Surname</td><td>MIRZA</td></tr>
      <tr><td>Given Name</td><td>YASER</td></tr>
      <tr><td>Address</td><td>${contract.ownerAddress}</td></tr>
      <tr><td>Telephone</td><td>${contract.ownerPhone}</td></tr>
      <tr><td>Email</td><td>${contract.ownerEmail}</td></tr>
    </table>
    <h3>Item 2. Driver's Details</h3>
    <table>
      <tr><td>Surname</td><td>${(contract.driverSurname || '').toUpperCase()}</td></tr>
      <tr><td>Given Name</td><td>${(contract.driverGivenName || '').toUpperCase()}</td></tr>
      <tr><td>Address</td><td>${contract.driverAddress}</td></tr>
      <tr><td>Email</td><td>${contract.driverEmail}</td></tr>
      <tr><td>Driver Licence</td><td>${contract.driverLicense}</td></tr>
      <tr><td>Licence Expiry</td><td>${fmtDate(contract.driverLicenseExpiry)}</td></tr>
    </table>
    <h3>Item 3. Background</h3>
    <p>YASER MIRZA (known as Owner) wishes to engage <strong>${contract.driverGivenName}</strong> (known as Driver) in a Uber/rideshare/taxi service in line with the below stipulated terms and conditions.</p>
    <h3>Item 4. Car Details</h3>
    <table>
      <tr><td>Registration</td><td>${contract.carRego}</td></tr>
      <tr><td>Vehicle</td><td>${contract.carModel} ${contract.carYear}</td></tr>
    </table>
    <h3>Item 5. Payment</h3>
    <p>A sum of <strong>AUD $${contract.weeklyRent}</strong> will be due to the Owner on a weekly basis, payable on or before Saturday morning.</p>
    <h3>Item 6. Duration</h3>
    <p>Minimum <strong>${contract.minimumDuration} months</strong>, commencing <strong>${fmtDate(contract.startDate)}</strong>. Auto-renewable monthly.</p>
    <h3>Item 7. Insurance</h3>
    <p>Policy number: <strong>${contract.insurancePolicyNumber}</strong>.</p>
    <h2>PART B — GENERAL CONDITIONS</h2>
    <h4>1. Possession and Use of Car</h4><p>The Owner allows the Driver to take possession of the car in accordance with the terms of this Agreement.</p>
    <h4>2. Life of Agreement</h4><p>Begins when both parties sign. Ends two weeks after written notice by either party.</p>
    <h4>3. Payment</h4><p>Driver must remit AUD $${contract.weeklyRent} weekly. Both parties must maintain payment records.</p>
    <h4>4. Maintenance Costs</h4><p>Driver pays: fuel, insurance excess, damage. Owner pays: rego, roadworthy, insurance, servicing, tyres.</p>
    <h4>5. Insurance &amp; Incidents</h4><p>Driver must notify Owner within 24 hours of any incident. Driver responsible for insurance excess.</p>
    <h4>6. Fines</h4><p>Driver is responsible for all fines during the contract period.</p>
    <h4>7. Termination</h4><p>Two weeks written notice via email or WhatsApp. Driver must return car on ending.</p>
    <h4>8. Driver Obligations</h4><p>Make all payments; keep licence current; pay fines; follow road rules; rideshare use only; no other drivers; report damage within 12 hours; keep car clean.</p>
    <h4>9. Owner Obligations</h4><p>Provide signed copy of agreement; comply with registration and roadworthiness laws.</p>
    <h4>10. Mutual Obligations</h4><p>Notify each other of any changes to information. Driver consents to surveillance devices in car.</p>
    ${contract.guarantorName ? `<h3>Guarantor</h3><table><tr><td>Name</td><td>${contract.guarantorName}</td></tr><tr><td>Phone</td><td>${contract.guarantorPhone}</td></tr><tr><td>Email</td><td>${contract.guarantorEmail}</td></tr></table>` : ''}
    <h2>SIGNATURES</h2>
    <div class="sigs">
      <div class="sig">
        <div class="sig-label">Driver — ${contract.driverGivenName} ${contract.driverSurname}</div>
        ${contract.signatureDataUrl ? `<img src="${contract.signatureDataUrl}" class="sig-img" alt="Driver signature"/>` : '<div style="height:100px;background:#f9f9f9;border-radius:4px;"></div>'}
        <div class="sig-date">Signed: ${fmtDate(contract.signedAt)}</div>
      </div>
      <div class="sig">
        <div class="sig-label">Owner — Yaser Mirza (Optecaus Pty Ltd)</div>
        ${contract.ownerSignatureDataUrl ? `<img src="${contract.ownerSignatureDataUrl}" class="sig-img" alt="Owner signature"/>` : '<div style="height:100px;background:#f9f9f9;border-radius:4px;"></div>'}
        <div class="sig-date">Signed: ${fmtDate(contract.ownerSignedAt)}</div>
      </div>
    </div>
    <div style="text-align:center;margin-top:24px;">
      <a href="https://fleettrack-oieu.vercel.app/sign/${contract.signingToken}" class="btn">View Signed Contract Online</a>
    </div>
  </div>
  <div class="footer">Legally binding document. Managed by OptecAus FleetTrack / Optecaus Pty Ltd.<br>Generated ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</div>
</body></html>`;

    const recipients: string[] = ['yasermirza@gmail.com'];
    if (contract.driverEmail && contract.driverEmail !== 'yasermirza@gmail.com') {
      recipients.push(contract.driverEmail);
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'OptecAus FleetTrack <onboarding@resend.dev>',
        to: recipients,
        subject: `✅ Signed Rental Agreement — ${contract.driverGivenName} ${contract.driverSurname} / ${contract.carRego}`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Resend error:', data);
      return NextResponse.json({ error: data.message || 'Failed to send email' }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: data.id });

  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
