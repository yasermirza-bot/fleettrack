import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      return NextResponse.json({ error: 'Missing to or message' }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const from       = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !from) {
      return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    // Format number — ensure whatsapp: prefix and Australian format
    let toFormatted = to.replace(/\s/g, '');
    if (!toFormatted.startsWith('whatsapp:')) {
      // Convert 04XX to +614XX if needed
      if (toFormatted.startsWith('04')) {
        toFormatted = '+61' + toFormatted.slice(1);
      }
      toFormatted = `whatsapp:${toFormatted}`;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const body = new URLSearchParams({
      To:   toFormatted,
      From: from,
      Body: message,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio error:', data);
      return NextResponse.json({
        error: data.message || 'Failed to send WhatsApp message',
        code: data.code,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      sid: data.sid,
      status: data.status,
    });

  } catch (error) {
    console.error('POST /api/whatsapp/send error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
