import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if registration number already exists
    const existing = await db.machine.findUnique({
      where: { registrationNo: body.registrationNo }
    });

    if (existing) {
      return NextResponse.json({ 
        error: 'Machine with this registration number already exists' 
      }, { status: 400 });
    }

    const machine = await db.machine.create({
      data: {
        ecNo: body.ecNo || null,
        brand: body.brand || 'Unknown',
        type: body.type || 'Unknown',
        modelNo: body.modelNo || null,
        registrationNo: body.registrationNo,
        capacity: body.capacity || null,
        yom: body.yom ? parseInt(body.yom) : null,
      }
    });

    return NextResponse.json(machine);
  } catch (error) {
    console.error('Error creating machine:', error);
    return NextResponse.json({ 
      error: 'Failed to create machine',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
