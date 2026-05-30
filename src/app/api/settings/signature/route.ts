import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const setting = await (prisma as any).appSetting.findUnique({
      where: { key: 'owner_signature' },
    });
    return NextResponse.json({ signatureDataUrl: setting?.value ?? null });
  } catch (error) {
    return NextResponse.json({ signatureDataUrl: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { signatureDataUrl } = await req.json();
    await (prisma as any).appSetting.upsert({
      where: { key: 'owner_signature' },
      update: { value: signatureDataUrl },
      create: { key: 'owner_signature', value: signatureDataUrl },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/settings/signature error:', error);
    return NextResponse.json({ error: 'Failed to save signature' }, { status: 500 });
  }
}
