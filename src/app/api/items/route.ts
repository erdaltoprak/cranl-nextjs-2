import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
};

export async function GET() {
  try {
    console.log('[Items GET] Fetching items...');
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM test_items ORDER BY created_at DESC');
    client.release();
    
    console.log('[Items GET] Found items:', result.rows.length);
    return NextResponse.json({ items: result.rows }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('[Items GET] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    console.log('[Items POST] Creating item...');
    const { name, description } = await request.json();
    console.log('[Items POST] Received:', { name, description });
    
    const client = await pool.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const result = await client.query(
      'INSERT INTO test_items (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    client.release();
    
    console.log('[Items POST] Created:', result.rows[0]);
    return NextResponse.json({ item: result.rows[0] }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('[Items POST] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
