import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    
    const versionResult = await client.query('SELECT version()');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const dbSizeResult = await client.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    
    client.release();
    
    return NextResponse.json({
      version: versionResult.rows[0].version,
      tables: tablesResult.rows.map(r => r.table_name),
      databaseSize: dbSizeResult.rows[0].size,
      connected: true,
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}