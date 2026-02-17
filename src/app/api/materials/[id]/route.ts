import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const material = await db.issuedMaterial.findUnique({
      where: { id: parseInt(id) }
    });

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    return NextResponse.json(material);
  } catch (error) {
    console.error('Error fetching material:', error);
    return NextResponse.json({ error: 'Failed to fetch material' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const material = await db.issuedMaterial.update({
      where: { id: parseInt(id) },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        mrnNo: body.mrnNo,
        description: body.description,
        unit: body.unit,
        qty: body.qty,
        vehicleProject: body.vehicleProject,
        remark: body.remark,
        price: body.price,
        total: body.total,
        category: body.category,
      }
    });

    return NextResponse.json(material);
  } catch (error) {
    console.error('Error updating material:', error);
    return NextResponse.json({ 
      error: 'Failed to update material',
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
    
    await db.issuedMaterial.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting material:', error);
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
  }
}
