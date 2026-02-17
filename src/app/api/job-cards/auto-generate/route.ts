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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicleRegNo, materials, repairType } = body;

    if (!vehicleRegNo || !materials || materials.length === 0) {
      return NextResponse.json({ error: 'Vehicle and materials are required' }, { status: 400 });
    }

    // Generate job card number with repair type (default to Running)
    const jobCardNo = await generateJobCardNo(repairType || 'Running');

    // Calculate total cost
    const totalSparePartsCost = materials.reduce((sum: number, m: any) => sum + (m.total || 0), 0);

    // Create job card
    const jobCard = await db.jobCard.create({
      data: {
        jobCardNo,
        vehicleRegNo: vehicleRegNo.trim(),
        repairType: repairType || 'Running',
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

    console.log('Auto-generated job card:', jobCardNo);
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

      // Default to Running for auto-generated cards
      const jobCardNo = await generateJobCardNo('Running');
      const totalSparePartsCost = materials.reduce((sum, m) => sum + (m.total || 0), 0);

      try {
        const jobCard = await db.jobCard.create({
          data: {
            jobCardNo,
            vehicleRegNo: vehicle,
            repairType: 'Running',
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

    console.log(`Auto-generated ${results.length} job cards`);
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
