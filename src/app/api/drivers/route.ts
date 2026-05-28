import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function serialise(d: any) {
  return {
    ...d,
    weeklyRent:         Number(d.weeklyRent ?? 0),
    bondAmount:         Number(d.bondAmount ?? 0),
    lastPaymentAmount:  d.lastPaymentAmount ? Number(d.lastPaymentAmount) : null,
    amountOwed:         Number(d.amountOwed ?? 0),
    lastPaymentDate:    d.lastPaymentDate?.toISOString?.() ?? d.lastPaymentDate ?? null,
    startDate:          d.startDate?.toISOString?.() ?? d.startDate ?? null,
    createdAt:          d.createdAt?.toISOString?.() ?? d.createdAt,
    updatedAt:          d.updatedAt?.toISOString?.() ?? d.updatedAt,
    name: `${d.givenName ?? ''} ${d.surname ?? ''}`.trim() || d.name || '',
  };
}

export async function GET() {
  try {
    const drivers = await prisma.driver.findMany({ orderBy: { createdAt: 'asc' } });
    return NextResponse.json(drivers.map(serialise));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const driver = await prisma.driver.create({
      data: {
        name: `${body.givenName ?? ''} ${body.surname ?? ''}`.trim(),
        givenName: body.givenName?.trim() ?? '',
        surname: body.surname?.trim() ?? '',
        dateOfBirth: body.dateOfBirth ?? '',
        phone: body.phone?.trim() ?? '',
        email: body.email?.trim() ?? '',
        address: body.address?.trim() ?? '',
        licenceNumber: body.licenceNumber?.trim() ?? '',
        licenceExpiry: body.licenceExpiry ?? '',
        licenceState: body.licenceState ?? 'QLD',
        uberDriverId: body.uberDriverId?.trim() ?? '',
        abn: body.abn?.trim() ?? '',
        emergencyName: body.emergencyName?.trim() ?? '',
        emergencyPhone: body.emergencyPhone?.trim() ?? '',
        emergencyRelation: body.emergencyRelation?.trim() ?? '',
        bondAmount: parseFloat(body.bondAmount) || 0,
        bondPaid: body.bondPaid ?? false,
        bondPaidDate: body.bondPaidDate ?? '',
        bondReceiptNumber: body.bondReceiptNumber?.trim() ?? '',
        currentRego: body.currentRego?.trim().toUpperCase() ?? '',
        weeklyRent: parseFloat(body.weeklyRent) || 0,
        assignmentStartDate: body.assignmentStartDate ?? '',
        isActive: true,
        paymentStatus: 'pending',
        amountOwed: 0,
        notes: body.notes?.trim() ?? '',
      } as any,
    });
    return NextResponse.json(serialise(driver), { status: 201 });
  } catch (error) {
    console.error('POST /api/drivers error:', error);
    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 });
  }
}
