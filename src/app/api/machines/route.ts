import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    
    if (search) {
      where.OR = [
        { registrationNo: { contains: search } },
        { ecNo: { contains: search } },
        { brand: { contains: search } },
        { type: { contains: search } },
      ];
    }
    
    if (type) {
      where.type = type;
    }

    const [machines, total] = await Promise.all([
      db.machine.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { registrationNo: 'asc' }
      }),
      db.machine.count({ where })
    ]);

    return NextResponse.json({ machines, total });
  } catch (error) {
    console.error('Error fetching machines:', error);
    return NextResponse.json({ error: 'Failed to fetch machines' }, { status: 500 });
  }
}
