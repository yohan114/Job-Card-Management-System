import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

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

    for (const row of data as any[]) {
      // Handle both CSV and Excel formats
      const registrationNo = row['REGISTRATION NO'] || row['registration_no'] || row['Registration No'];
      
      if (!registrationNo || registrationNo.toString().trim() === '') {
        skipped++;
        continue;
      }

      // Check if machine already exists
      const existing = await db.machine.findUnique({
        where: { registrationNo: registrationNo.toString().trim() }
      });

      if (existing) {
        skipped++;
        continue;
      }

      await db.machine.create({
        data: {
          ecNo: row['E&C NO'] || row['ec_no'] || row['E&C No'] || null,
          brand: row['BRAND'] || row['brand'] || 'Unknown',
          type: row['TYPE'] || row['type'] || row['machine_type'] || 'Unknown',
          modelNo: row['MODEL NO'] || row['model_no'] || row['Model No'] || null,
          registrationNo: registrationNo.toString().trim(),
          capacity: row['CAPACITY'] || row['capacity'] || null,
          yom: parseInt(row['YOM'] || row['yom'] || '0') || null,
        }
      });
      imported++;
    }

    return NextResponse.json({ 
      success: true, 
      imported, 
      skipped,
      total: data.length 
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      error: 'Failed to import machines', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
