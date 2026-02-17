import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const machine = await db.machine.findUnique({
      where: { id: parseInt(id) }
    });

    if (!machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    return NextResponse.json(machine);
  } catch (error) {
    console.error('Error fetching machine:', error);
    return NextResponse.json({ error: 'Failed to fetch machine' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const machine = await db.machine.update({
      where: { id: parseInt(id) },
      data: {
        ecNo: body.ecNo,
        brand: body.brand,
        type: body.type,
        modelNo: body.modelNo,
        registrationNo: body.registrationNo,
        capacity: body.capacity,
        yom: body.yom ? parseInt(body.yom) : null,
      }
    });

    return NextResponse.json(machine);
  } catch (error) {
    console.error('Error updating machine:', error);
    return NextResponse.json({ 
      error: 'Failed to update machine',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.machine.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting machine:', error);
    return NextResponse.json({ error: 'Failed to delete machine' }, { status: 500 });
  }
}
