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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicleRegNo, materials } = body;

    if (!vehicleRegNo || !materials || materials.length === 0) {
      return NextResponse.json({ error: 'Vehicle and materials are required' }, { status: 400 });
    }

    // Generate job card number
    const jobCardNo = await generateJobCardNo();

    // Calculate total cost
    const totalSparePartsCost = materials.reduce((sum: number, m: any) => sum + (m.total || 0), 0);

    // Create job card
    const jobCard = await db.jobCard.create({
      data: {
        jobCardNo,
        vehicleRegNo: vehicleRegNo.trim(),
        totalSparePartsCost,
        totalManpowerCost: 0,
        outsideWorkCost: 0,
        status: 'DRAFT',
        items: {
          create: materials.map((m: any) => ({
            issuedMaterialId: m.id,
            itemType: m.category
          }))
        }
      },
      include: {
        items: {
          include: {
            issuedMaterial: true
          }
        }
      }
    });

    // Mark materials as used
    await db.issuedMaterial.updateMany({
      where: {
        id: { in: materials.map((m: any) => m.id) }
      },
      data: { isUsed: true }
    });

    return NextResponse.json({ 
      success: true, 
      jobCard,
      message: `Job card ${jobCardNo} created with ${materials.length} items` 
    });
  } catch (error) {
    console.error('Error auto-generating job card:', error);
    return NextResponse.json({ 
      error: 'Failed to auto-generate job card',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Auto-generate job cards for all unused materials grouped by vehicle
export async function GET(request: NextRequest) {
  try {
    // Get all unused materials grouped by vehicle/project
    const unusedMaterials = await db.issuedMaterial.findMany({
      where: { isUsed: false },
      orderBy: [
        { vehicleProject: 'asc' },
        { mrnNo: 'asc' }
      ]
    });

    // Group by vehicle/project
    const groupedByVehicle: { [key: string]: typeof unusedMaterials } = {};
    
    for (const material of unusedMaterials) {
      const vehicle = material.vehicleProject.trim();
      if (!groupedByVehicle[vehicle]) {
        groupedByVehicle[vehicle] = [];
      }
      groupedByVehicle[vehicle].push(material);
    }

    // Create job cards for each group
    const results = [];
    
    for (const [vehicle, materials] of Object.entries(groupedByVehicle)) {
      if (materials.length === 0) continue;

      const jobCardNo = await generateJobCardNo();
      const totalSparePartsCost = materials.reduce((sum, m) => sum + (m.total || 0), 0);

      try {
        const jobCard = await db.jobCard.create({
          data: {
            jobCardNo,
            vehicleRegNo: vehicle,
            totalSparePartsCost,
            totalManpowerCost: 0,
            outsideWorkCost: 0,
            status: 'DRAFT',
            items: {
              create: materials.map(m => ({
                issuedMaterialId: m.id,
                itemType: m.category
              }))
            }
          }
        });

        // Mark materials as used
        await db.issuedMaterial.updateMany({
          where: {
            id: { in: materials.map(m => m.id) }
          },
          data: { isUsed: true }
        });

        results.push({
          success: true,
          jobCardNo,
          vehicle,
          itemCount: materials.length,
          jobCard
        });
      } catch (err) {
        results.push({
          success: false,
          vehicle,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalJobCards: results.length,
      results
    });
  } catch (error) {
    console.error('Error in bulk auto-generate:', error);
    return NextResponse.json({ 
      error: 'Failed to auto-generate job cards',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
