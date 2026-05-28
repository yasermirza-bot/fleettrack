import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: { id: string } };

function serialise(d: any) {
  return {
    ...d,
    weeklyRent: Number(d.weeklyRent ?? 0),
    bondAmount: Number(d.bondAmount ?? 0),
    lastPaymentAmount: d.lastPaymentAmount ? Number(d.lastPaymentAmount) : null,
    amountOwed: Number(d.amountOwed ?? 0),
    lastPaymentDate: d.lastPaymentDate?.toISOString?.() ?? null,
    startDate: d.startDate?.toISOString?.() ?? null,
    createdAt: d.createdAt?.toISOString?.() ?? d.createdAt,
    updatedAt: d.updatedAt?.toISOString?.() ?? d.updatedAt,
    name: `${d.givenName ?? ''} ${d.surname ?? ''}`.trim() || d.name || '',
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const driver = await prisma.driver.findUnique({ where: { id: params.id } });
    if (!driver) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(serialise(driver));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch driver' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    const updateData: any = {};

    const fields = [
      'givenName','surname','dateOfBirth','phone','email','address',
      'licenceNumber','licenceExpiry','licenceState',
      'uberDriverId','abn',
      'emergencyName','emergencyPhone','emergencyRelation',
      'bondAmount','bondPaid','bondPaidDate','bondReceiptNumber',
      'currentRego','weeklyRent','assignmentStartDate',
      'isActive','paymentStatus','amountOwed','notes',
      'lastPaymentDate','lastPaymentAmount',
    ];

    for (const f of fields) {
      if (body[f] !== undefined) {
        if (f === 'weeklyRent' || f === 'bondAmount' || f === 'amountOwed' || f === 'lastPaymentAmount') {
          updateData[f] = parseFloat(body[f]) || 0;
        } else {
          updateData[f] = body[f];
        }
      }
    }

    // Keep legacy name in sync
    if (body.givenName || body.surname) {
      const current = await prisma.driver.findUnique({ where: { id: params.id } });
      updateData.name = `${body.givenName ?? (current as any)?.givenName ?? ''} ${body.surname ?? (current as any)?.surname ?? ''}`.trim();
    }

    const driver = await prisma.driver.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json(serialise(driver));
  } catch (error) {
    console.error('PATCH /api/drivers/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await prisma.driver.update({ where: { id: params.id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 });
  }
}
