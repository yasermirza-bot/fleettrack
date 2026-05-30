import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { contractId } = await req.json();

    const setting = await (prisma as any).appSetting.findUnique({
      where: { key: 'owner_signature' },
    });

    if (!setting?.value) {
      return NextResponse.json({
        error: 'No owner signature saved. Please upload your signature in Settings first.'
      }, { status: 400 });
    }

    const contract = await (prisma as any).contract.update({
      where: { id: contractId },
      data: {
        ownerSignatureDataUrl: setting.value,
        ownerSignedAt: new Date(),
        status: 'signed',
      },
    });

    const serialised = {
      ...contract,
      weeklyRent: Number(contract.weeklyRent),
      startDate: contract.startDate?.toISOString(),
      signedAt: contract.signedAt?.toISOString() ?? null,
      ownerSignedAt: contract.ownerSignedAt?.toISOString() ?? null,
      createdAt: contract.createdAt?.toISOString(),
      updatedAt: contract.updatedAt?.toISOString(),
    };

    // Send email after owner signs
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://fleettrack-oieu.vercel.app';
      await fetch(`${baseUrl}/api/email/send-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract: serialised }),
      });
    } catch (emailError) {
      console.error('Email send failed (non-fatal):', emailError);
    }

    return NextResponse.json(serialised);
  } catch (error) {
    console.error('POST /api/contracts/sign-owner error:', error);
    return NextResponse.json({ error: 'Failed to add owner signature' }, { status: 500 });
  }
}
