import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await pool.connect();
    await client.query('DELETE FROM test_items WHERE id = $1', [params.id]);
    client.release();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}