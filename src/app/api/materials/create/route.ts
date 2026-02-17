import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const material = await db.issuedMaterial.create({
      data: {
        date: body.date ? new Date(body.date) : new Date(),
        mrnNo: body.mrnNo,
        description: body.description,
        unit: body.unit || 'Nos',
        qty: body.qty || 1,
        vehicleProject: body.vehicleProject || '',
        remark: body.remark || null,
        price: body.price || null,
        total: body.total || null,
        category: body.category || 'MRN_ITEM',
      }
    });

    return NextResponse.json(material);
  } catch (error) {
    console.error('Error creating material:', error);
    return NextResponse.json({ 
      error: 'Failed to create material',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
