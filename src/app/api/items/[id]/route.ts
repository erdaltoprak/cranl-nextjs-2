import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[Items DELETE] Deleting item:', id);
    
    const client = await pool.connect();
    const result = await client.query('DELETE FROM test_items WHERE id = $1 RETURNING *', [id]);
    client.release();
    
    console.log('[Items DELETE] Result:', result.rowCount, 'rows deleted');
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, deleted: result.rows[0] });
  } catch (error) {
    console.error('[Items DELETE] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}