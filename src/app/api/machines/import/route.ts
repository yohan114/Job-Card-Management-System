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
      // Handle multiple column name formats
      const registrationNo = row['REGISTRATION NO'] || row['registration_no'] || row['Registration No'] || row['RegistrationNO'] || row['registration number'];
      
      // Skip only if registration number is completely empty (required field)
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

      // Helper function to get value or null (handle empty cells)
      const getValueOrNull = (value: any) => {
        if (value === undefined || value === null || value === '') return null;
        return value.toString().trim() || null;
      };

      // Helper function to get value or default
      const getValueOrDefault = (value: any, defaultValue: string) => {
        if (value === undefined || value === null || value === '') return defaultValue;
        return value.toString().trim() || defaultValue;
      };

      await db.machine.create({
        data: {
          ecNo: getValueOrNull(row['E&C NO'] || row['ec_no'] || row['E&C No'] || row['ECNO'] || row['ec number']),
          brand: getValueOrDefault(row['BRAND'] || row['brand'] || row['Brand'], 'Unknown'),
          type: getValueOrDefault(row['TYPE'] || row['type'] || row['machine_type'] || row['Machine Type'] || row['Type'], 'Unknown'),
          modelNo: getValueOrNull(row['MODEL NO'] || row['model_no'] || row['Model No'] || row['ModelNO'] || row['model number']),
          registrationNo: registrationNo.toString().trim(),
          capacity: getValueOrNull(row['CAPACITY'] || row['capacity'] || row['Capacity']),
          yom: parseInt(row['YOM'] || row['yom'] || row['Year'] || row['YEAR'] || row['year of manufacture'] || '0') || null,
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
