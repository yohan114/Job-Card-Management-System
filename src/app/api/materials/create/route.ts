import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.mrnNo || body.mrnNo.trim() === '') {
      return NextResponse.json({ 
        error: 'MRN No is required' 
      }, { status: 400 });
    }

    if (!body.description || body.description.trim() === '') {
      return NextResponse.json({ 
        error: 'Description is required' 
      }, { status: 400 });
    }

    const material = await db.issuedMaterial.create({
      data: {
        date: body.date ? new Date(body.date) : new Date(),
        mrnNo: body.mrnNo.trim(),
        description: body.description.trim(),
        unit: body.unit?.trim() || 'Nos',
        qty: parseInt(body.qty) || 1,
        vehicleProject: body.vehicleProject?.trim() || 'Unknown',
        remark: body.remark?.trim() || null,
        price: body.price ? parseFloat(body.price) : null,
        total: body.total ? parseFloat(body.total) : null,
        category: body.category || 'MRN_ITEM',
      }
    });

    console.log('Material created successfully:', material.mrnNo);
    return NextResponse.json({ success: true, material });
  } catch (error) {
    console.error('Error creating material:', error);
    return NextResponse.json({ 
      error: 'Failed to create material',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
