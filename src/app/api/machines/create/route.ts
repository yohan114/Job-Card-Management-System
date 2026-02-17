import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.registrationNo || body.registrationNo.trim() === '') {
      return NextResponse.json({ 
        error: 'Registration number is required' 
      }, { status: 400 });
    }

    // Check if registration number already exists
    const existing = await db.machine.findUnique({
      where: { registrationNo: body.registrationNo.trim() }
    });

    if (existing) {
      return NextResponse.json({ 
        error: 'Machine with this registration number already exists' 
      }, { status: 400 });
    }

    const machine = await db.machine.create({
      data: {
        ecNo: body.ecNo?.trim() || null,
        brand: body.brand?.trim() || 'Unknown',
        type: body.type?.trim() || 'Unknown',
        modelNo: body.modelNo?.trim() || null,
        registrationNo: body.registrationNo.trim(),
        capacity: body.capacity?.trim() || null,
        yom: body.yom ? parseInt(body.yom) : null,
      }
    });

    console.log('Machine created successfully:', machine.registrationNo);
    return NextResponse.json({ success: true, machine });
  } catch (error) {
    console.error('Error creating machine:', error);
    return NextResponse.json({ 
      error: 'Failed to create machine',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
