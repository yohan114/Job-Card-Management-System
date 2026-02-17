import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

function parseDate(dateStr: any): Date {
  if (!dateStr) return new Date();
  
  const str = dateStr.toString().trim();
  if (!str) return new Date();
  
  // Handle DD/MM/YY or DD/MM/YYYY format
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      let year = parseInt(parts[2]);
      if (year < 100) year += 2000; // 25 -> 2025
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
  }
  
  // Try standard date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  return new Date();
}

function categorizeItem(description: string): 'MRN_ITEM' | 'LUBRICANT' | 'COMMON_ITEM' | 'FILTER' {
  const desc = (description || '').toLowerCase();
  
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

// Helper function to get value or null (handle empty cells)
function getValueOrNull(value: any): string | null {
  if (value === undefined || value === null || value === '') return null;
  const str = value.toString().trim();
  return str || null;
}

// Helper function to get value or default
function getValueOrDefault(value: any, defaultValue: string): string {
  if (value === undefined || value === null || value === '') return defaultValue;
  const str = value.toString().trim();
  return str || defaultValue;
}

// Helper to parse number or return default/null
function parseNumber(value: any, defaultValue: number = 0): number {
  if (value === undefined || value === null || value === '') return defaultValue;
  const num = parseFloat(value.toString().replace(/,/g, ''));
  return isNaN(num) ? defaultValue : num;
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
        // Get values with fallbacks for different column names
        const mrnNo = getValueOrNull(
          row['MRN No.'] || row['mrn_no'] || row['MRN No'] || row['MRNNo'] || row['MRN']
        );
        const description = getValueOrNull(
          row['Description'] || row['description'] || row['DESCRIPTION'] || row['Item Description'] || row['Item']
        );
        
        // Skip only if row is completely empty or both mrnNo and description are missing
        const hasAnyData = Object.values(row).some(v => v !== undefined && v !== null && v !== '');
        if (!hasAnyData || (!mrnNo && !description)) {
          skipped++;
          continue;
        }

        const dateStr = row['Date'] || row['DATE'] || row['date'] || new Date().toISOString();
        const vehicleProject = getValueOrDefault(
          row['Vehicle / Project'] || row['vehicle_project'] || row['Vehicle'] || row['Project'] || row['VEHICLE/PROJECT'],
          'Unknown'
        );
        
        // Auto-categorize based on description or use explicit category
        const category = categorizeItem(description || '');

        await db.issuedMaterial.create({
          data: {
            date: parseDate(dateStr),
            mrnNo: mrnNo || `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            description: description || 'No description',
            unit: getValueOrDefault(
              row['Unit'] || row['unit'] || row['UNIT'],
              'Nos'
            ),
            qty: parseNumber(row['Qty'] || row['qty'] || row['QTY'] || row['Quantity'], 1),
            vehicleProject: vehicleProject,
            remark: getValueOrNull(row['Remark'] || row['remark'] || row['REMARK'] || row['Notes']),
            price: parseNumber(row['Price'] || row['price'] || row['RATE'] || row['Rate'], 0) || null,
            total: parseNumber(row['Total'] || row['total'] || row['TOTAL'] || row['Amount'] || row['Cost'], 0) || null,
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
