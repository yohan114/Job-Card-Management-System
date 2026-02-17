import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

function parseDate(dateStr: string): Date {
  // Handle DD/MM/YY format
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      let year = parseInt(parts[2]);
      if (year < 100) year += 2000; // 25 -> 2025
      return new Date(year, month, day);
    }
  }
  return new Date(dateStr);
}

function categorizeItem(description: string): 'MRN_ITEM' | 'LUBRICANT' | 'COMMON_ITEM' | 'FILTER' {
  const desc = description.toLowerCase();
  
  // Check for filter items
  if (desc.includes('filter')) {
    return 'FILTER';
  }
  
  // Check for lubricant items
  if (desc.includes('oil') || desc.includes('grease') || desc.includes('lubricant') || 
      desc.includes('hydraulic') && desc.includes('fluid') || desc.includes('engine oil') ||
      desc.includes('gear oil') || desc.includes('transmission oil')) {
    return 'LUBRICANT';
  }
  
  // Check for common items (general items like bolts, washers, seals)
  if (desc.includes('bolt') || desc.includes('nut') || desc.includes('washer') ||
      desc.includes('seal') || desc.includes('o-ring') || desc.includes('bearing') ||
      desc.includes('gasket') || desc.includes('hose') || desc.includes('belt')) {
    return 'COMMON_ITEM';
  }
  
  return 'MRN_ITEM';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of data as any[]) {
      try {
        const mrnNo = row['MRN No.']?.toString() || row['mrn_no'];
        const description = row['Description'] || row['description'];
        const vehicleProject = row['Vehicle / Project'] || row['vehicle_project'];
        
        if (!mrnNo || !description) {
          skipped++;
          continue;
        }

        const dateStr = row['Date']?.toString() || new Date().toISOString();
        const category = categorizeItem(description);

        await db.issuedMaterial.create({
          data: {
            date: parseDate(dateStr),
            mrnNo: mrnNo,
            description: description,
            unit: row['Unit'] || row['unit'] || 'Nos',
            qty: parseInt(row['Qty'] || row['qty'] || '1'),
            vehicleProject: vehicleProject?.toString().trim() || 'Unknown',
            remark: row['Remark'] || row['remark'] || null,
            price: parseFloat(row['Price'] || row['price']) || null,
            total: parseFloat(row['Total'] || row['total']) || null,
            category: category,
          }
        });
        imported++;
      } catch (err) {
        skipped++;
        if (err instanceof Error) {
          errors.push(err.message);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      imported, 
      skipped,
      total: data.length,
      errors: errors.slice(0, 10) // Return first 10 errors
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      error: 'Failed to import materials', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
