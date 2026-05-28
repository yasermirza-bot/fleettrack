import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/car-history?driverId=xxx — get history for a driver
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const driverId = searchParams.get('driverId');
    const history = await (prisma as any).carHistory.findMany({
      where: driverId ? { driverId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(history.map((h: any) => ({
      ...h,
      weeklyRent: Number(h.weeklyRent),
      createdAt: h.createdAt.toISOString(),
    })));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch car history' }, { status: 500 });
  }
}

// POST — record a car assignment change
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = await (prisma as any).carHistory.create({
      data: {
        driverId: body.driverId,
        rego: body.rego,
        carModel: body.carModel ?? '',
        weeklyRent: parseFloat(body.weeklyRent) || 0,
        startDate: body.startDate,
        endDate: body.endDate ?? null,
        reason: body.reason ?? '',
      },
    });
    return NextResponse.json({ ...entry, weeklyRent: Number(entry.weeklyRent) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create history entry' }, { status: 500 });
  }
}
