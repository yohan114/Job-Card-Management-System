import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Generate job card number
async function generateJobCardNo(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.jobCard.count({
    where: {
      jobCardNo: { contains: `JC-${year}` }
    }
  });
  return `JC-${year}-${String(count + 1).padStart(4, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const vehicle = searchParams.get('vehicle') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    
    if (search) {
      where.OR = [
        { jobCardNo: { contains: search } },
        { vehicleRegNo: { contains: search } },
        { driverOperatorName: { contains: search } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (vehicle) {
      where.vehicleRegNo = { contains: vehicle };
    }

    const [jobCards, total] = await Promise.all([
      db.jobCard.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          items: {
            include: {
              issuedMaterial: true
            }
          },
          outsideWorks: true,
          machine: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      db.jobCard.count({ where })
    ]);

    return NextResponse.json({ jobCards, total });
  } catch (error) {
    console.error('Error fetching job cards:', error);
    return NextResponse.json({ error: 'Failed to fetch job cards' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const jobCardNo = await generateJobCardNo();

    const jobCard = await db.jobCard.create({
      data: {
        jobCardNo,
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
    console.error('Error creating job card:', error);
    return NextResponse.json({ 
      error: 'Failed to create job card',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
