import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const machines = await db.machine.findMany({
      orderBy: { registrationNo: 'asc' }
    });

    // Transform data for Excel
    const data = machines.map((m, index) => ({
      'NO': index + 1,
      'E&C NO': m.ecNo || '',
      'BRAND': m.brand,
      'TYPE': m.type,
      'MODEL NO': m.modelNo || '',
      'REGISTRATION NO': m.registrationNo,
      'CAPACITY': m.capacity || '',
      'YOM': m.yom || ''
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },   // NO
      { wch: 10 },  // E&C NO
      { wch: 15 },  // BRAND
      { wch: 20 },  // TYPE
      { wch: 12 },  // MODEL NO
      { wch: 18 },  // REGISTRATION NO
      { wch: 12 },  // CAPACITY
      { wch: 8 },   // YOM
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Machines');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    const filename = `machines_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Error exporting machines:', error);
    return NextResponse.json({ error: 'Failed to export machines' }, { status: 500 });
  }
}
