import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function GET() {
  try {
    const client = await getRedisClient();
    
    const info = await client.info();
    const ping = await client.ping();
    const dbsize = await client.dbSize();
    
    return NextResponse.json({
      connected: true,
      ping,
      dbSize: dbsize,
      info: info.split('\n').slice(0, 20).join('\n'),
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}