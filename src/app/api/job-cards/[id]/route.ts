import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const jobCard = await db.jobCard.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            issuedMaterial: true
          }
        },
        outsideWorks: true,
        machine: true
      }
    });

    if (!jobCard) {
      return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
    }

    return NextResponse.json(jobCard);
  } catch (error) {
    console.error('Error fetching job card:', error);
    return NextResponse.json({ error: 'Failed to fetch job card' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { 
      vehicleRegNo, 
      companyCode, 
      vehicleMachineryMeter, 
      repairType,
      expectedCompletionDate,
      driverOperatorName, 
      driverOperatorContact,
      bcdNo,
      jobDescription,
      jobStartDate,
      jobCompletedDate,
      supervisorName,
      totalSparePartsCost,
      totalManpowerCost,
      outsideWorkCost,
      status,
      items,
      outsideWorks 
    } = body;

    // First, remove existing items
    await db.jobCardItem.deleteMany({
      where: { jobCardId: parseInt(id) }
    });

    // Remove existing outside works
    await db.outsideWork.deleteMany({
      where: { jobCardId: parseInt(id) }
    });

    // Update job card with new data
    const jobCard = await db.jobCard.update({
      where: { id: parseInt(id) },
      data: {
        vehicleRegNo,
        companyCode,
        vehicleMachineryMeter,
        repairType,
        expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : null,
        driverOperatorName,
        driverOperatorContact,
        bcdNo,
        jobDescription,
        jobStartDate: jobStartDate ? new Date(jobStartDate) : null,
        jobCompletedDate: jobCompletedDate ? new Date(jobCompletedDate) : null,
        supervisorName,
        totalSparePartsCost: totalSparePartsCost || 0,
        totalManpowerCost: totalManpowerCost || 0,
        outsideWorkCost: outsideWorkCost || 0,
        status: status || 'DRAFT',
        items: items ? {
          create: items.map((item: any) => ({
            issuedMaterialId: item.issuedMaterialId,
            itemType: item.itemType
          }))
        } : undefined,
        outsideWorks: outsideWorks ? {
          create: outsideWorks.map((work: any) => ({
            date: new Date(work.date),
            description: work.description,
            cost: work.cost || 0
          }))
        } : undefined
      },
      include: {
        items: {
          include: {
            issuedMaterial: true
          }
        },
        outsideWorks: true
      }
    });

    // Mark materials as used
    if (items && items.length > 0) {
      await db.issuedMaterial.updateMany({
        where: {
          id: { in: items.map((i: any) => i.issuedMaterialId) }
        },
        data: { isUsed: true }
      });
    }

    return NextResponse.json(jobCard);
  } catch (error) {
    console.error('Error updating job card:', error);
    return NextResponse.json({ 
      error: 'Failed to update job card',
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
    
    // Get items first to unmark them
    const items = await db.jobCardItem.findMany({
      where: { jobCardId: parseInt(id) }
    });

    // Unmark materials as used
    if (items.length > 0) {
      await db.issuedMaterial.updateMany({
        where: {
          id: { in: items.map(i => i.issuedMaterialId) }
        },
        data: { isUsed: false }
      });
    }

    await db.jobCard.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job card:', error);
    return NextResponse.json({ error: 'Failed to delete job card' }, { status: 500 });
  }
}
