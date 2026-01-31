import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

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
    return NextResponse.json({ items: values });
  } catch (error) {
    console.error('[Redis GET] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('[Redis POST] Starting...');
    const { key, value, ttl } = await request.json();
    console.log('[Redis POST] Received:', { key, value, ttl });
    
    const client = await getRedisClient();
    console.log('[Redis POST] Client connected');
    
    const fullKey = `test:${key}`;
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
    
    return NextResponse.json({ success: true, key: fullKey, value: verifyValue });
  } catch (error) {
    console.error('[Redis POST] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}