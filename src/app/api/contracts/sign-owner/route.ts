import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { contractId } = await req.json();

    // Get saved owner signature
    const setting = await (prisma as any).appSetting.findUnique({
      where: { key: 'owner_signature' },
    });

    if (!setting?.value) {
      return NextResponse.json({ error: 'No owner signature saved. Please upload your signature in Settings first.' }, { status: 400 });
    }

    const contract = await (prisma as any).contract.update({
      where: { id: contractId },
      data: {
        ownerSignatureDataUrl: setting.value,
        ownerSignedAt: new Date(),
        status: 'signed',
      },
    });

    return NextResponse.json({
      ...contract,
      weeklyRent: Number(contract.weeklyRent),
      startDate: contract.startDate?.toISOString(),
      signedAt: contract.signedAt?.toISOString() ?? null,
      ownerSignedAt: contract.ownerSignedAt?.toISOString() ?? null,
      createdAt: contract.createdAt?.toISOString(),
      updatedAt: contract.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('POST /api/contracts/sign-owner error:', error);
    return NextResponse.json({ error: 'Failed to add owner signature' }, { status: 500 });
  }
}
