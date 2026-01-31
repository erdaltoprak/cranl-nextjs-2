import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
};

export async function GET() {
  try {
    console.log('[Redis GET] Starting fetch...');
    const client = await getRedisClient();
    console.log('[Redis GET] Client connected');
    
    // Use scan instead of keys for better performance with large datasets
    const keys: string[] = [];
    let cursor = '0';
    
    do {
      const result = await client.scan(cursor, { MATCH: 'test:*', COUNT: 100 });
      console.log('[Redis GET] Scan result:', result);
      cursor = result.cursor;
      keys.push(...result.keys);
    } while (cursor !== '0');
    
    console.log('[Redis GET] Found keys:', keys);
    
    const values = await Promise.all(
      keys.map(async (key) => {
        const value = await client.get(key);
        const ttl = await client.ttl(key);
        console.log(`[Redis GET] Key: ${key}, Value: ${value}, TTL: ${ttl}`);
        return { key, value, ttl };
      })
    );
    
    console.log('[Redis GET] Returning items:', values);
    return NextResponse.json({ items: values }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('[Redis GET] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500, headers: NO_STORE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    console.log('[Redis POST] Starting...');
    const { key, value, ttl } = await request.json();
    console.log('[Redis POST] Received:', { key, value, ttl });
    
    const client = await getRedisClient();
    console.log('[Redis POST] Client connected');
    
    const normalizedKey = typeof key === 'string' ? key.trim() : '';
    if (!normalizedKey) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    if (typeof value !== 'string' || !value) {
      return NextResponse.json(
        { error: 'Value is required' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    const fullKey = normalizedKey.startsWith('test:') ? normalizedKey : `test:${normalizedKey}`;
    console.log('[Redis POST] Setting key:', fullKey);
    
    if (ttl && ttl > 0) {
      await client.setEx(fullKey, ttl, value);
      console.log('[Redis POST] Set with TTL:', ttl);
    } else {
      await client.set(fullKey, value);
      console.log('[Redis POST] Set without TTL');
    }
    
    // Verify the key was set
    const verifyValue = await client.get(fullKey);
    console.log('[Redis POST] Verified value:', verifyValue);
    
    return NextResponse.json(
      { success: true, key: fullKey, value: verifyValue },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    console.error('[Redis POST] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
