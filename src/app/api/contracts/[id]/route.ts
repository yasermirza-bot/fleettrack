import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: { id: string } };

function serialise(c: any) {
  return {
    ...c,
    weeklyRent: Number(c.weeklyRent),
    startDate: c.startDate?.toISOString?.() ?? c.startDate,
    signedAt: c.signedAt?.toISOString?.() ?? null,
    createdAt: c.createdAt?.toISOString?.() ?? c.createdAt,
    updatedAt: c.updatedAt?.toISOString?.() ?? c.updatedAt,
  };
}

// GET by signing token (public — for driver signing page)
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const contract = await (prisma as any).contract.findFirst({
      where: {
        OR: [
          { id: params.id },
          { signingToken: params.id },
        ],
      },
    });
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    return NextResponse.json(serialise(contract));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
  }
}

// PATCH — save signature, mark signed
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    const updateData: any = {};

    if (body.signatureDataUrl) {
      updateData.signatureDataUrl = body.signatureDataUrl;
      updateData.signedAt = new Date();
      updateData.status = 'signed';
      updateData.signatureIp = req.headers.get('x-forwarded-for') || 'unknown';
    }

    if (body.status) updateData.status = body.status;

    const contract = await (prisma as any).contract.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(serialise(contract));
  } catch (error) {
    console.error('PATCH /api/contracts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}

// DELETE contract
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await (prisma as any).contract.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
  }
}
