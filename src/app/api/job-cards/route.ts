import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get repair type code
function getRepairTypeCode(repairType: string | null | undefined): string {
  if (!repairType) return 'R'; // Default to Running
  
  const type = repairType.toLowerCase().trim();
  
  if (type.includes('accident') || type === 'a') return 'A';
  if (type.includes('running') || type === 'r') return 'R';
  if (type.includes('breakdown') || type === 'b') return 'B';
  if (type.includes('routine') || type === 'u') return 'U';
  if (type.includes('other') || type === 'o') return 'O';
  
  // Default to first letter of repair type
  return repairType.charAt(0).toUpperCase();
}

// Generate job card number: 2026/02/R/0001
async function generateJobCardNo(repairType?: string | null): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const typeCode = getRepairTypeCode(repairType);
  
  // Create prefix like "2026/02/R/"
  const prefix = `${year}/${month}/${typeCode}/`;
  
  // Count existing job cards with this prefix
  const existingCards = await db.jobCard.findMany({
    where: {
      jobCardNo: { startsWith: prefix }
    },
    select: { jobCardNo: true }
  });
  
  // Extract sequence numbers and find max
  let maxSeq = 0;
  for (const card of existingCards) {
    const parts = card.jobCardNo.split('/');
    if (parts.length === 4) {
      const seq = parseInt(parts[3]);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }
  
  const sequence = String(maxSeq + 1).padStart(4, '0');
  return `${prefix}${sequence}`;
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

    // Generate job card number with repair type
    const jobCardNo = await generateJobCardNo(repairType);

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

    console.log('Job card created:', jobCardNo);
    return NextResponse.json({ success: true, jobCard });
  } catch (error) {
    console.error('Error creating job card:', error);
    return NextResponse.json({ 
      error: 'Failed to create job card',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
