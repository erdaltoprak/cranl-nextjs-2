import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM test_items ORDER BY created_at DESC');
    client.release();
    
    return NextResponse.json({ items: result.rows });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();
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
    
    return NextResponse.json({ item: result.rows[0] });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}