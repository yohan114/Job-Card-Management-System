import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const vehicle = searchParams.get('vehicle') || '';
    const mrnNo = searchParams.get('mrnNo') || '';
    const isUsed = searchParams.get('isUsed');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { mrnNo: { contains: search } },
        { vehicleProject: { contains: search } },
      ];
    }
    
    if (category) {
      where.category = category;
    }
    
    if (vehicle) {
      where.vehicleProject = { contains: vehicle };
    }
    
    if (mrnNo) {
      where.mrnNo = mrnNo;
    }
    
    if (isUsed !== null && isUsed !== '') {
      where.isUsed = isUsed === 'true';
    }

    const [materials, total] = await Promise.all([
      db.issuedMaterial.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [
          { date: 'desc' },
          { mrnNo: 'asc' }
        ]
      }),
      db.issuedMaterial.count({ where })
    ]);

    return NextResponse.json({ materials, total });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}
