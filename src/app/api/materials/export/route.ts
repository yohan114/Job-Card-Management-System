import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    
    const where: any = {};
    if (category && category !== 'all') {
      where.category = category;
    }

    const materials = await db.issuedMaterial.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { mrnNo: 'asc' }
      ]
    });

    // Transform data for Excel
    const data = materials.map((m, index) => ({
      'No': index + 1,
      'Date': new Date(m.date).toLocaleDateString('en-GB'),
      'MRN No.': m.mrnNo,
      'Description': m.description,
      'Unit': m.unit || '',
      'Qty': m.qty,
      'Vehicle / Project': m.vehicleProject,
      'Remark': m.remark || '',
      'Price': m.price || '',
      'Total': m.total || '',
      'Category': m.category,
      'Is Used': m.isUsed ? 'Yes' : 'No'
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },   // No
      { wch: 12 },  // Date
      { wch: 10 },  // MRN No
      { wch: 40 },  // Description
      { wch: 8 },   // Unit
      { wch: 6 },   // Qty
      { wch: 20 },  // Vehicle/Project
      { wch: 20 },  // Remark
      { wch: 10 },  // Price
      { wch: 10 },  // Total
      { wch: 12 },  // Category
      { wch: 8 },   // Is Used
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Materials');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    const categoryName = category && category !== 'all' ? `_${category.toLowerCase()}` : '';
    const filename = `materials_export${categoryName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Error exporting materials:', error);
    return NextResponse.json({ error: 'Failed to export materials' }, { status: 500 });
  }
}
