import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

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

export async function GET() {
  try {
    const contracts = await (prisma as any).contract.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(contracts.map(serialise));
  } catch (error) {
    console.error('GET /api/contracts error:', error);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signingToken = randomBytes(20).toString('hex');
    const contract = await (prisma as any).contract.create({
      data: {
        driverId: body.driverId || null,
        driverSurname: body.driverSurname,
        driverGivenName: body.driverGivenName,
        driverAddress: body.driverAddress,
        driverEmail: body.driverEmail,
        driverPhone: body.driverPhone,
        driverLicense: body.driverLicense,
        driverLicenseExpiry: body.driverLicenseExpiry,
        carRego: body.carRego,
        carModel: body.carModel,
        carYear: parseInt(body.carYear),
        weeklyRent: parseFloat(body.weeklyRent),
        minimumDuration: parseInt(body.minimumDuration) || 3,
        insurancePolicyNumber: body.insurancePolicyNumber,
        startDate: new Date(body.startDate),
        guarantorName: body.guarantorName || '',
        guarantorPhone: body.guarantorPhone || '',
        guarantorEmail: body.guarantorEmail || '',
        ownerName: 'Yaser Mirza',
        ownerAddress: '12 Avondale Crescent Parkinson QLD 4115',
        ownerPhone: '0488291252',
        ownerEmail: 'yasermirza@gmail.com',
        ownerCompany: 'Optecaus Pty Ltd',
        status: 'draft',
        signingToken,
      },
    });
    return NextResponse.json(serialise(contract), { status: 201 });
  } catch (error) {
    console.error('POST /api/contracts error:', error);
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }
}
