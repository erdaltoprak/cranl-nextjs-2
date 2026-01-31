import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

export async function GET() {
  try {
    const client = await getRedisClient();
    const keys = await client.keys('test:*');
    const values = await Promise.all(
      keys.map(async (key) => {
        const value = await client.get(key);
        const ttl = await client.ttl(key);
        return { key, value, ttl };
      })
    );
    
    return NextResponse.json({ items: values });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { key, value, ttl } = await request.json();
    const client = await getRedisClient();
    
    const fullKey = `test:${key}`;
    if (ttl && ttl > 0) {
      await client.setEx(fullKey, ttl, value);
    } else {
      await client.set(fullKey, value);
    }
    
    return NextResponse.json({ success: true, key: fullKey });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}